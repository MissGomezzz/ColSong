// Vista del establecimiento: panel de publicaciones, formulario, interesados y perfil del local.
import { useEffect, useState } from "react";
import { api, ApiError, bogotaNowLocal, previewOpportunity, type Applicant, type Opportunity, type User, type Venue, type VenueInput } from "./api";
import { Brand, Icon, OpportunityCard, initials, safeUrl } from "./ui";

type Screen = "posts" | "form" | "applicants" | "venue";

const VENUE_TYPES = ["Bar cultural", "Café & terraza", "Club", "Bar", "Restaurante", "Teatro", "Casa cultural", "Otro"];

// Coordenadas aproximadas por zona; solo sirven para ordenar y mostrar la distancia a los artistas.
const ZONES = [
  { name: "Chapinero", lat: 4.6486, lng: -74.0628 },
  { name: "La Macarena", lat: 4.612, lng: -74.0645 },
  { name: "Teusaquillo", lat: 4.6373, lng: -74.0745 },
  { name: "La Candelaria", lat: 4.5964, lng: -74.0731 },
  { name: "Zona T", lat: 4.6677, lng: -74.0558 },
  { name: "Quinta Camacho", lat: 4.656, lng: -74.064 },
  { name: "Chicó", lat: 4.673, lng: -74.047 },
  { name: "Parque 93", lat: 4.6769, lng: -74.0485 },
  { name: "Usaquén", lat: 4.695, lng: -74.03 },
  { name: "Galerías", lat: 4.6425, lng: -74.0702 },
  { name: "Palermo", lat: 4.628, lng: -74.069 },
  { name: "Suba", lat: 4.741, lng: -74.084 },
];
const OTHER_ZONE = "__other";

const IMAGE_PRESETS = [
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1541804627596-3b5b9ef58c93?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1531971772042-d189c2021395?auto=format&fit=crop&w=1200&q=85",
];
const INCLUDE_PRESETS = ["Sistema de sonido", "Prueba de sonido", "Bebidas y cena", "Parqueadero", "Backline", "Camerino"];
const GENRE_SUGGESTIONS = ["Indie / Alternativo", "Acústico / Folk", "Jazz / Soul", "Rock", "Pop", "Electrónica", "Trova / Bossa nova", "Salsa / Latino", "Hip hop / Rap", "Metal"];
const DURATIONS = [60, 90, 120, 150, 180, 240];
const durationLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h > 0 ? `${h} h` : ""}${h > 0 && m > 0 ? " " : ""}${m > 0 ? `${m} min` : ""}`;
};
const ACCENTS: { value: string; label: string }[] = [
  { value: "purple", label: "Lila" },
  { value: "orange", label: "Naranja" },
  { value: "blue", label: "Azul" },
];

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

function VenueHeader({ venue, user, screen, onNav, darkMode, onToggleTheme }: { venue: Venue | null; user: User; screen: Screen; onNav: (screen: Screen) => void; darkMode: boolean; onToggleTheme: () => void }) {
  const onPosts = screen === "posts" || screen === "form" || screen === "applicants";
  return (
    <header className="app-header">
      <Brand />
      {venue && <nav className="venue-nav">
        <button className={`nav-link ${onPosts ? "active" : ""}`} onClick={() => onNav("posts")}><Icon name="calendar" size={18} /> Publicaciones</button>
        <button className={`nav-link ${screen === "venue" ? "active" : ""}`} onClick={() => onNav("venue")}><Icon name="home" size={18} /> Mi local</button>
      </nav>}
      <button className="theme-toggle" onClick={onToggleTheme} aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"} title={darkMode ? "Modo claro" : "Modo oscuro"}>
        <Icon name={darkMode ? "sun" : "moon"} size={18} />
      </button>
      <div className="profile" onClick={() => venue && onNav("venue")} role="button" tabIndex={0} aria-label="Ver mi local">
        <div className="avatar">{initials(venue?.name ?? user.full_name)}</div>
        <div><b>{venue?.name ?? user.full_name}</b><span>Establecimiento</span></div>
        <Icon name="chevron" size={16} />
      </div>
    </header>
  );
}

export default function VenueApp({ user, onLogout, darkMode, onToggleTheme }: { user: User; onLogout: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [screen, setScreen] = useState<Screen>("posts");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [posts, setPosts] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [reviewing, setReviewing] = useState<Opportunity | null>(null);

  const reloadPosts = async () => setPosts(await api.myPosts());

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [venues, mine] = await Promise.all([api.myVenues(), api.myPosts()]);
      setVenue(venues[0] ?? null);
      setPosts(mine);
      if (!venues[0]) setScreen("venue");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(errorText(err, "Intenta de nuevo en unos minutos."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const goPosts = () => { setEditing(null); setReviewing(null); setScreen("posts"); };
  const nav = (next: Screen) => (next === "posts" ? goPosts() : setScreen(next));

  let content: React.ReactNode;
  if (loading) {
    content = <main className="dashboard"><div className="section-head"><div><h2>Cargando tu panel...</h2></div></div></main>;
  } else if (error) {
    content = <main className="dashboard"><div className="empty-state"><span><Icon name="search" size={24} /></span><h3>No pudimos cargar tu panel</h3><p>{error}</p><button className="secondary-button" onClick={load}>Reintentar</button></div></main>;
  } else if (screen === "venue" || !venue) {
    content = <VenueScreen venue={venue} onSaved={(saved) => { const firstTime = !venue; setVenue(saved); if (firstTime) goPosts(); }} onCancel={venue ? goPosts : undefined} onLogout={onLogout} />;
  } else if (screen === "form") {
    content = <PostForm venue={venue} initial={editing} onCancel={goPosts} onSaved={async () => { await reloadPosts(); goPosts(); }} />;
  } else if (screen === "applicants" && reviewing) {
    content = <ApplicantsScreen post={reviewing} onBack={goPosts} onChanged={reloadPosts} />;
  } else {
    content = <PostsScreen venue={venue} posts={posts} onNew={() => { setEditing(null); setScreen("form"); }} onEdit={(post) => { setEditing(post); setScreen("form"); }} onReview={(post) => { setReviewing(post); setScreen("applicants"); }} onChanged={reloadPosts} />;
  }

  return (
    <div className="app-shell">
      <VenueHeader venue={venue} user={user} screen={screen} onNav={nav} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      {content}
    </div>
  );
}

/* ---------------------------------------------------------------- Publicaciones */

type Filter = "all" | "open" | "closed" | "past";

function postState(post: Opportunity): Exclude<Filter, "all"> {
  return post.isPast ? "past" : post.status === "open" ? "open" : "closed";
}

const STATE_LABEL = { open: "Abierta", closed: "Cerrada", past: "Finalizada" } as const;

function PostsScreen({ venue, posts, onNew, onEdit, onReview, onChanged }: { venue: Venue; posts: Opportunity[]; onNew: () => void; onEdit: (post: Opportunity) => void; onReview: (post: Opportunity) => void; onChanged: () => Promise<void> }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const upcoming = posts.filter((p) => !p.isPast).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = posts.filter((p) => p.isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const ordered = [...upcoming, ...past];
  const visible = ordered.filter((p) => filter === "all" || postState(p) === filter);

  const openCount = posts.filter((p) => postState(p) === "open").length;
  const interested = posts.filter((p) => !p.isPast).reduce((sum, p) => sum + p.interested, 0);
  const pending = posts.reduce((sum, p) => sum + p.pending, 0);

  const run = async (post: Opportunity, action: () => Promise<unknown>) => {
    setBusyId(post.id);
    setActionError("");
    try {
      await action();
      await onChanged();
    } catch (err) {
      setActionError(errorText(err, "No pudimos completar la acción."));
    } finally {
      setBusyId(null);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `Todas (${posts.length})` },
    { key: "open", label: `Abiertas (${openCount})` },
    { key: "closed", label: `Cerradas (${posts.filter((p) => postState(p) === "closed").length})` },
    { key: "past", label: `Finalizadas (${past.length})` },
  ];

  return (
    <main className="dashboard">
      <div className="welcome">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div>
          <h1>Hola, {venue.name}. <span>¿Qué música traes?</span></h1>
          <p>Publica tus fechas y elige con qué artistas conectar.</p>
        </div>
        <button className="primary-button new-post" onClick={onNew}><Icon name="plus" size={18} /> Nueva publicación</button>
      </div>

      <div className="stat-row">
        <div className="stat"><span><Icon name="calendar" size={19} /></span><div><b>{openCount}</b><small>{openCount === 1 ? "publicación abierta" : "publicaciones abiertas"}</small></div></div>
        <div className="stat"><span><Icon name="users" size={19} /></span><div><b>{interested}</b><small>{interested === 1 ? "artista interesado" : "artistas interesados"}</small></div></div>
        <div className="stat"><span><Icon name="spark" size={19} /></span><div><b>{pending}</b><small>{pending === 1 ? "propuesta por revisar" : "propuestas por revisar"}</small></div></div>
      </div>

      <div className="section-head posts-head">
        <div><h2>Tus publicaciones</h2><p>{visible.length} {visible.length === 1 ? "publicación" : "publicaciones"}</p></div>
        <div className="seg" role="group" aria-label="Filtrar publicaciones">
          {filters.map((f) => <button key={f.key} className={filter === f.key ? "active" : ""} onClick={() => setFilter(f.key)}>{f.label}</button>)}
        </div>
      </div>
      {actionError && <div className="form-error" role="alert">{actionError}</div>}

      {visible.length > 0
        ? <div className="card-grid">{visible.map((post) => (
            <VenuePostCard key={post.id} post={post} busy={busyId === post.id}
              onEdit={() => onEdit(post)} onReview={() => onReview(post)}
              onToggle={() => run(post, () => api.updatePost(post.id, { status: post.status === "open" ? "closed" : "open" }))}
              onDelete={() => run(post, () => api.deletePost(post.id))} />
          ))}</div>
        : <div className="empty-state">
            <span><Icon name="music" size={24} /></span>
            <h3>{posts.length === 0 ? "Aún no has publicado nada" : "No hay publicaciones en este filtro"}</h3>
            <p>{posts.length === 0 ? "Crea tu primera publicación y empieza a recibir propuestas de artistas." : "Prueba con otro filtro."}</p>
            {posts.length === 0 && <button className="primary-button" onClick={onNew}><Icon name="plus" size={17} /> Crear mi primera publicación</button>}
          </div>}

      {!venue.verified && <div className="tip-banner"><span><Icon name="spark" /></span><div><b>Tu local está en proceso de verificación</b><p>El equipo de ColSong revisará tus datos. Mientras tanto, tus publicaciones ya son visibles para los artistas.</p></div></div>}
    </main>
  );
}

function VenuePostCard({ post, busy, onEdit, onReview, onToggle, onDelete }: { post: Opportunity; busy: boolean; onEdit: () => void; onReview: () => void; onToggle: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const state = postState(post);
  return (
    <article className="opportunity-card post-card">
      <div className="card-image" style={{ backgroundImage: `url("${post.image}")` }}>
        <span className={`status-pill ${state}`}>{STATE_LABEL[state]}</span>
        {post.pending > 0 && <span className="pending-badge">{post.pending} por revisar</span>}
      </div>
      <div className="card-body">
        <h3>{post.title}</h3>
        <div className="tag">{post.genre}</div>
        <div className="meta-grid">
          <div><Icon name="calendar" size={17} /><span>{post.date}</span></div>
          <div><Icon name="clock" size={17} /><span>{post.time}</span></div>
        </div>
        <div className="card-footer"><div><b>{post.pay}</b><small>{post.unit}</small></div><div className="interested"><Icon name="users" size={16} /> {post.interested}</div></div>
        {confirming
          ? <div className="card-actions confirm-row">
              <span>¿Eliminar esta publicación y sus propuestas?</span>
              <button className="mini-button danger solid" disabled={busy} onClick={onDelete}>{busy ? "Eliminando..." : "Sí, eliminar"}</button>
              <button className="mini-button" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</button>
            </div>
          : <div className="card-actions">
              <button className="mini-button solid" onClick={onReview}><Icon name="users" size={14} /> Interesados</button>
              <button className="mini-button" onClick={onEdit}><Icon name="edit" size={14} /> {post.isPast ? "Reprogramar" : "Editar"}</button>
              {!post.isPast && <button className="mini-button" disabled={busy} onClick={onToggle}>{post.status === "open" ? "Cerrar" : "Reabrir"}</button>}
              <button className="mini-button danger" aria-label="Eliminar publicación" title="Eliminar" onClick={() => setConfirming(true)}><Icon name="trash" size={14} /></button>
            </div>}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- Formulario */

function ImagePicker({ value, onChange, hint }: { value: string; onChange: (url: string) => void; hint: string }) {
  return (
    <>
      <div className="image-presets">
        {IMAGE_PRESETS.map((url) => (
          <button type="button" key={url} className={`preset ${value === url ? "on" : ""}`} style={{ backgroundImage: `url("${url}")` }} onClick={() => onChange(url)} aria-label="Usar esta imagen" />
        ))}
      </div>
      <div className="input-shell"><Icon name="link" size={18} /><input type="url" value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://... (enlace a una imagen)" maxLength={500} aria-label="Enlace de la imagen" /></div>
      <p className="hint">{hint}</p>
    </>
  );
}

function PostForm({ venue, initial, onCancel, onSaved }: { venue: Venue; initial: Opportunity | null; onCancel: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [startsAt, setStartsAt] = useState(initial ? initial.startsAt.slice(0, 16) : "");
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 90);
  const [payAmount, setPayAmount] = useState(initial ? String(initial.payAmount) : "");
  const [payUnit, setPayUnit] = useState<"toque" | "hora">(initial?.payUnit ?? "toque");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.ownImage ?? "");
  const [includes, setIncludes] = useState<string[]>(initial?.includes ?? ["Sistema de sonido", "Prueba de sonido"]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleInclude = (item: string) => setIncludes((cur) => (cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]));
  const addCustom = () => {
    const value = custom.trim();
    if (value && !includes.includes(value) && includes.length < 20) setIncludes([...includes, value]);
    setCustom("");
  };
  const includeOptions = [...INCLUDE_PRESETS, ...includes.filter((x) => !INCLUDE_PRESETS.includes(x))];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const fields = {
      title: title.trim(),
      genre: genre.trim(),
      description: description.trim() || null,
      duration_minutes: duration,
      pay_amount: Number(payAmount),
      pay_unit: payUnit,
      image_url: image.trim() || null,
      includes,
    };
    try {
      if (initial) {
        const dateChanged = startsAt !== initial.startsAt.slice(0, 16);
        await api.updatePost(initial.id, { ...fields, ...(dateChanged ? { starts_at: startsAt } : {}) });
      } else {
        await api.createPost({ ...fields, venue_id: venue.id, starts_at: startsAt });
      }
      await onSaved();
    } catch (err) {
      setError(errorText(err, "No pudimos guardar la publicación."));
      setSaving(false);
    }
  };

  const preview = previewOpportunity(venue, { title, genre, starts_at: startsAt, duration_minutes: duration, pay_amount: Number(payAmount) || 0, pay_unit: payUnit, image_url: image.trim() || null, description, includes });
  const reschedule = !!initial?.isPast;

  return (
    <main className="detail-page">
      <button className="back-button" onClick={onCancel}><Icon name="back" size={18} /> Volver a mis publicaciones</button>
      <div className="detail-layout">
        <form className="profile-card post-form" onSubmit={submit}>
          <div className="profile-card-head">
            <span className="head-icon"><Icon name={initial ? "edit" : "plus"} size={24} /></span>
            <div>
              <h1>{initial ? (reschedule ? "Reprogramar publicación" : "Editar publicación") : "Nueva publicación"}</h1>
              <p>{reschedule ? "Esta fecha ya pasó: elige una nueva fecha para volver a publicarla." : "Esto es lo que verán los artistas en ColSong."}</p>
            </div>
          </div>
          <div className="profile-grid">
            <div className="full-row"><label htmlFor="title">Título de la publicación</label><div className="input-shell"><Icon name="music" size={18} /><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Noche de indie & alternativo" required minLength={3} maxLength={160} /></div></div>
            <div><label htmlFor="genre">Género que buscas</label><div className="input-shell"><Icon name="spark" size={18} /><input id="genre" list="genre-options" value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Indie / Alternativo" required minLength={2} maxLength={80} /></div><datalist id="genre-options">{GENRE_SUGGESTIONS.map((g) => <option key={g} value={g} />)}</datalist></div>
            <div><label htmlFor="starts_at">Fecha y hora</label><div className="input-shell"><Icon name="calendar" size={18} /><input id="starts_at" type="datetime-local" value={startsAt} min={bogotaNowLocal()} onChange={(event) => setStartsAt(event.target.value)} required /></div></div>
            <div><label htmlFor="duration">Duración del show</label><div className="input-shell"><Icon name="clock" size={18} /><select id="duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{[...new Set([...DURATIONS, duration])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{durationLabel(m)}</option>)}</select></div></div>
            <div>
              <label htmlFor="pay">Pago ofrecido (COP)</label>
              <div className="pay-row">
                <div className="input-shell"><span className="currency">$</span><input id="pay" type="number" inputMode="numeric" min={1000} step={1000} value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder="450000" required /></div>
                <div className="seg" role="group" aria-label="Unidad de pago">
                  <button type="button" className={payUnit === "toque" ? "active" : ""} onClick={() => setPayUnit("toque")}>por toque</button>
                  <button type="button" className={payUnit === "hora" ? "active" : ""} onClick={() => setPayUnit("hora")}>por hora</button>
                </div>
              </div>
            </div>
            <div className="full-row"><label htmlFor="description">Sobre la presentación</label><div className="input-shell area"><textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Cuéntales a los artistas qué tipo de propuesta buscas, el ambiente del lugar y cómo es el repertorio." maxLength={4000} /></div></div>
            <div className="full-row">
              <label>El lugar incluye</label>
              <div className="chip-row">
                {includeOptions.map((item) => <button type="button" key={item} className={`chip ${includes.includes(item) ? "on" : ""}`} aria-pressed={includes.includes(item)} onClick={() => toggleInclude(item)}>{includes.includes(item) && <Icon name="check" size={13} />} {item}</button>)}
              </div>
              <div className="add-chip">
                <div className="input-shell"><input value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} placeholder="Agregar otro (p. ej. Camerino, Transmisión)" maxLength={60} aria-label="Agregar otro servicio incluido" /></div>
                <button type="button" className="mini-button" onClick={addCustom}><Icon name="plus" size={14} /> Agregar</button>
              </div>
            </div>
            <div className="full-row"><label>Imagen de la publicación</label><ImagePicker value={image} onChange={setImage} hint="Opcional. Si no eliges una, usamos la foto de tu local." /></div>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="profile-actions">
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : initial ? "Guardar cambios" : "Publicar"}</button>
            <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
        <aside className="preview-aside">
          <div className="offer-label">ASÍ LA VERÁN LOS ARTISTAS</div>
          <OpportunityCard item={preview} />
          <p className="hint">La tarjeta se actualiza mientras escribes.</p>
        </aside>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- Interesados */

const APPLICANT_LABEL = { pending: "Por revisar", accepted: "Aceptada", rejected: "Rechazada" } as const;

function ApplicantsScreen({ post, onBack, onChanged }: { post: Opportunity; onBack: () => void; onChanged: () => Promise<void> }) {
  const [list, setList] = useState<Applicant[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api.applicants(post.id).then(setList).catch((err) => setError(errorText(err, "No pudimos cargar los interesados.")));
  }, [post.id]);

  const decide = async (applicant: Applicant, status: "accepted" | "rejected") => {
    setBusyId(applicant.id);
    setError("");
    try {
      const updated = await api.decide(applicant.id, status);
      setList((cur) => cur && cur.map((a) => (a.id === updated.id ? updated : a)));
      await onChanged();
    } catch (err) {
      setError(errorText(err, "No pudimos registrar tu decisión."));
    } finally {
      setBusyId(null);
    }
  };

  const order = { pending: 0, accepted: 1, rejected: 2 } as const;
  const sorted = list ? [...list].sort((a, b) => order[a.status] - order[b.status]) : [];
  const pending = sorted.filter((a) => a.status === "pending").length;
  const accepted = sorted.filter((a) => a.status === "accepted").length;

  return (
    <main className="detail-page">
      <button className="back-button" onClick={onBack}><Icon name="back" size={18} /> Volver a mis publicaciones</button>
      <div className="profile-card applicants-card">
        <div className="profile-card-head">
          <span className="head-icon"><Icon name="users" size={24} /></span>
          <div>
            <h1>Interesados en “{post.title}”</h1>
            <p>{post.date} · {post.time} · {post.pay} {post.unit}</p>
          </div>
        </div>
        {list && <p className="applicants-summary">{sorted.length === 0 ? "Todavía nadie ha enviado su perfil." : `${pending} por revisar · ${accepted} ${accepted === 1 ? "aceptado" : "aceptados"}. Los datos de contacto se muestran solo cuando aceptas.`}</p>}
        {error && <div className="form-error" role="alert">{error}</div>}
        {!list && !error && <p className="applicants-summary">Cargando interesados...</p>}
        <div className="applicant-list">
          {sorted.map((a) => <ApplicantCard key={a.id} applicant={a} busy={busyId === a.id} onDecide={(status) => decide(a, status)} />)}
        </div>
      </div>
    </main>
  );
}

function ApplicantCard({ applicant: a, busy, onDecide }: { applicant: Applicant; busy: boolean; onDecide: (status: "accepted" | "rejected") => void }) {
  const artist = a.artist;
  const handle = artist.instagram?.trim().replace(/^@/, "") ?? "";
  const portfolio = safeUrl(artist.portfolio_url);
  const video = safeUrl(artist.video_url);
  return (
    <article className="applicant">
      <div className="applicant-head">
        <div className="avatar">{initials(artist.stage_name)}</div>
        <div className="applicant-id"><b>{artist.stage_name}</b><small>{artist.artist_type ?? "Artista"}{artist.genres.length > 0 ? ` · ${artist.genres.join(", ")}` : ""}</small></div>
        <span className={`status-pill ${a.status}`}>{APPLICANT_LABEL[a.status]}</span>
      </div>
      {artist.bio && <p className="applicant-bio">{artist.bio}</p>}
      {a.message && <blockquote className="applicant-msg">“{a.message}”</blockquote>}
      <div className="applicant-links">
        {/^[A-Za-z0-9._]{1,30}$/.test(handle) && <a href={`https://www.instagram.com/${handle}`} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} /> @{handle}</a>}
        {portfolio && <a href={portfolio} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} /> Portafolio</a>}
        {video && <a href={video} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} /> Video</a>}
      </div>
      {a.status === "accepted" && <div className="contact-box">
        <b>Datos de contacto</b>
        <span><Icon name="mail" size={15} /> {artist.email ?? "—"}</span>
        <span><Icon name="phone" size={15} /> {artist.phone ?? "No registró teléfono"}</span>
      </div>}
      <div className="card-actions">
        {a.status !== "accepted" && <button className="mini-button solid" disabled={busy} onClick={() => onDecide("accepted")}><Icon name="check" size={14} /> Aceptar</button>}
        {a.status !== "rejected" && <button className="mini-button" disabled={busy} onClick={() => onDecide("rejected")}><Icon name="x" size={14} /> Rechazar</button>}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- Perfil del local */

function VenueScreen({ venue, onSaved, onCancel, onLogout }: { venue: Venue | null; onSaved: (venue: Venue) => void; onCancel?: () => void; onLogout: () => void }) {
  const knownZone = !venue || ZONES.some((z) => z.name === venue.neighborhood);
  const [name, setName] = useState(venue?.name ?? "");
  const [type, setType] = useState(venue?.venue_type ?? VENUE_TYPES[0]);
  const [zone, setZone] = useState(venue ? (knownZone ? venue.neighborhood : OTHER_ZONE) : ZONES[0].name);
  const [otherZone, setOtherZone] = useState(venue && !knownZone ? venue.neighborhood : "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [description, setDescription] = useState(venue?.description ?? "");
  const [phone, setPhone] = useState(venue?.phone ?? "");
  const [image, setImage] = useState(venue?.image_url ?? "");
  const [accent, setAccent] = useState(venue?.accent ?? "purple");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const neighborhood = zone === OTHER_ZONE ? otherZone.trim() : zone;
    const preset = ZONES.find((z) => z.name === neighborhood);
    const sameZone = venue && venue.neighborhood === neighborhood; // conserva coordenadas precisas si no cambió de zona
    const data: VenueInput = {
      name: name.trim(),
      venue_type: type,
      description: description.trim() || null,
      neighborhood,
      address: address.trim(),
      latitude: sameZone ? venue.latitude : preset?.lat ?? null,
      longitude: sameZone ? venue.longitude : preset?.lng ?? null,
      phone: phone.trim() || null,
      image_url: image.trim() || null,
      accent,
    };
    try {
      const saved = venue ? await api.updateVenue(venue.id, data) : await api.createVenue(data);
      if (venue) setMessage({ type: "ok", text: "Cambios guardados." });
      onSaved(saved);
    } catch (err) {
      setMessage({ type: "error", text: errorText(err, "No pudimos guardar los datos del local.") });
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <main className="detail-page">
      {onCancel && <button className="back-button" onClick={onCancel}><Icon name="back" size={18} /> Volver a mis publicaciones</button>}
      <form className="profile-card" onSubmit={submit}>
        <div className="profile-card-head">
          <span className="head-icon"><Icon name="home" size={24} /></span>
          <div>
            <h1>{venue ? "Tu establecimiento" : "Cuéntanos sobre tu local"}</h1>
            <p>{venue ? (venue.verified ? "Identidad verificada por ColSong." : "Verificación pendiente: el equipo de ColSong revisará tus datos.") : "Estos datos aparecerán en cada publicación que hagas."}</p>
          </div>
        </div>
        <div className="profile-grid">
          <div><label htmlFor="v_name">Nombre del local</label><div className="input-shell"><Icon name="home" size={18} /><input id="v_name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Casa Frida" required minLength={2} maxLength={120} /></div></div>
          <div><label htmlFor="v_type">Tipo de local</label><div className="input-shell"><Icon name="music" size={18} /><select id="v_type" value={type} onChange={(event) => setType(event.target.value)}>{[...new Set([...VENUE_TYPES, type])].map((t) => <option key={t} value={t}>{t}</option>)}</select></div></div>
          <div><label htmlFor="v_zone">Barrio o zona</label><div className="input-shell"><Icon name="map" size={18} /><select id="v_zone" value={zone} onChange={(event) => setZone(event.target.value)}>{ZONES.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}<option value={OTHER_ZONE}>Otro...</option></select></div></div>
          {zone === OTHER_ZONE
            ? <div><label htmlFor="v_other">¿Cuál barrio?</label><div className="input-shell"><Icon name="map" size={18} /><input id="v_other" value={otherZone} onChange={(event) => setOtherZone(event.target.value)} required minLength={2} maxLength={80} /></div></div>
            : <div><label htmlFor="v_phone">Teléfono de contacto</label><div className="input-shell"><Icon name="phone" size={18} /><input id="v_phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+57 601 000 0000" maxLength={40} /></div></div>}
          <div className="full-row"><label htmlFor="v_address">Dirección</label><div className="input-shell"><Icon name="map" size={18} /><input id="v_address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Cra. 13 #54-20" required minLength={3} maxLength={200} /></div></div>
          {zone === OTHER_ZONE && <div><label htmlFor="v_phone2">Teléfono de contacto</label><div className="input-shell"><Icon name="phone" size={18} /><input id="v_phone2" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></div></div>}
          <div className="full-row"><label htmlFor="v_desc">Sobre tu local</label><div className="input-shell area"><textarea id="v_desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Cuéntales a los artistas cómo es el lugar, el público y el ambiente." maxLength={2000} /></div></div>
          <div className="full-row"><label>Foto del local</label><ImagePicker value={image} onChange={setImage} hint="Se usa en tus publicaciones que no tengan una imagen propia." /></div>
          <div className="full-row">
            <label>Color de tu marca en las tarjetas</label>
            <div className="swatches" role="group" aria-label="Color">
              {ACCENTS.map((a) => <button type="button" key={a.value} className={`swatch ${a.value} ${accent === a.value ? "on" : ""}`} aria-pressed={accent === a.value} onClick={() => setAccent(a.value)}><Icon name="music" size={15} /> {a.label}</button>)}
            </div>
          </div>
        </div>
        {message && <div className={message.type === "ok" ? "form-ok" : "form-error"} role="status">{message.text}</div>}
        <div className="profile-actions">
          <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : venue ? "Guardar cambios" : "Crear mi local"}</button>
          <button className="secondary-button" type="button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </form>
    </main>
  );
}
