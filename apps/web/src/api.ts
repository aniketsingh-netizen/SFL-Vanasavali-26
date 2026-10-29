import type { FamilyEvent, HistoryEvent, Lineage, Member, Relationship } from "./types";
import { demoApi } from "./demo";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers }
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(result.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  members: (params = "") => isDemoMode ? demoApi.members(params) : request<Member[]>(`/members${params}`),
  member: (id: string) => isDemoMode ? demoApi.member(id) : request<Member>(`/members/${id}`),
  saveMember: (data: Partial<Member>, id?: string) => isDemoMode ? demoApi.saveMember(data, id) : request<Member>(id ? `/members/${id}` : "/members", { method: id ? "PATCH" : "POST", body: JSON.stringify(data) }),
  lineages: () => isDemoMode ? demoApi.lineages() : request<Lineage[]>("/lineages"),
  createLineage: (data: Partial<Lineage>) => isDemoMode ? demoApi.createLineage(data) : request<Lineage>("/lineages", { method: "POST", body: JSON.stringify(data) }),
  relationships: (lineageId?: string) => isDemoMode ? demoApi.relationships(lineageId) : request<Relationship[]>(`/relationships${lineageId ? `?lineageId=${lineageId}` : ""}`),
  createRelationship: (data: Pick<Relationship, "sourceId" | "targetId" | "type">) => isDemoMode ? demoApi.createRelationship(data) : request<Relationship>("/relationships", { method: "POST", body: JSON.stringify(data) }),
  events: () => isDemoMode ? demoApi.events() : request<FamilyEvent[]>("/events"),
  history: () => isDemoMode ? demoApi.history() : request<HistoryEvent[]>("/historical-events"),
  createEvent: (data: Omit<FamilyEvent, "id" | "member">) => isDemoMode ? demoApi.createEvent(data) : request<FamilyEvent>("/events", { method: "POST", body: JSON.stringify(data) }),
  createHistoricalEvent: (data: Omit<HistoryEvent, "id">) => isDemoMode ? demoApi.createHistoricalEvent(data) : request<HistoryEvent>("/historical-events", { method: "POST", body: JSON.stringify(data) })
};
