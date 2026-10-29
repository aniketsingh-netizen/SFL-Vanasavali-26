import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: "../../.env" });
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { Prisma, RelationshipType, TimelineEventType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./db.js";
import { canonicalPair, createsParentCycle, type Edge } from "./tree.js";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const id = z.string().min(1).max(64);
const date = z.string().date().transform((value) => new Date(`${value}T00:00:00.000Z`));
const optionalDate = z.preprocess((value) => value === "" ? null : value, date.nullable().optional());
const optionalText = (max: number) => z.preprocess(
  (value) => value === "" ? null : value,
  z.string().trim().max(max).nullable().optional()
);
const memberInput = z.object({
  fullName: z.string().trim().min(1).max(160),
  alternativeName: optionalText(160),
  birthDate: optionalDate,
  deathDate: optionalDate,
  birthplace: optionalText(160),
  occupation: optionalText(160),
  currentLocation: optionalText(160),
  photoUrl: z.preprocess((value) => value === "" ? null : value, z.string().url().max(2048).refine((value) => value.startsWith("http://") || value.startsWith("https://"), "Photo URL must use HTTP or HTTPS").nullable().optional()),
  biography: z.string().max(20000).optional(),
  generation: z.number().int().min(-100).max(100).optional(),
  lineageIds: z.array(id).max(30).optional()
});
const lineageInput = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  parentLineageId: id.nullable().optional()
});
const relationshipInput = z.object({
  sourceId: id,
  targetId: id,
  type: z.nativeEnum(RelationshipType)
});
const eventInput = z.object({
  memberId: id,
  title: z.string().trim().min(1).max(160),
  description: z.string().max(4000).optional(),
  date,
  type: z.nativeEnum(TimelineEventType).optional(),
  location: z.string().max(160).nullable().optional()
});
const historyInput = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(4000).optional(),
  date,
  location: z.string().max(160).nullable().optional()
});

function parseId(value: unknown) {
  return id.parse(value);
}

function sendError(res: express.Response, error: unknown) {
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message ?? "Invalid input" });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ error: "That record already exists" });
    if (error.code === "P2025" || error.code === "P2003") return res.status(404).json({ error: "Related record not found" });
    if (error.code === "P2034") return res.status(409).json({ error: "The relationship changed concurrently; please retry" });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function handle(run: (req: express.Request, res: express.Response) => Promise<unknown>) {
  return (req: express.Request, res: express.Response) => {
    run(req, res).catch((error) => sendError(res, error));
  };
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/lineages", handle(async (_req, res) => {
  res.json(await prisma.lineage.findMany({ include: { _count: { select: { members: true } } }, orderBy: { name: "asc" } }));
}));
app.post("/api/lineages", handle(async (req, res) => {
  const data = lineageInput.parse(req.body);
  res.status(201).json(await prisma.lineage.create({ data }));
}));
app.get("/api/lineages/:id", handle(async (req, res) => {
  res.json(await prisma.lineage.findUniqueOrThrow({ where: { id: parseId(req.params.id) }, include: { members: { include: { member: true } } } }));
}));
app.patch("/api/lineages/:id", handle(async (req, res) => {
  res.json(await prisma.lineage.update({ where: { id: parseId(req.params.id) }, data: lineageInput.partial().parse(req.body) }));
}));
app.delete("/api/lineages/:id", handle(async (req, res) => {
  await prisma.lineage.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
}));

app.get("/api/members", handle(async (req, res) => {
  const query = z.object({
    q: z.string().trim().max(160).optional(),
    generation: z.coerce.number().int().min(-100).max(100).optional(),
    location: z.string().trim().max(160).optional(),
    birthFrom: date.optional(),
    birthTo: date.optional(),
    lineageId: id.optional()
  }).parse(req.query);
  const clauses: Prisma.MemberWhereInput[] = [];
  if (query.q) clauses.push({ OR: [{ fullName: { contains: query.q, mode: "insensitive" } }, { alternativeName: { contains: query.q, mode: "insensitive" } }] });
  if (query.location) clauses.push({ OR: [{ birthplace: { contains: query.location, mode: "insensitive" } }, { currentLocation: { contains: query.location, mode: "insensitive" } }] });
  if (query.generation !== undefined) clauses.push({ generation: query.generation });
  if (query.birthFrom || query.birthTo) clauses.push({ birthDate: { gte: query.birthFrom, lte: query.birthTo } });
  if (query.lineageId) clauses.push({ lineages: { some: { lineageId: query.lineageId } } });
  const where: Prisma.MemberWhereInput = { AND: clauses };
  res.json(await prisma.member.findMany({
    where, include: { lineages: { include: { lineage: true } } }, orderBy: [{ generation: "asc" }, { fullName: "asc" }], take: 500
  }));
}));
app.post("/api/members", handle(async (req, res) => {
  const { lineageIds = [], ...data } = memberInput.parse(req.body);
  const member = await prisma.member.create({
    data: { ...data, lineages: { create: lineageIds.map((lineageId) => ({ lineage: { connect: { id: lineageId } } })) } },
    include: { lineages: { include: { lineage: true } } }
  });
  res.status(201).json(member);
}));
app.get("/api/members/:id", handle(async (req, res) => {
  res.json(await prisma.member.findUniqueOrThrow({
    where: { id: parseId(req.params.id) },
    include: { lineages: { include: { lineage: true } }, outgoing: true, incoming: true, events: { orderBy: { date: "asc" } } }
  }));
}));
app.patch("/api/members/:id", handle(async (req, res) => {
  const { lineageIds, ...data } = memberInput.partial().parse(req.body);
  res.json(await prisma.member.update({
    where: { id: parseId(req.params.id) },
    data: {
      ...data,
      ...(lineageIds ? { lineages: { deleteMany: {}, create: lineageIds.map((lineageId) => ({ lineage: { connect: { id: lineageId } } })) } } : {})
    },
    include: { lineages: { include: { lineage: true } } }
  }));
}));
app.delete("/api/members/:id", handle(async (req, res) => {
  await prisma.member.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
}));

app.get("/api/relationships", handle(async (req, res) => {
  const lineageId = req.query.lineageId ? id.parse(req.query.lineageId) : undefined;
  const where: Prisma.RelationshipWhereInput = lineageId ? {
    AND: [
      { source: { lineages: { some: { lineageId } } } },
      { target: { lineages: { some: { lineageId } } } }
    ]
  } : {};
  res.json(await prisma.relationship.findMany({ where, include: { source: true, target: true }, orderBy: { createdAt: "asc" } }));
}));
app.post("/api/relationships", handle(async (req, res) => {
  const parsed = relationshipInput.parse(req.body);
  if (parsed.sourceId === parsed.targetId) return res.status(400).json({ error: "A member cannot have a relationship with themselves" });
  const pair = canonicalPair(parsed.sourceId, parsed.targetId, parsed.type as Edge["type"]);
  const result = await prisma.$transaction(async (tx) => {
    const members = await tx.member.findMany({ where: { id: { in: [parsed.sourceId, parsed.targetId] } }, select: { id: true } });
    if (members.length !== 2) throw new ApiError("Member not found", 404);
    if (parsed.type === RelationshipType.PARENT_CHILD) {
      const edges = await tx.relationship.findMany({ where: { type: RelationshipType.PARENT_CHILD }, select: { sourceId: true, targetId: true, type: true } });
      if (createsParentCycle(edges as Edge[], pair.sourceId, pair.targetId)) throw new ApiError("Parent-child relationship would create a cycle", 400);
    }
    return tx.relationship.create({ data: { ...pair, type: parsed.type }, include: { source: true, target: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json(result);
}));
app.patch("/api/relationships/:id", handle(async (req, res) => {
  const relationshipId = parseId(req.params.id);
  const parsed = relationshipInput.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one relationship field").parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.relationship.findUnique({ where: { id: relationshipId } });
    if (!current) throw new ApiError("Relationship not found", 404);
    const next = {
      sourceId: parsed.sourceId ?? current.sourceId,
      targetId: parsed.targetId ?? current.targetId,
      type: parsed.type ?? current.type
    };
    if (next.sourceId === next.targetId) throw new ApiError("A member cannot have a relationship with themselves", 400);
    const pair = canonicalPair(next.sourceId, next.targetId, next.type as Edge["type"]);
    if (next.type === RelationshipType.PARENT_CHILD) {
      const edges = await tx.relationship.findMany({
        where: { type: RelationshipType.PARENT_CHILD, id: { not: relationshipId } },
        select: { sourceId: true, targetId: true, type: true }
      });
      if (createsParentCycle(edges as Edge[], pair.sourceId, pair.targetId)) throw new ApiError("Parent-child relationship would create a cycle", 400);
    }
    return tx.relationship.update({
      where: { id: relationshipId },
      data: { ...pair, type: next.type },
      include: { source: true, target: true }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json(result);
}));
app.delete("/api/relationships/:id", handle(async (req, res) => {
  await prisma.relationship.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
}));

app.get("/api/events", handle(async (req, res) => {
  const memberId = req.query.memberId ? id.parse(req.query.memberId) : undefined;
  res.json(await prisma.timelineEvent.findMany({
    where: memberId ? { memberId } : {}, include: { member: { select: { id: true, fullName: true } } }, orderBy: { date: "asc" }, take: 1000
  }));
}));
app.post("/api/events", handle(async (req, res) => {
  res.status(201).json(await prisma.timelineEvent.create({ data: eventInput.parse(req.body), include: { member: true } }));
}));
app.patch("/api/events/:id", handle(async (req, res) => {
  res.json(await prisma.timelineEvent.update({ where: { id: parseId(req.params.id) }, data: eventInput.partial().parse(req.body) }));
}));
app.delete("/api/events/:id", handle(async (req, res) => {
  await prisma.timelineEvent.delete({ where: { id: parseId(req.params.id) } });
  res.status(204).end();
}));

app.get("/api/historical-events", handle(async (_req, res) => {
  res.json(await prisma.historicalEvent.findMany({ orderBy: { date: "asc" }, take: 1000 }));
}));
app.post("/api/historical-events", handle(async (req, res) => {
  res.status(201).json(await prisma.historicalEvent.create({ data: historyInput.parse(req.body) }));
}));

const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => sendError(res, error);
app.use(errorMiddleware);

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => console.log(`Vansavali API listening on http://localhost:${port}`));
