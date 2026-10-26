import { useEffect, useState } from "react";
import { api, ApiError, getToken, setToken, type ArtistProfile, type Opportunity, type Role, type User } from "./api";
import { Brand, Icon, OpportunityCard, initials } from "./ui";
import VenueApp from "./VenueApp";

type EnterFn = (mode: "login" | "register", name: string, email: string, password: string, role: Role) => Promise<void>;

function Login({ onEnter }: { onEnter: EnterFn }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("artist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(import.meta.env.DEV ? "sofia@luna.com" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";
  const isVenue = role === "venue";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onEnter(mode, name, email, password, role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-top"><Brand light /><span>Hecho para la escena local.</span></div>
        <div className="visual-copy">
          <div className="eyebrow light"><Icon name="spark" size={16} /> {isRegister && isVenue ? "Música en vivo para tu local" : "Nuevas oportunidades cada semana"}</div>
          <h1>{isRegister && isVenue ? <>El talento de Bogotá<br />te está esperando.</> : <>Tu próximo escenario<br />está más cerca.</>}</h1>
          <p>{isRegister && isVenue ? "Publica tus fechas, recibe propuestas de artistas emergentes y elige con quién conectar." : "Conecta con lugares que están buscando exactamente lo que tú haces."}</p>
          <div className="artist-row">
            <div className="artist-stack"><span>SM</span><span>LD</span><span>+8</span></div>
            <small>Artistas conectados hoy</small>
          </div>
        </div>
        <div className="photo-credit">Foto: John Matychuk · Unsplash</div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand"><Brand /></div>
        <form className="login-form" onSubmit={submit}>
          <div className="eyebrow">{isRegister ? (isVenue ? "REGISTRO DE ESTABLECIMIENTOS" : "REGISTRO DE ARTISTAS") : "ACCESO A COLSONG"}</div>
          <h2>{isRegister ? "Crea tu perfil." : "Qué bueno verte."}</h2>
          <p className="muted">{isRegister ? (isVenue ? "Regístrate para publicar toques y recibir artistas." : "Regístrate para descubrir oportunidades cerca de ti.") : "Ingresa para continuar con tu cuenta de artista o de establecimiento."}</p>
          {isRegister && <div className="seg role-switch" role="group" aria-label="Tipo de cuenta">
            <button type="button" className={!isVenue ? "active" : ""} onClick={() => setRole("artist")}><Icon name="music" size={15} /> Soy artista</button>
            <button type="button" className={isVenue ? "active" : ""} onClick={() => setRole("venue")}><Icon name="home" size={15} /> Soy un establecimiento</button>
          </div>}
          {isRegister && <>
            <label>{isVenue ? "Tu nombre" : "Nombre artístico"}</label>
            <div className="input-shell"><Icon name="user" size={18} /><input value={name} onChange={(event) => setName(event.target.value)} aria-label={isVenue ? "Tu nombre" : "Nombre artístico"} required minLength={2} autoComplete="name" /></div>
          </>}
          <label>Correo electrónico</label>
          <div className="input-shell"><Icon name="mail" size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Correo electrónico" required autoComplete="email" /></div>
          <div className="password-line"><label>Contraseña</label>{!isRegister && <button type="button" className="text-button">¿La olvidaste?</button>}</div>
          <div className="input-shell"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" aria-label="Contraseña" required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? "new-password" : "current-password"} /></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button full" type="submit" disabled={loading}>{loading ? "Un momento..." : isRegister ? (isVenue ? "Crear cuenta del local" : "Crear mi perfil") : "Entrar a ColSong"} <Icon name="arrow" /></button>
          {import.meta.env.DEV && !isRegister && <div className="prototype-note"><span><Icon name="spark" size={15} /></span><p><b>Modo demostración</b> — Artista: sofia@luna.com · Local: casafrida@colsong.co · Contraseña: colsong123.</p></div>}
        </form>
        <p className="signup-copy">{isRegister ? "¿Ya tienes cuenta? " : "¿Aún no haces parte? "}<b role="button" tabIndex={0} style={{ cursor: "pointer" }} onClick={() => { setError(""); setMode(isRegister ? "login" : "register"); }}>{isRegister ? "Inicia sesión" : "Crea tu perfil"}</b></p>
      </section>
    </main>
  );
}

function Header({ user, profile, onProfile, darkMode, onToggleTheme }: { user: User; profile: ArtistProfile | null; onProfile: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  return (
    <header className="app-header">
      <Brand />
      <nav>
        <button className="nav-link active"><Icon name="home" size={18} /> Explorar</button>
      </nav>
      <button className="theme-toggle" onClick={onToggleTheme} aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"} title={darkMode ? "Modo claro" : "Modo oscuro"}>
        <Icon name={darkMode ? "sun" : "moon"} size={18} />
      </button>
      <div className="profile" onClick={onProfile} onKeyDown={(event) => event.key === "Enter" && onProfile()} role="button" tabIndex={0} aria-label="Ver mi perfil">
        <div className="avatar">{initials(user.full_name)}</div>
        <div><b>{user.full_name}</b><span>{profile?.artist_type ?? "Artista"}</span></div>
        <Icon name="chevron" size={16} />
      </div>
    </header>
  );
}

function Dashboard({ user, profile, items, loading, error, onSelect, onToggleSave, onProfile, darkMode, onToggleTheme }: { user: User; profile: ArtistProfile | null; items: Opportunity[]; loading: boolean; error: string; onSelect: (item: Opportunity) => void; onToggleSave: (item: Opportunity) => void; onProfile: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [date, setDate] = useState("all");
  const [time, setTime] = useState("all");

  const clearFilters = () => {
    setQuery("");
    setLocation("all");
    setDate("all");
    setTime("all");
  };

  const filtered = items.filter((item) => {
    const searchable = `${item.venue} ${item.title} ${item.genre} ${item.type} ${item.city}`.toLowerCase();
    const period = Number(item.startsAt.slice(11, 13)) < 19 ? "afternoon" : "night";
    return searchable.includes(query.trim().toLowerCase())
      && (location === "all" || item.city.startsWith(location))
      && (date === "all" || item.date === date)
      && (time === "all" || period === time);
  });

  return (
    <div className="app-shell">
      <Header user={user} profile={profile} onProfile={onProfile} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <main className="dashboard">
        <div className="welcome">
          <div><div className="eyebrow">{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div><h1>Hola, {user.full_name.split(" ")[0]}. <span>¿Dónde tocarás ahora?</span></h1><p>{items.length === 1 ? "Encontramos 1 oportunidad abierta." : `Encontramos ${items.length} oportunidades abiertas.`}</p></div>
          {profile && <div className="profile-score" onClick={onProfile} onKeyDown={(event) => event.key === "Enter" && onProfile()} role="button" tabIndex={0} aria-label="Completar mi perfil"><div className="score-ring" style={{ "--score": `${profile.completeness}%` } as React.CSSProperties}>{profile.completeness}<small>%</small></div><div><b>{profile.completeness >= 80 ? "Tu perfil destaca" : "Completa tu perfil"}</b><span>{profile.missing.length ? `Agrega ${profile.missing[0]} para llegar al 100%` : "¡Tu perfil está completo!"}</span></div><Icon name="chevron" size={18} /></div>}
        </div>
        <div className="filters">
          <label className="search-box"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lugar, evento o género" aria-label="Buscar oportunidades" /></label>
          <label className="select-filter"><Icon name="map" size={17} /><select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Filtrar por lugar"><option value="all">Toda Bogotá</option>{[...new Set(items.map((item) => item.city.split(",")[0]))].sort().map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select><Icon name="chevron" size={14} /></label>
          <label className="select-filter"><Icon name="calendar" size={17} /><select value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filtrar por fecha"><option value="all">Cualquier fecha</option>{[...new Set(items.map((item) => item.date))].map((day) => <option key={day} value={day}>{day}</option>)}</select><Icon name="chevron" size={14} /></label>
          <label className="select-filter"><Icon name="clock" size={17} /><select value={time} onChange={(event) => setTime(event.target.value)} aria-label="Filtrar por hora"><option value="all">Cualquier hora</option><option value="afternoon">Antes de las 7 p. m.</option><option value="night">Desde las 7 p. m.</option></select><Icon name="chevron" size={14} /></label>
        </div>
        <div className="section-head"><div><h2>Oportunidades para ti</h2><p>{loading ? "Cargando oportunidades..." : `${filtered.length} ${filtered.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}</p></div>{filtered.length < items.length && <button onClick={clearFilters}>Limpiar filtros</button>}</div>
        {error ? <div className="empty-state"><span><Icon name="search" size={24} /></span><h3>No pudimos cargar las oportunidades</h3><p>{error}</p></div> : filtered.length > 0 ? <div className="card-grid">{filtered.map((item) => <OpportunityCard key={item.id} item={item} onSelect={() => onSelect(item)} onToggleSave={() => onToggleSave(item)} />)}</div> : !loading && <div className="empty-state"><span><Icon name="search" size={24} /></span><h3>No encontramos oportunidades</h3><p>Prueba con otro lugar, horario o término de búsqueda.</p><button className="secondary-button" onClick={clearFilters}>Restablecer filtros</button></div>}
        <div className="tip-banner" onClick={onProfile}><span><Icon name="spark" /></span><div><b>{profile && profile.completeness >= 100 ? "Tu perfil está listo para conectar" : "Una buena primera impresión importa"}</b><p>{profile && profile.completeness >= 100 ? "Mantén tu portafolio y tus enlaces al día para destacar ante los lugares." : "Completa tu portafolio y aumenta tus posibilidades de conexión."}</p></div><button onClick={(event) => { event.stopPropagation(); onProfile(); }}>{profile && profile.completeness >= 100 ? "Editar perfil" : "Completar perfil"} <Icon name="arrow" size={17} /></button></div>
      </main>
    </div>
  );
}

function Detail({ item, user, profile, onBack, onProfile, onToggleSave, onConnected, darkMode, onToggleTheme }: { item: Opportunity; user: User; profile: ArtistProfile | null; onBack: () => void; onProfile: () => void; onToggleSave: () => void; onConnected: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [connection, setConnection] = useState<"idle" | "confirm" | "sent">(item.applied ? "sent" : "idle");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const decided = item.applicationStatus === "accepted" || item.applicationStatus === "rejected";
  const connect = async () => {
    setSending(true);
    setSendError("");
    try {
      await api.connect(item.id);
      onConnected();
      setConnection("sent");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) { onConnected(); setConnection("sent"); }
      else setSendError(err instanceof ApiError ? err.message : "No pudimos enviar tu interés.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="app-shell">
      <Header user={user} profile={profile} onProfile={onProfile} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <main className="detail-page">
        <button className="back-button" onClick={onBack}><Icon name="back" size={18} /> Volver a oportunidades</button>
        <div className="detail-layout">
          <section>
            <div className="detail-hero" style={{ backgroundImage: `url("${item.image}")` }}>
              <div className="detail-badge">OPORTUNIDAD DESTACADA</div><button className={`save-button ${item.saved ? "saved" : ""}`} onClick={onToggleSave} aria-label="Guardar oferta"><Icon name="heart" /></button>
              <div className="hero-overlay"><span>{item.type}</span><h1>{item.title}</h1><p><Icon name="map" size={17} /> {item.venue} · {item.city}</p></div>
            </div>
            <div className="detail-content">
              <div className="quick-facts">
                <div><span><Icon name="calendar" /></span><p>FECHA<b>{item.date}</b></p></div>
                <div><span><Icon name="clock" /></span><p>HORARIO<b>{item.time}</b></p></div>
                <div><span><Icon name="music" /></span><p>GÉNERO<b>{item.genre}</b></p></div>
              </div>
              <div className="copy-section"><h2>Sobre la presentación</h2>{item.description.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              {item.includes.length > 0 && <div className="included"><h3>El lugar incluye</h3><div>{item.includes.map((included) => <span key={included}><Icon name="check" size={16} /> {included}</span>)}</div></div>}
              <div className="map-section"><div><h2>Ubicación</h2><p>{item.address}</p></div><button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.venue}, ${item.address}, Bogotá`)}`, "_blank", "noopener")}>Cómo llegar <Icon name="arrow" size={16} /></button><div className="fake-map"><div className="road one"></div><div className="road two"></div><div className="road three"></div><span className="map-pin"><Icon name="music" size={17} /></span><small>{item.venue}</small></div></div>
            </div>
          </section>
          <aside className="connection-card">
            <div className="offer-label">PAGO OFRECIDO</div><div className="offer-price">{item.pay}<span>{item.unit}</span></div><div className="separator"></div>
            <div className="host"><div className="host-avatar">{initials(item.venue)}</div><div><small>PUBLICADO POR</small><b>{item.venue}</b>{item.verified && <span><i></i> Identidad verificada</span>}</div></div>
            <div className="response"><div><Icon name="clock" size={17} /><span>Responde normalmente en <b>{item.responseHours === 1 ? "1 hora" : `${item.responseHours} horas`}</b></span></div><div><Icon name="user" size={17} /><span><b>{item.interested === 1 ? "1 artista" : `${item.interested} artistas`}</b> {item.interested === 1 ? "está interesado" : "están interesados"}</span></div></div>
            {!decided && connection === "idle" && <>
              <button className="primary-button full" onClick={() => setConnection("confirm")}>Quiero conectar <Icon name="arrow" /></button>
              <p className="safe-note">No compartirás tus datos de contacto hasta que el lugar acepte.</p>
            </>}
            {!decided && connection === "confirm" && <div className="confirm-box"><div className="confirm-icon"><Icon name="music" /></div><h3>¿Enviar tu perfil?</h3><p>{item.venue} verá tu perfil artístico y portafolio. Tus datos de contacto se comparten solo si aceptan.</p>{sendError && <div className="form-error" role="alert">{sendError}</div>}<button className="primary-button full" onClick={connect} disabled={sending}>{sending ? "Enviando..." : "Sí, enviar interés"}</button><button className="secondary-button full" onClick={() => setConnection("idle")}>Ahora no</button></div>}
            {decided && <div className="success-box"><div className="success-icon">{item.applicationStatus === "accepted" ? <Icon name="check" size={28} /> : <Icon name="x" size={26} />}</div>{item.applicationStatus === "accepted" ? <><h3>¡{item.venue} aceptó tu perfil!</h3><p>Ya pueden coordinar la presentación.{item.contactPhone ? <> Escríbeles al <b>{item.contactPhone}</b>.</> : " Pronto se comunicarán contigo."}</p></> : <><h3>Esta vez no fue seleccionado</h3><p>{item.venue} eligió otra propuesta para esta fecha. ¡Hay más oportunidades esperándote!</p></>}<button className="secondary-button full" onClick={onBack}>Seguir explorando</button></div>}
            {!decided && connection === "sent" && <div className="success-box"><div className="success-icon"><Icon name="check" size={28} /></div><h3>¡Conexión enviada!</h3><p>Le avisamos a {item.venue}. Podrás ver su respuesta aquí cuando la tengamos.</p><button className="secondary-button full" onClick={onBack}>Seguir explorando</button></div>}
          </aside>
        </div>
      </main>
    </div>
  );
}

type ProfileForm = { stage_name: string; artist_type: string; genres: string; bio: string; phone: string; instagram: string; portfolio_url: string; video_url: string };

const emptyForm: ProfileForm = { stage_name: "", artist_type: "", genres: "", bio: "", phone: "", instagram: "", portfolio_url: "", video_url: "" };

function toForm(p: ArtistProfile): ProfileForm {
  return {
    stage_name: p.stage_name,
    artist_type: p.artist_type ?? "",
    genres: p.genres.join(", "),
    bio: p.bio ?? "",
    phone: p.phone ?? "",
    instagram: p.instagram ?? "",
    portfolio_url: p.portfolio_url ?? "",
    video_url: p.video_url ?? "",
  };
}

function ProfileScreen({ user, profile, onBack, onSaved, onLogout, darkMode, onToggleTheme }: { user: User; profile: ArtistProfile | null; onBack: () => void; onSaved: (profile: ArtistProfile) => void; onLogout: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [form, setForm] = useState<ProfileForm>(profile ? toForm(profile) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!profile) api.myProfile().then(onSaved).catch(() => setMessage({ type: "error", text: "No pudimos cargar tu perfil. Intenta de nuevo." }));
  }, []);
  useEffect(() => {
    if (profile) setForm(toForm(profile));
  }, [profile]);

  const set = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const orNull = (value: string) => value.trim() || null;
    try {
      const saved = await api.updateProfile({
        stage_name: form.stage_name.trim(),
        artist_type: orNull(form.artist_type),
        genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
        bio: orNull(form.bio),
        phone: orNull(form.phone),
        instagram: orNull(form.instagram),
        portfolio_url: orNull(form.portfolio_url),
        video_url: orNull(form.video_url),
      });
      onSaved(saved);
      setMessage({ type: "ok", text: "Cambios guardados." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "No pudimos guardar tus cambios." });
    } finally {
      setSaving(false);
    }
  };

  const completeness = profile?.completeness ?? 0;
  return (
    <div className="app-shell">
      <Header user={user} profile={profile} onProfile={() => undefined} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <main className="detail-page">
        <button className="back-button" onClick={onBack}><Icon name="back" size={18} /> Volver a oportunidades</button>
        <form className="profile-card" onSubmit={submit}>
          <div className="profile-card-head">
            <div className="score-ring" style={{ "--score": `${completeness}%` } as React.CSSProperties}>{completeness}<small>%</small></div>
            <div>
              <h1>Tu perfil artístico</h1>
              <p>{profile ? (profile.missing.length ? `Para llegar al 100% te falta: ${profile.missing.join(", ")}.` : "¡Tu perfil está completo!") : "Cargando tu perfil..."}</p>
            </div>
          </div>
          <div className="profile-grid">
            <div><label htmlFor="stage_name">Nombre artístico</label><div className="input-shell"><Icon name="user" size={18} /><input id="stage_name" value={form.stage_name} onChange={set("stage_name")} required maxLength={120} /></div></div>
            <div><label htmlFor="artist_type">Tipo de artista</label><div className="input-shell"><Icon name="music" size={18} /><input id="artist_type" value={form.artist_type} onChange={set("artist_type")} placeholder="Cantautora, banda, DJ..." maxLength={80} /></div></div>
            <div className="full-row"><label htmlFor="genres">Géneros (separados por coma)</label><div className="input-shell"><Icon name="spark" size={18} /><input id="genres" value={form.genres} onChange={set("genres")} placeholder="Folk, Indie, Jazz" /></div></div>
            <div className="full-row"><label htmlFor="bio">Biografía</label><div className="input-shell area"><textarea id="bio" value={form.bio} onChange={set("bio")} placeholder="Cuéntale a los lugares quién eres y qué tocas." maxLength={2000} /></div></div>
            <div><label htmlFor="phone">Teléfono</label><div className="input-shell"><input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" maxLength={40} /></div></div>
            <div><label htmlFor="instagram">Instagram</label><div className="input-shell"><input id="instagram" value={form.instagram} onChange={set("instagram")} placeholder="@tu.usuario" maxLength={120} /></div></div>
            <div><label htmlFor="portfolio_url">Portafolio</label><div className="input-shell"><input id="portfolio_url" type="url" value={form.portfolio_url} onChange={set("portfolio_url")} placeholder="https://..." maxLength={300} /></div></div>
            <div><label htmlFor="video_url">Video</label><div className="input-shell"><input id="video_url" type="url" value={form.video_url} onChange={set("video_url")} placeholder="https://youtube.com/..." maxLength={300} /></div></div>
          </div>
          {message && <div className={message.type === "ok" ? "form-ok" : "form-error"} role="status">{message.text}</div>}
          <div className="profile-actions">
            <button className="primary-button" type="submit" disabled={saving || !profile}>{saving ? "Guardando..." : "Guardar cambios"}</button>
            <button className="secondary-button" type="button" onClick={onLogout}>Cerrar sesión</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 3000, maximumAge: 600000 },
    );
  });
}

export default function App() {
  const [screen, setScreen] = useState<"login" | "dashboard" | "detail" | "profile">("login");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    setItems([]);
    setScreen("login");
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const coords = await getPosition();
      const [list, artistProfile] = await Promise.all([api.opportunities(coords), api.myProfile().catch(() => null)]);
      setItems(list);
      setProfile(artistProfile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setLoadError(err instanceof ApiError ? err.message : "Intenta de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  };

  // Retoma la sesión si hay un token guardado.
  useEffect(() => {
    if (!getToken()) return;
    api.me().then((me) => {
      setUser(me);
      if (me.role === "artist") {
        setScreen("dashboard");
        loadData();
      }
    }).catch(logout);
  }, []);

  const enter: EnterFn = async (mode, name, email, password, role) => {
    const session = mode === "register" ? await api.register(name.trim(), email.trim(), password, role) : await api.login(email.trim(), password);
    setToken(session.access_token);
    setUser(session.user);
    if (session.user.role === "artist") {
      setScreen("dashboard");
      loadData();
    }
  };

  const toggleSave = async (item: Opportunity) => {
    const next = !item.saved;
    setItems((current) => current.map((o) => (o.id === item.id ? { ...o, saved: next } : o)));
    try {
      await api.setSaved(item.id, next);
    } catch {
      setItems((current) => current.map((o) => (o.id === item.id ? { ...o, saved: !next } : o)));
    }
  };

  const markConnected = (id: number) =>
    setItems((current) => current.map((o) => (o.id === id && !o.applied ? { ...o, applied: true, interested: o.interested + 1 } : o)));

  const toggleTheme = () => setDarkMode(!darkMode);
  if (user?.role === "venue") return <div className={darkMode ? "dark-mode" : ""}><VenueApp user={user} onLogout={logout} darkMode={darkMode} onToggleTheme={toggleTheme} /></div>;
  if (screen === "login" || !user) return <Login onEnter={enter} />;
  const selected = items.find((o) => o.id === selectedId);
  const openProfile = () => setScreen("profile");
  return <div className={darkMode ? "dark-mode" : ""}>
    {screen === "profile"
      ? <ProfileScreen user={user} profile={profile} onBack={() => setScreen("dashboard")} onSaved={setProfile} onLogout={logout} darkMode={darkMode} onToggleTheme={toggleTheme} />
      : screen === "detail" && selected
      ? <Detail key={selected.id} item={selected} user={user} profile={profile} onBack={() => setScreen("dashboard")} onProfile={openProfile} onToggleSave={() => toggleSave(selected)} onConnected={() => markConnected(selected.id)} darkMode={darkMode} onToggleTheme={toggleTheme} />
      : <Dashboard user={user} profile={profile} items={items} loading={loading} error={loadError} onProfile={openProfile} onToggleSave={toggleSave} onSelect={(item) => { setSelectedId(item.id); setScreen("detail"); }} darkMode={darkMode} onToggleTheme={toggleTheme} />}
  </div>;
}
