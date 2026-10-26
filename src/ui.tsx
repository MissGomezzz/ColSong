// Piezas de interfaz compartidas entre la vista del artista y la del establecimiento.
import type { Opportunity } from "./api";

export type IconName =
  | "arrow"
  | "back"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "edit"
  | "heart"
  | "home"
  | "link"
  | "mail"
  | "map"
  | "moon"
  | "music"
  | "phone"
  | "plus"
  | "search"
  | "spark"
  | "sun"
  | "trash"
  | "user"
  | "users"
  | "x";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
    music: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
    x: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark"><i></i><i></i><i></i><i></i></span>
      <span>ColSong</span>
    </div>
  );
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}

/** Solo enlaces http(s): evita que un valor como `javascript:...` se convierta en un enlace activo. */
export function safeUrl(value: string | null | undefined): string | null {
  return value && /^https?:\/\/\S+$/i.test(value.trim()) ? value.trim() : null;
}

/** Tarjeta de oportunidad. Sin `onToggleSave` no muestra el corazón (vista previa del establecimiento). */
export function OpportunityCard({ item, onSelect, onToggleSave }: { item: Opportunity; onSelect?: () => void; onToggleSave?: () => void }) {
  return (
    <article className="opportunity-card" onClick={onSelect}>
      <div className="card-image" style={{ backgroundImage: `url("${item.image}")` }}>
        {item.distance && <span className="distance"><Icon name="map" size={13} /> {item.distance}</span>}
        {onToggleSave && (
          <button className={`save-button ${item.saved ? "saved" : ""}`} onClick={(event) => { event.stopPropagation(); onToggleSave(); }} aria-label="Guardar oferta">
            <Icon name="heart" size={18} />
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="venue-line"><span className={`venue-icon ${item.accent}`}><Icon name="music" size={16} /></span><div><b>{item.venue}</b><small>{item.type}</small></div></div>
        <h3>{item.title}</h3>
        <div className="tag">{item.genre}</div>
        <div className="meta-grid">
          <div><Icon name="calendar" size={17} /><span>{item.date}</span></div>
          <div><Icon name="clock" size={17} /><span>{item.time}</span></div>
        </div>
        <div className="card-footer"><div><b>{item.pay}</b><small>{item.unit}</small></div><button aria-label="Ver detalle"><Icon name="arrow" size={19} /></button></div>
      </div>
    </article>
  );
}
