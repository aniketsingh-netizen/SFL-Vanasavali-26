import type { FamilyEvent, HistoryEvent, Lineage, Member, Relationship } from "./types";

type DemoState = {
  lineages: Lineage[];
  members: Member[];
  relationships: Relationship[];
  events: FamilyEvent[];
  history: HistoryEvent[];
};

const storageKey = "vansavali-demo-state-v1";

function seedState(): DemoState {
  const paternal: Lineage = { id: "lineage-iyer", name: "The Iyer family", description: "Stories from the paternal branch." };
  const maternal: Lineage = { id: "lineage-mehra", name: "The Mehra family", description: "Stories from the maternal branch." };
  const lineages = [paternal, maternal];
  const members: Member[] = [
    { id: "member-keshav", fullName: "Keshav Iyer", birthDate: "1916-03-08", deathDate: "1992-11-14", birthplace: "Thanjavur, Tamil Nadu", occupation: "Schoolteacher", currentLocation: "Chennai, Tamil Nadu", biography: "Keshav taught mathematics for over thirty years. He kept a garden of jasmine and wrote letters to his grandchildren every Sunday.", generation: -2, lineages: [{ lineage: paternal }] },
    { id: "member-kamala", fullName: "Kamala Iyer", alternativeName: "Kamala Srinivasan", birthDate: "1921-08-19", deathDate: "2001-02-03", birthplace: "Kumbakonam, Tamil Nadu", occupation: "Weaver", currentLocation: "Chennai, Tamil Nadu", biography: "Kamala was known for her intricate silk weaving and for remembering every family birthday by heart.", generation: -2, lineages: [{ lineage: paternal }] },
    { id: "member-leela", fullName: "Leela Iyer", birthDate: "1944-05-22", deathDate: "2018-09-10", birthplace: "Thanjavur, Tamil Nadu", occupation: "Doctor", currentLocation: "Chennai, Tamil Nadu", biography: "Leela studied medicine in Madras and spent her career caring for families in her neighbourhood.", generation: -1, lineages: [{ lineage: paternal }] },
    { id: "member-ravi", fullName: "Ravi Iyer", birthDate: "1948-01-17", birthplace: "Thanjavur, Tamil Nadu", occupation: "Civil engineer", currentLocation: "Bengaluru, Karnataka", biography: "Ravi helped build roads that connected smaller towns across Tamil Nadu before moving to Bengaluru.", generation: -1, lineages: [{ lineage: paternal }] },
    { id: "member-arjun", fullName: "Arjun Mehra", birthDate: "1946-11-06", birthplace: "Amritsar, Punjab", occupation: "Historian", currentLocation: "Delhi, India", biography: "Arjun collected oral histories and treasured the stories passed down by his parents.", generation: -1, lineages: [{ lineage: maternal }] },
    { id: "member-meera", fullName: "Meera Mehra", birthDate: "1949-02-13", birthplace: "Chandigarh, Punjab", occupation: "Librarian", currentLocation: "Delhi, India", biography: "Meera spent her life among books and believed every family should keep a record of its stories.", generation: -1, lineages: [{ lineage: maternal }] },
    { id: "member-ananya", fullName: "Ananya Iyer", alternativeName: "Ananya Mehra", birthDate: "1976-07-14", birthplace: "Chennai, Tamil Nadu", occupation: "Architect", currentLocation: "Bengaluru, Karnataka", biography: "Ananya grew up between **Chennai** and **Delhi**, hearing family stories from both sides.\n\nShe now sketches the old streets and homes her grandparents described.", generation: 0, lineages: [{ lineage: paternal }, { lineage: maternal }] },
    { id: "member-dev", fullName: "Dev Iyer", birthDate: "1979-10-28", birthplace: "Chennai, Tamil Nadu", occupation: "Botanist", currentLocation: "Bengaluru, Karnataka", biography: "Dev studies native plants and inherited his grandmother's love of the garden.", generation: 0, lineages: [{ lineage: paternal }] },
    { id: "member-kiran", fullName: "Kiran Iyer", birthDate: "2004-04-02", birthplace: "Bengaluru, Karnataka", occupation: "Student", currentLocation: "Bengaluru, Karnataka", biography: "Kiran is gathering photographs and recordings to preserve the family's oral history.", generation: 1, lineages: [{ lineage: paternal }, { lineage: maternal }] },
    { id: "member-nila", fullName: "Nila Iyer", birthDate: "2008-12-11", birthplace: "Bengaluru, Karnataka", occupation: "Student", currentLocation: "Bengaluru, Karnataka", biography: "Nila loves drawing family portraits and asking her elders about the places they remember.", generation: 1, lineages: [{ lineage: paternal }, { lineage: maternal }] }
  ];
  const relationship = (id: string, sourceId: string, targetId: string, type: Relationship["type"], source: Member, target: Member): Relationship => ({ id, sourceId, targetId, type, source, target });
  const byId = new Map(members.map((member) => [member.id, member]));
  const relationships = [
    relationship("rel-keshav-kamala", "member-keshav", "member-kamala", "SPOUSE", byId.get("member-keshav")!, byId.get("member-kamala")!),
    relationship("rel-keshav-leela", "member-keshav", "member-leela", "PARENT_CHILD", byId.get("member-keshav")!, byId.get("member-leela")!),
    relationship("rel-kamala-leela", "member-kamala", "member-leela", "PARENT_CHILD", byId.get("member-kamala")!, byId.get("member-leela")!),
    relationship("rel-keshav-ravi", "member-keshav", "member-ravi", "PARENT_CHILD", byId.get("member-keshav")!, byId.get("member-ravi")!),
    relationship("rel-kamala-ravi", "member-kamala", "member-ravi", "PARENT_CHILD", byId.get("member-kamala")!, byId.get("member-ravi")!),
    relationship("rel-leela-ravi", "member-leela", "member-ravi", "SIBLING", byId.get("member-leela")!, byId.get("member-ravi")!),
    relationship("rel-arjun-meera", "member-arjun", "member-meera", "SPOUSE", byId.get("member-arjun")!, byId.get("member-meera")!),
    relationship("rel-leela-ananya", "member-leela", "member-ananya", "PARENT_CHILD", byId.get("member-leela")!, byId.get("member-ananya")!),
    relationship("rel-arjun-ananya", "member-arjun", "member-ananya", "PARENT_CHILD", byId.get("member-arjun")!, byId.get("member-ananya")!),
    relationship("rel-leela-dev", "member-leela", "member-dev", "PARENT_CHILD", byId.get("member-leela")!, byId.get("member-dev")!),
    relationship("rel-arjun-dev", "member-arjun", "member-dev", "PARENT_CHILD", byId.get("member-arjun")!, byId.get("member-dev")!),
    relationship("rel-ananya-dev", "member-ananya", "member-dev", "SIBLING", byId.get("member-ananya")!, byId.get("member-dev")!),
    relationship("rel-ananya-kiran", "member-ananya", "member-kiran", "PARENT_CHILD", byId.get("member-ananya")!, byId.get("member-kiran")!),
    relationship("rel-dev-kiran", "member-dev", "member-kiran", "PARENT_CHILD", byId.get("member-dev")!, byId.get("member-kiran")!),
    relationship("rel-ananya-nila", "member-ananya", "member-nila", "PARENT_CHILD", byId.get("member-ananya")!, byId.get("member-nila")!),
    relationship("rel-dev-nila", "member-dev", "member-nila", "PARENT_CHILD", byId.get("member-dev")!, byId.get("member-nila")!)
  ];
  const events: FamilyEvent[] = [
    { id: "event-leela-born", memberId: "member-leela", title: "A new beginning", description: "Leela was born into the Iyer family in Thanjavur.", date: "1944-05-22", type: "BIRTH", location: "Thanjavur, Tamil Nadu", member: { id: "member-leela", fullName: "Leela Iyer" } },
    { id: "event-ananya-born", memberId: "member-ananya", title: "Ananya is born", description: "The next generation of both the Iyer and Mehra families begins.", date: "1976-07-14", type: "BIRTH", location: "Chennai, Tamil Nadu", member: { id: "member-ananya", fullName: "Ananya Iyer" } },
    { id: "event-move", memberId: "member-ananya", title: "A new home in Bengaluru", description: "Ananya and Dev made Bengaluru their home, bringing family traditions from Chennai and Delhi.", date: "2001-08-01", type: "MIGRATION", location: "Bengaluru, Karnataka", member: { id: "member-ananya", fullName: "Ananya Iyer" } },
    { id: "event-kiran-born", memberId: "member-kiran", title: "Kiran joins the family", description: "A bright new chapter for both branches.", date: "2004-04-02", type: "BIRTH", location: "Bengaluru, Karnataka", member: { id: "member-kiran", fullName: "Kiran Iyer" } },
    { id: "event-nila-born", memberId: "member-nila", title: "Nila joins the family", description: "Another little storyteller finds her place in the family.", date: "2008-12-11", type: "BIRTH", location: "Bengaluru, Karnataka", member: { id: "member-nila", fullName: "Nila Iyer" } }
  ];
  const history: HistoryEvent[] = [
    { id: "history-independence", title: "India becomes independent", description: "The Indian Independence Act ends British rule and marks the beginning of a new nation.", date: "1947-08-15", location: "India" },
    { id: "history-constitution", title: "The Constitution comes into effect", description: "India becomes a sovereign democratic republic.", date: "1950-01-26", location: "New Delhi, India" },
    { id: "history-moon", title: "First human steps on the Moon", description: "Apollo 11 lands on the lunar surface in a moment watched around the world.", date: "1969-07-20", location: "The Moon" },
    { id: "history-web", title: "The World Wide Web is introduced", description: "A new way for people and stories to connect begins to take shape.", date: "1991-08-06", location: "CERN, Switzerland" }
  ];
  return { lineages, members, relationships, events, history };
}

function readState(): DemoState {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return seedState();
  try {
    return JSON.parse(saved) as DemoState;
  } catch {
    return seedState();
  }
}

function writeState(state: DemoState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function includedMember(member: Member, lineageId?: string) {
  return !lineageId || member.lineages?.some(({ lineage }) => lineage.id === lineageId);
}

export function resetDemo() {
  localStorage.removeItem(storageKey);
  window.location.reload();
}

export const demoApi = {
  async members(params = "") {
    const state = readState();
    const query = new URLSearchParams(params.replace(/^\?/, ""));
    const name = query.get("q")?.toLocaleLowerCase();
    const location = query.get("location")?.toLocaleLowerCase();
    const generation = query.get("generation");
    const lineageId = query.get("lineageId") ?? undefined;
    const birthFrom = query.get("birthFrom") ?? "";
    const birthTo = query.get("birthTo") ?? "9999-12-31";
    return state.members.filter((member) => {
      const birthDate = member.birthDate?.slice(0, 10) ?? "";
      return includedMember(member, lineageId)
        && (!name || member.fullName.toLocaleLowerCase().includes(name) || member.alternativeName?.toLocaleLowerCase().includes(name))
        && (!location || member.birthplace?.toLocaleLowerCase().includes(location) || member.currentLocation?.toLocaleLowerCase().includes(location))
        && (generation === null || member.generation === Number(generation))
        && (!birthFrom || Boolean(birthDate && birthDate >= birthFrom && birthDate <= birthTo));
    });
  },
  async member(id: string) {
    const member = readState().members.find((item) => item.id === id);
    if (!member) throw new Error("Member not found");
    return member;
  },
  async saveMember(data: Partial<Member>, id?: string) {
    const state = readState();
    const draft = data as Partial<Member> & { lineageIds?: string[] };
    const current = id ? state.members.find((member) => member.id === id) : undefined;
    const memberId = id ?? `member-${crypto.randomUUID()}`;
    const lineageIds = draft.lineageIds ?? current?.lineages?.map(({ lineage }) => lineage.id) ?? [];
    const member: Member = {
      id: memberId,
      fullName: draft.fullName ?? current?.fullName ?? "",
      alternativeName: draft.alternativeName ?? null,
      birthDate: draft.birthDate ?? null,
      deathDate: draft.deathDate ?? null,
      birthplace: draft.birthplace ?? null,
      occupation: draft.occupation ?? null,
      currentLocation: draft.currentLocation ?? null,
      photoUrl: draft.photoUrl ?? null,
      biography: draft.biography ?? "",
      generation: draft.generation ?? 0,
      lineages: state.lineages.filter((lineage) => lineageIds.includes(lineage.id)).map((lineage) => ({ lineage }))
    };
    if (current) state.members = state.members.map((item) => item.id === memberId ? member : item);
    else state.members.push(member);
    writeState(state);
    return member;
  },
  async lineages() {
    return readState().lineages;
  },
  async createLineage(data: Partial<Lineage>) {
    const state = readState();
    const lineage = { id: `lineage-${crypto.randomUUID()}`, name: data.name ?? "New lineage", description: data.description ?? "" };
    state.lineages.push(lineage);
    writeState(state);
    return lineage;
  },
  async relationships(lineageId?: string) {
    const state = readState();
    const byId = new Map(state.members.map((member) => [member.id, member]));
    return state.relationships.filter((edge) => {
      const source = byId.get(edge.sourceId);
      const target = byId.get(edge.targetId);
      return source && target && includedMember(source, lineageId) && includedMember(target, lineageId);
    }).map((edge) => ({ ...edge, source: byId.get(edge.sourceId)!, target: byId.get(edge.targetId)! }));
  },
  async createRelationship(data: Pick<Relationship, "sourceId" | "targetId" | "type">) {
    const state = readState();
    if (data.sourceId === data.targetId) throw new Error("A member cannot have a relationship with themselves");
    const [sourceId, targetId] = data.type !== "PARENT_CHILD" && data.sourceId > data.targetId
      ? [data.targetId, data.sourceId]
      : [data.sourceId, data.targetId];
    if (data.type === "PARENT_CHILD") {
      const pending = [targetId];
      const visited = new Set<string>();
      while (pending.length) {
        const current = pending.pop()!;
        if (current === sourceId) throw new Error("Parent-child relationship would create a cycle");
        if (visited.has(current)) continue;
        visited.add(current);
        pending.push(...state.relationships.filter((edge) => edge.type === "PARENT_CHILD" && edge.sourceId === current).map((edge) => edge.targetId));
      }
    }
    const relationship = {
      id: `relationship-${crypto.randomUUID()}`,
      sourceId,
      targetId,
      type: data.type,
      source: state.members.find((member) => member.id === sourceId)!,
      target: state.members.find((member) => member.id === targetId)!
    };
    if (!relationship.source || !relationship.target) throw new Error("Choose two existing family members");
    state.relationships.push(relationship);
    writeState(state);
    return relationship;
  },
  async events() {
    return readState().events;
  },
  async history() {
    return readState().history;
  },
  async createEvent(data: Omit<FamilyEvent, "id" | "member">) {
    const state = readState();
    const member = state.members.find((item) => item.id === data.memberId);
    if (!member) throw new Error("Choose an existing family member");
    const event = { ...data, id: `event-${crypto.randomUUID()}`, member: { id: member.id, fullName: member.fullName } };
    state.events.push(event);
    writeState(state);
    return event;
  },
  async createHistoricalEvent(data: Omit<HistoryEvent, "id">) {
    const state = readState();
    const event = { ...data, id: `history-${crypto.randomUUID()}` };
    state.history.push(event);
    writeState(state);
    return event;
  }
};
