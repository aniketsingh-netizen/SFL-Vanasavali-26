import { CalendarDays, Globe2, MapPin, Plus } from "lucide-react";
import type { FamilyEvent, HistoryEvent } from "../types";

export default function Timeline({ events, history, onAddEvent }: { events: FamilyEvent[]; history: HistoryEvent[]; onAddEvent: () => void }) {
  const entries = [
    ...events.map((event) => ({ ...event, person: event.member.fullName, historical: false })),
    ...history.map((event) => ({ ...event, person: "Around the world", historical: true }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (!entries.length) return <div className="timeline-empty"><CalendarDays size={26} /><h3>Your family's timeline</h3><p>Births, journeys, and milestones will appear here alongside world history.</p><button className="secondary-button" onClick={onAddEvent}><Plus size={14} />Add a milestone</button></div>;
  return (
    <div className="timeline-list">
      <button className="secondary-button timeline-add" onClick={onAddEvent}><Plus size={14} />Add a milestone</button>
      {entries.map((event) => (
        <article className={`timeline-entry ${event.historical ? "historical-entry" : ""}`} key={`${event.historical ? "history" : "family"}-${event.id}`}>
          <div className="timeline-date"><span>{new Date(event.date).getFullYear()}</span><small>{new Date(event.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>
          <div className="timeline-line"><span /></div>
          <div className="timeline-card">
            <div className="timeline-kicker">{event.historical ? <Globe2 size={12} /> : <CalendarDays size={12} />}{event.person}</div>
            <h3>{event.title}</h3>
            {event.description && <p>{event.description}</p>}
            {event.location && <small><MapPin size={12} />{event.location}</small>}
          </div>
        </article>
      ))}
    </div>
  );
}
