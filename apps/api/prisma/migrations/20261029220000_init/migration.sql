CREATE TYPE "RelationshipType" AS ENUM ('PARENT_CHILD', 'SPOUSE', 'SIBLING');
CREATE TYPE "TimelineEventType" AS ENUM ('BIRTH', 'DEATH', 'MIGRATION', 'ACHIEVEMENT', 'MARRIAGE', 'OTHER');

CREATE TABLE "Lineage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "parentLineageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lineage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "alternativeName" TEXT,
    "birthDate" DATE,
    "deathDate" DATE,
    "birthplace" TEXT,
    "occupation" TEXT,
    "currentLocation" TEXT,
    "photoUrl" TEXT,
    "biography" TEXT NOT NULL DEFAULT '',
    "generation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberLineage" (
    "memberId" TEXT NOT NULL,
    "lineageId" TEXT NOT NULL,
    CONSTRAINT "MemberLineage_pkey" PRIMARY KEY ("memberId", "lineageId")
);

CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "type" "TimelineEventType" NOT NULL DEFAULT 'OTHER',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HistoricalEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lineage_parentLineageId_idx" ON "Lineage"("parentLineageId");
CREATE INDEX "Member_fullName_idx" ON "Member"("fullName");
CREATE INDEX "Member_birthDate_idx" ON "Member"("birthDate");
CREATE INDEX "Member_generation_idx" ON "Member"("generation");
CREATE INDEX "MemberLineage_lineageId_idx" ON "MemberLineage"("lineageId");
CREATE UNIQUE INDEX "Relationship_sourceId_targetId_type_key" ON "Relationship"("sourceId", "targetId", "type");
CREATE INDEX "Relationship_sourceId_type_idx" ON "Relationship"("sourceId", "type");
CREATE INDEX "Relationship_targetId_type_idx" ON "Relationship"("targetId", "type");
CREATE INDEX "TimelineEvent_date_idx" ON "TimelineEvent"("date");
CREATE INDEX "TimelineEvent_memberId_date_idx" ON "TimelineEvent"("memberId", "date");
CREATE INDEX "HistoricalEvent_date_idx" ON "HistoricalEvent"("date");

ALTER TABLE "Lineage" ADD CONSTRAINT "Lineage_parentLineageId_fkey"
  FOREIGN KEY ("parentLineageId") REFERENCES "Lineage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemberLineage" ADD CONSTRAINT "MemberLineage_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberLineage" ADD CONSTRAINT "MemberLineage_lineageId_fkey"
  FOREIGN KEY ("lineageId") REFERENCES "Lineage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_targetId_fkey"
  FOREIGN KEY ("targetId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
