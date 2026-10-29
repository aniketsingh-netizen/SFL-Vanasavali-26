export type Lineage = { id: string; name: string; description: string };
export type Member = {
  id: string;
  fullName: string;
  alternativeName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthplace?: string | null;
  occupation?: string | null;
  currentLocation?: string | null;
  photoUrl?: string | null;
  biography: string;
  generation: number;
  lineages?: { lineage: Lineage }[];
};
export type Relationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type: "PARENT_CHILD" | "SPOUSE" | "SIBLING";
  source: Member;
  target: Member;
};
export type FamilyEvent = {
  id: string;
  memberId: string;
  title: string;
  description: string;
  date: string;
  type: string;
  location?: string | null;
  member: { id: string; fullName: string };
};
export type HistoryEvent = { id: string; title: string; description: string; date: string; location?: string | null };
