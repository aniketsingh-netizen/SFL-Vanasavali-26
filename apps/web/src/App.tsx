import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, ChevronDown, CircleHelp, GitBranch, Plus, Search, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { api, isDemoMode } from "./api";
import { resetDemo } from "./demo";
import FamilyTree from "./components/FamilyTree";
import MemberPanel, { type MemberDraft } from "./components/MemberPanel";
import Timeline from "./components/Timeline";
import type { FamilyEvent, HistoryEvent, Lineage, Member, Relationship } from "./types";

type Tab = "tree" | "timeline";

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [lineages, setLineages] = useState<Lineage[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [selected, setSelected] = useState<Member>();
  const [tab, setTab] = useState<Tab>("tree");
  const [lineageId, setLineageId] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [generation, setGeneration] = useState("");
  const [birthEra, setBirthEra] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [addRelationship, setAddRelationship] = useState(false);
  const [addEvent, setAddEvent] = useState(false);
  const [eventDraft, setEventDraft] = useState({ scope: "family", memberId: "", title: "", description: "", date: "", type: "OTHER", location: "" });
  const [relationshipDraft, setRelationshipDraft] = useState({ sourceId: "", targetId: "", type: "PARENT_CHILD" as Relationship["type"] });

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (lineageId) params.set("lineageId", lineageId);
      if (query.trim()) params.set("q", query.trim());
      if (location.trim()) params.set("location", location.trim());
      if (generation !== "") params.set("generation", generation);
      if (birthEra) {
        const [from, to] = birthEra.split("-");
        params.set("birthFrom", `${from}-01-01`);
        params.set("birthTo", `${to}-12-31`);
      }
      const [foundMembers, foundLineages, foundRelationships, foundEvents, foundHistory] = await Promise.all([
        api.members(params.toString() ? `?${params}` : ""), api.lineages(),
        api.relationships(lineageId || undefined), api.events(), api.history()
      ]);
      setMembers(foundMembers);
      setLineages(foundLineages);
      setRelationships(foundRelationships);
      setEvents(foundEvents);
      setHistory(foundHistory);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load your family history.");
    } finally {
      setLoading(false);
    }
  }, [lineageId, query, location, generation, birthEra]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedLineage = lineages.find((lineage) => lineage.id === lineageId);
  const generations = useMemo(() => new Set(members.map((member) => member.generation)).size, [members]);

  async function saveMember(data: MemberDraft, id?: string) {
    setSaving(true);
    try {
      const member = await api.saveMember(data, id);
      await reload();
      setSelected(member);
      setToast(id ? "Family profile updated" : "New family member added");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this member.");
    } finally {
      setSaving(false);
    }
  }

  async function createLineage() {
    const name = window.prompt("What should this family branch be called?");
    if (!name?.trim()) return;
    try {
      const lineage = await api.createLineage({ name: name.trim() });
      setLineageId(lineage.id);
      await reload();
      setToast(`${lineage.name} lineage created`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create lineage.");
    }
  }

  async function saveRelationship(event: FormEvent) {
    event.preventDefault();
    try {
      await api.createRelationship(relationshipDraft);
      setAddRelationship(false);
      setRelationshipDraft({ sourceId: "", targetId: "", type: "PARENT_CHILD" });
      await reload();
      setToast("Relationship connected");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not connect these members.");
    }
  }

  async function saveEvent(event: FormEvent) {
    event.preventDefault();
    try {
      const { scope, ...data } = eventDraft;
      if (scope === "global") await api.createHistoricalEvent(data);
      else await api.createEvent(data);
      setAddEvent(false);
      setEventDraft({ scope: "family", memberId: "", title: "", description: "", date: "", type: "OTHER", location: "" });
      await reload();
      setToast(scope === "global" ? "Historical event added to the timeline" : "Milestone added to the timeline");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this milestone.");
    }
  }

  const filteredView = Boolean(query || location || generation !== "" || birthEra);
  const descendants = members.filter((member) => member.generation > 0).length;
  const ancestors = members.filter((member) => member.generation < 0).length;
  return (
    <div className={`app-shell ${panelOpen ? "" : "panel-closed"}`}>
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Vansavali home"><span className="brand-mark">व</span><span>vansavali<small>FAMILY ARCHIVE</small></span></a>
        <div className="side-label">YOUR FAMILY</div>
        <button className={`lineage-link ${!lineageId ? "active" : ""}`} onClick={() => setLineageId("")}><Users size={16} />All lineages<span>{members.length}</span></button>
        <div className="lineage-caption">LINEAGES <button onClick={() => void createLineage()} aria-label="Create lineage"><Plus size={14} /></button></div>
        <div className="lineage-menu">
          {lineages.map((lineage) => <button key={lineage.id} className={`lineage-link ${lineage.id === lineageId ? "active" : ""}`} onClick={() => setLineageId(lineage.id)}><GitBranch size={15} />{lineage.name}<span>{members.filter((member) => member.lineages?.some(({ lineage: item }) => item.id === lineage.id)).length}</span></button>)}
          {!lineages.length && !loading && <p className="side-empty">Add a lineage to gather a family branch.</p>}
        </div>
        <button className="new-lineage" onClick={() => void createLineage()}><Plus size={15} />Create a lineage</button>
        <div className="sidebar-bottom">
          <div className="archive-note"><Sparkles size={16} /><p><strong>A living archive</strong><br />Every branch holds a story waiting to be remembered.</p></div>
          <button className="help-button"><CircleHelp size={15} />About Vansavali</button>
          <div className="user-chip"><span>V</span><div><strong>Family archivist</strong><small>Personal archive</small></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>My archive</span><span>/</span><strong>{selectedLineage?.name ?? "All lineages"}</strong></div>
          <div className="top-actions">
            {isDemoMode && <button className="demo-badge" title="This preview stores sample changes only in this browser" onClick={resetDemo}><span />Preview · reset</button>}
            <button className={`search-toggle ${searchOpen ? "active" : ""}`} onClick={() => setSearchOpen(!searchOpen)}><Search size={16} /><span>Search family</span><kbd>⌘ K</kbd></button>
            <button className="primary-button top-add" onClick={() => { setSelected(undefined); setPanelOpen(true); }}><Plus size={16} />Add member</button>
          </div>
        </header>
        <section className="page-content">
          <div className="welcome-row">
            <div><div className="eyebrow"><span />YOUR FAMILY, CONNECTED</div><h1>{selectedLineage?.name ?? "The family tree"}</h1><p className="subtitle">A place for the people, places, and stories that made you.</p></div>
            <div className="stats"><div><strong>{members.length}</strong><span>MEMBERS</span></div><div><strong>{generations || 0}</strong><span>GENERATIONS</span></div><div><strong>{lineages.length}</strong><span>LINEAGES</span></div></div>
          </div>
          <div className="toolbar">
            <div className="view-tabs"><button className={tab === "tree" ? "selected" : ""} onClick={() => setTab("tree")}><GitBranch size={15} />Family tree</button><button className={tab === "timeline" ? "selected" : ""} onClick={() => setTab("timeline")}><BookOpen size={15} />Timeline</button></div>
            <div className="toolbar-actions">
              <button className={`filter-button ${showFilters || filteredView ? "filter-active" : ""}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} />Filters{filteredView && <span className="filter-dot" />}</button>
              <button className="outline-button" disabled={members.length < 2} onClick={() => { setRelationshipDraft({ sourceId: selected?.id ?? "", targetId: "", type: "PARENT_CHILD" }); setAddRelationship(true); }}>Connect members</button>
            </div>
          </div>
          {(searchOpen || showFilters) && <div className="filter-panel">
            {searchOpen && <label className="search-field"><Search size={15} /><input autoFocus placeholder="Search a name or maiden name..." value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => { setQuery(""); setSearchOpen(false); }} aria-label="Clear search"><X size={14} /></button></label>}
            {showFilters && <><label className="filter-field">Location<input placeholder="Birth or current location" value={location} onChange={(event) => setLocation(event.target.value)} /></label><label className="filter-field">Generation<select value={generation} onChange={(event) => setGeneration(event.target.value)}><option value="">All generations</option>{[...new Set(members.map((member) => member.generation))].sort((a, b) => a - b).map((value) => <option key={value} value={value}>{value === 0 ? "Home generation" : value < 0 ? `${Math.abs(value)} generation${value < -1 ? "s" : ""} before` : `${value} generation${value > 1 ? "s" : ""} after`}</option>)}</select></label><label className="filter-field">Birth era<select value={birthEra} onChange={(event) => setBirthEra(event.target.value)}><option value="">Any era</option><option value="1800-1899">1800–1899</option><option value="1900-1949">1900–1949</option><option value="1950-1999">1950–1999</option><option value="2000-2099">2000–2099</option></select></label>{filteredView && <button className="clear-filters" onClick={() => { setLocation(""); setGeneration(""); setBirthEra(""); setQuery(""); }}>Clear all</button>}</>}
          </div>}
          {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}><X size={15} /></button><button onClick={() => void reload()}>Retry</button></div>}
          <div className="content-card">
            {tab === "tree" ? <>
              <div className="tree-header"><div><h2>{filteredView ? `Matching members${members.length ? ` · ${members.length}` : ""}` : "Generations"}</h2><p>{ancestors} ancestors <span>·</span> {descendants} descendants</p></div><div className="tree-key"><span className="key-line" />Parent & child<span className="key-dash" />Partner</div></div>
              <div className="tree-stage">{loading ? <div className="loading-state"><span className="spinner" />Gathering your family stories...</div> : <FamilyTree members={members} relationships={relationships} selectedId={selected?.id} onSelect={(member) => { setSelected(member); setPanelOpen(true); }} />}</div>
              <div className="tree-footer"><span>Click a person to open their story</span><span>Drag to explore · Scroll to zoom</span></div>
            </> : <><div className="tree-header"><div><h2>Family through time</h2><p>Personal milestones alongside the wider world</p></div></div><div className="timeline-stage"><Timeline events={events.filter((event) => !lineageId || members.some((member) => member.id === event.memberId))} history={history} onAddEvent={() => setAddEvent(true)} /></div></>}
          </div>
          {tab === "tree" && <div className="insight-strip"><div className="insight-icon">✳</div><p><strong>Stories make a family tree come alive.</strong><span>Add a biography or a milestone to keep their memory close.</span></p><button onClick={() => { setTab("timeline"); }}>Explore timeline <span>→</span></button></div>}
        </section>
      </main>
      {panelOpen && <MemberPanel member={selected} lineages={lineages} selectedLineageId={lineageId || undefined} onClose={() => { setSelected(undefined); setPanelOpen(false); }} onSave={saveMember} onAdd={() => { setSelected(undefined); setPanelOpen(true); }} saving={saving} />}
      {addRelationship && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddRelationship(false); }}><form className="relationship-modal" onSubmit={saveRelationship}><div className="modal-title"><div><span>CONNECT YOUR STORY</span><h2>Link two members</h2></div><button type="button" className="icon-button" onClick={() => setAddRelationship(false)}><X size={18} /></button></div><p>Relationships connect people across generations and lineages.</p><label className="form-field">Relationship<select value={relationshipDraft.type} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, type: event.target.value as Relationship["type"] })}><option value="PARENT_CHILD">Parent → child</option><option value="SPOUSE">Spouse / partner</option><option value="SIBLING">Sibling</option></select></label><label className="form-field">{relationshipDraft.type === "PARENT_CHILD" ? "Parent" : "First member"}<select required value={relationshipDraft.sourceId} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, sourceId: event.target.value })}><option value="">Choose a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select></label><label className="form-field">{relationshipDraft.type === "PARENT_CHILD" ? "Child" : "Second member"}<select required value={relationshipDraft.targetId} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, targetId: event.target.value })}><option value="">Choose a member</option>{members.map((member) => <option key={member.id} value={member.id} disabled={member.id === relationshipDraft.sourceId}>{member.fullName}</option>)}</select></label><button className="primary-button wide">Create connection</button></form></div>}
      {addEvent && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddEvent(false); }}><form className="relationship-modal" onSubmit={saveEvent}><div className="modal-title"><div><span>FAMILY THROUGH TIME</span><h2>Add a milestone</h2></div><button type="button" className="icon-button" onClick={() => setAddEvent(false)}><X size={18} /></button></div><p>Keep a family memory or a wider world event alongside your history.</p><label className="form-field">Event scope<select value={eventDraft.scope} onChange={(event) => setEventDraft({ ...eventDraft, scope: event.target.value })}><option value="family">Family milestone</option><option value="global">Historical / world event</option></select></label>{eventDraft.scope === "family" && <label className="form-field">Family member<select required value={eventDraft.memberId} onChange={(event) => setEventDraft({ ...eventDraft, memberId: event.target.value })}><option value="">Choose a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select></label>}<label className="form-field">Milestone title<input required maxLength={160} value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} /></label><label className="form-field">Date<input required type="date" value={eventDraft.date} onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })} /></label>{eventDraft.scope === "family" && <label className="form-field">Type<select value={eventDraft.type} onChange={(event) => setEventDraft({ ...eventDraft, type: event.target.value })}><option value="OTHER">Other</option><option value="BIRTH">Birth</option><option value="DEATH">Passing</option><option value="MIGRATION">Migration</option><option value="ACHIEVEMENT">Achievement</option><option value="MARRIAGE">Marriage</option></select></label>}<label className="form-field">Place<input maxLength={160} value={eventDraft.location} onChange={(event) => setEventDraft({ ...eventDraft, location: event.target.value })} /></label><label className="form-field">Story<textarea rows={3} maxLength={4000} value={eventDraft.description} onChange={(event) => setEventDraft({ ...eventDraft, description: event.target.value })} /></label><button className="primary-button wide">Save event</button></form></div>}
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}
