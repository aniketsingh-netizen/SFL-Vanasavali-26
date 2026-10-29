import { useEffect, useState } from "react";
import { Bold, CalendarDays, Italic, List, MapPin, Pencil, Plus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Member } from "../types";

export const blank = {
  fullName: "", alternativeName: "", birthDate: "", deathDate: "", birthplace: "",
  occupation: "", currentLocation: "", photoUrl: "", biography: "", generation: 0
};
export type MemberDraft = typeof blank & { lineageIds: string[] };

export default function MemberPanel({ member, lineages, selectedLineageId, onClose, onSave, onAdd, saving }: {
  member?: Member;
  lineages: { id: string; name: string }[];
  selectedLineageId?: string;
  onClose: () => void;
  onSave: (data: MemberDraft, id?: string) => void;
  onAdd: () => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(!member);
  const [form, setForm] = useState({ ...blank, lineageIds: [] as string[] });
  function formatBiography(prefix: string, suffix = prefix) {
    const start = document.querySelector<HTMLTextAreaElement>("#member-biography");
    if (!start) return;
    const from = start.selectionStart;
    const to = start.selectionEnd;
    const selected = form.biography.slice(from, to) || "text";
    const biography = `${form.biography.slice(0, from)}${prefix}${selected}${suffix}${form.biography.slice(to)}`;
    setForm({ ...form, biography });
    requestAnimationFrame(() => {
      start.focus();
      start.setSelectionRange(from + prefix.length, from + prefix.length + selected.length);
    });
  }
  useEffect(() => {
    setEditing(!member);
    setForm(member ? {
      ...blank,
      fullName: member.fullName,
      alternativeName: member.alternativeName ?? "",
      birthDate: member.birthDate?.slice(0, 10) ?? "",
      deathDate: member.deathDate?.slice(0, 10) ?? "",
      birthplace: member.birthplace ?? "",
      occupation: member.occupation ?? "",
      currentLocation: member.currentLocation ?? "",
      photoUrl: member.photoUrl ?? "",
      biography: member.biography ?? "",
      generation: member.generation,
      lineageIds: member.lineages?.map(({ lineage }) => lineage.id) ?? []
    } : { ...blank, lineageIds: selectedLineageId ? [selectedLineageId] : [] });
  }, [member, selectedLineageId]);

  const field = (name: keyof typeof blank, label: string, type = "text") => (
    <label className="form-field">{label}<input type={type} value={form[name] as string | number} onChange={(event) => {
      if (name === "generation") setForm({ ...form, generation: Number(event.target.value) });
      else setForm({ ...form, [name]: event.target.value });
    }} /></label>
  );
  return (
    <aside className="member-panel">
      <div className="panel-heading">
        <span>{member ? "FAMILY PROFILE" : "NEW MEMBER"}</span>
        <button className="icon-button" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
      </div>
      {editing ? (
        <form className="member-form" onSubmit={(event) => { event.preventDefault(); onSave(form, member?.id); }}>
          <div className="form-title"><strong>{member ? "Edit details" : "Add to your story"}</strong><p>Every name holds a story worth remembering.</p></div>
          {field("fullName", "Full name")}
          {field("alternativeName", "Alternative / maiden name")}
          <div className="field-row">{field("birthDate", "Born", "date")}{field("deathDate", "Passed", "date")}</div>
          <div className="field-row">{field("birthplace", "Birthplace")}{field("currentLocation", "Current location")}</div>
          {field("occupation", "Occupation")}
          {field("photoUrl", "Photo URL", "url")}
          {field("generation", "Generation (ancestors are negative)", "number")}
          <label className="form-field">Lineages<select multiple value={form.lineageIds} onChange={(event) => setForm({ ...form, lineageIds: Array.from(event.target.selectedOptions, (option) => option.value) })}>{lineages.map((lineage) => <option value={lineage.id} key={lineage.id}>{lineage.name}</option>)}</select></label>
          <label className="form-field">Biographical history <span className="markdown-hint">Markdown formatting supported</span><span className="format-toolbar"><button type="button" aria-label="Bold" onClick={() => formatBiography("**")}><Bold size={13} /></button><button type="button" aria-label="Italic" onClick={() => formatBiography("*")}><Italic size={13} /></button><button type="button" aria-label="Bulleted list" onClick={() => formatBiography("\n- ", "")}><List size={14} /></button></span><textarea id="member-biography" rows={5} value={form.biography} onChange={(event) => setForm({ ...form, biography: event.target.value })} placeholder="Share the moments, places, and memories that shaped their life..." /></label>
          <button className="primary-button wide" type="submit" disabled={saving}>{saving ? "Saving..." : member ? "Save changes" : "Add family member"}</button>
        </form>
      ) : member ? (
        <div className="profile-content">
          <div className="profile-cover">
            {member.photoUrl ? <img src={member.photoUrl} alt={member.fullName} /> : <div className="profile-monogram">{member.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>}
            <button className="edit-floating" onClick={() => setEditing(true)} aria-label="Edit profile"><Pencil size={15} /></button>
          </div>
          <h2>{member.fullName}</h2>
          {member.alternativeName && <p className="alt-name">also known as {member.alternativeName}</p>}
          <div className="profile-dates"><CalendarDays size={15} />{member.birthDate?.slice(0, 10) ?? "Birth date unknown"}{member.deathDate ? ` — ${member.deathDate.slice(0, 10)}` : ""}</div>
          <div className="profile-facts">
            {member.occupation && <div><span>OCCUPATION</span><strong>{member.occupation}</strong></div>}
            {member.birthplace && <div><span>BIRTHPLACE</span><strong><MapPin size={13} />{member.birthplace}</strong></div>}
            {member.currentLocation && <div><span>CURRENTLY</span><strong>{member.currentLocation}</strong></div>}
            <div><span>GENERATION</span><strong>{member.generation === 0 ? "Home generation" : member.generation < 0 ? `${Math.abs(member.generation)} generation${member.generation < -1 ? "s" : ""} before` : `${member.generation} generation${member.generation > 1 ? "s" : ""} after`}</strong></div>
          </div>
          <div className="story-section"><h3>Their story</h3>{member.biography ? <div className="biography-markdown"><ReactMarkdown>{member.biography}</ReactMarkdown></div> : <p>Their story is waiting to be written.</p>}</div>
          <div className="profile-lineages"><h3>Connected lineages</h3>{member.lineages?.length ? member.lineages.map(({ lineage }) => <span key={lineage.id}>{lineage.name}</span>) : <p>No lineage assigned yet.</p>}</div>
          <button className="secondary-button wide" onClick={onAdd}><Plus size={16} /> Add another family member</button>
        </div>
      ) : null}
    </aside>
  );
}
