import { useState } from "react";

type IconName =
  | "arrow"
  | "back"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "heart"
  | "home"
  | "mail"
  | "map"
  | "moon"
  | "music"
  | "search"
  | "spark"
  | "sun"
  | "user";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
    music: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const opportunities = [
  {
    id: 1,
    venue: "Casa Frida",
    type: "Bar cultural",
    title: "Noche de indie & alternativo",
    date: "Vie, 18 Oct",
    time: "8:00 p. m.",
    pay: "$450.000",
    unit: "por toque",
    genre: "Indie / Alternativo",
    distance: "1,8 km",
    city: "Chapinero, Bogotá",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1200&q=85",
    accent: "purple",
  },
  {
    id: 2,
    venue: "Café del Parque",
    type: "Café & terraza",
    title: "Acústico al atardecer",
    date: "Sáb, 19 Oct",
    time: "5:30 p. m.",
    pay: "$180.000",
    unit: "por hora",
    genre: "Acústico / Folk",
    distance: "3,2 km",
    city: "La Macarena, Bogotá",
    image: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=1200&q=85",
    accent: "orange",
  },
  {
    id: 3,
    venue: "Distrito 47",
    type: "Club",
    title: "Sesión de jazz en vivo",
    date: "Dom, 20 Oct",
    time: "7:00 p. m.",
    pay: "$520.000",
    unit: "por toque",
    genre: "Jazz / Soul",
    distance: "4,5 km",
    city: "Teusaquillo, Bogotá",
    image: "https://images.unsplash.com/photo-1541804627596-3b5b9ef58c93?auto=format&fit=crop&w=1200&q=85",
    accent: "blue",
  },
];

type Opportunity = (typeof opportunities)[number];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark"><i></i><i></i><i></i><i></i></span>
      <span>ColSong</span>
    </div>
  );
}

function Login({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-top"><Brand light /><span>Hecho para la escena local.</span></div>
        <div className="visual-copy">
          <div className="eyebrow light"><Icon name="spark" size={16} /> Nuevas oportunidades cada semana</div>
          <h1>Tu próximo escenario<br />está más cerca.</h1>
          <p>Conecta con lugares que están buscando exactamente lo que tú haces.</p>
          <div className="artist-row">
            <div className="artist-stack"><span>SM</span><span>LD</span><span>+8</span></div>
            <small>Artistas conectados hoy</small>
          </div>
        </div>
        <div className="photo-credit">Foto: John Matychuk · Unsplash</div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand"><Brand /></div>
        <div className="login-form">
          <div className="eyebrow">ACCESO PARA ARTISTAS</div>
          <h2>Qué bueno verte.</h2>
          <p className="muted">Ingresa para descubrir oportunidades cerca de ti.</p>
          <label>Correo electrónico</label>
          <div className="input-shell"><Icon name="mail" size={18} /><input value="sofia@luna.com" readOnly aria-label="Correo electrónico" /></div>
          <div className="password-line"><label>Contraseña</label><button className="text-button">¿La olvidaste?</button></div>
          <div className="input-shell"><span className="dots">••••••••</span><input value="" readOnly aria-label="Contraseña" /></div>
          <button className="primary-button full" onClick={onEnter}>Entrar a ColSong <Icon name="arrow" /></button>
          <div className="prototype-note"><span><Icon name="spark" size={15} /></span><p><b>Modo prototipo</b> — Usa los datos de muestra y explora el flujo.</p></div>
        </div>
        <p className="signup-copy">¿Aún no haces parte? <b>Crea tu perfil artístico</b></p>
      </section>
    </main>
  );
}

function Header({ onLogout, darkMode, onToggleTheme }: { onLogout: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  return (
    <header className="app-header">
      <Brand />
      <nav>
        <button className="nav-link active"><Icon name="home" size={18} /> Explorar</button>
      </nav>
      <button className="theme-toggle" onClick={onToggleTheme} aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"} title={darkMode ? "Modo claro" : "Modo oscuro"}>
        <Icon name={darkMode ? "sun" : "moon"} size={18} />
      </button>
      <div className="profile" onClick={onLogout} role="button" tabIndex={0}>
        <div className="avatar">SL</div>
        <div><b>Sofía Luna</b><span>Cantautora</span></div>
        <Icon name="chevron" size={16} />
      </div>
    </header>
  );
}

function OpportunityCard({ item, onSelect }: { item: Opportunity; onSelect: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="opportunity-card" onClick={onSelect}>
      <div className="card-image" style={{ backgroundImage: `url("${item.image}")` }}>
        <span className="distance"><Icon name="map" size={13} /> {item.distance}</span>
        <button className={`save-button ${saved ? "saved" : ""}`} onClick={(event) => { event.stopPropagation(); setSaved(!saved); }} aria-label="Guardar oferta">
          <Icon name="heart" size={18} />
        </button>
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

function Dashboard({ onSelect, onLogout, darkMode, onToggleTheme }: { onSelect: (item: Opportunity) => void; onLogout: () => void; darkMode: boolean; onToggleTheme: () => void }) {
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

  const filtered = opportunities.filter((item) => {
    const searchable = `${item.venue} ${item.title} ${item.genre} ${item.type} ${item.city}`.toLowerCase();
    const hour = Number(item.time.match(/\d+/)?.[0] ?? 0);
    const period = item.time.includes("p. m.") && hour < 7 ? "afternoon" : "night";
    return searchable.includes(query.trim().toLowerCase())
      && (location === "all" || item.city.startsWith(location))
      && (date === "all" || item.date === date)
      && (time === "all" || period === time);
  });

  return (
    <div className="app-shell">
      <Header onLogout={onLogout} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <main className="dashboard">
        <div className="welcome">
          <div><div className="eyebrow">JUEVES, 17 DE OCTUBRE</div><h1>Hola, Sofía. <span>¿Dónde tocarás ahora?</span></h1><p>Encontramos 12 oportunidades que coinciden con tu perfil.</p></div>
          <div className="profile-score"><div className="score-ring">84<small>%</small></div><div><b>Tu perfil destaca</b><span>Agrega un video para llegar al 100%</span></div><Icon name="chevron" size={18} /></div>
        </div>
        <div className="filters">
          <label className="search-box"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lugar, evento o género" aria-label="Buscar oportunidades" /></label>
          <label className="select-filter"><Icon name="map" size={17} /><select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Filtrar por lugar"><option value="all">Toda Bogotá</option><option value="Chapinero">Chapinero</option><option value="La Macarena">La Macarena</option><option value="Teusaquillo">Teusaquillo</option></select><Icon name="chevron" size={14} /></label>
          <label className="select-filter"><Icon name="calendar" size={17} /><select value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filtrar por fecha"><option value="all">Cualquier fecha</option>{opportunities.map((item) => <option key={item.id} value={item.date}>{item.date}</option>)}</select><Icon name="chevron" size={14} /></label>
          <label className="select-filter"><Icon name="clock" size={17} /><select value={time} onChange={(event) => setTime(event.target.value)} aria-label="Filtrar por hora"><option value="all">Cualquier hora</option><option value="afternoon">Antes de las 7 p. m.</option><option value="night">Desde las 7 p. m.</option></select><Icon name="chevron" size={14} /></label>
        </div>
        <div className="section-head"><div><h2>Oportunidades para ti</h2><p>{filtered.length} {filtered.length === 1 ? "resultado encontrado" : "resultados encontrados"}</p></div>{filtered.length < opportunities.length && <button onClick={clearFilters}>Limpiar filtros</button>}</div>
        {filtered.length > 0 ? <div className="card-grid">{filtered.map((item) => <OpportunityCard key={item.id} item={item} onSelect={() => onSelect(item)} />)}</div> : <div className="empty-state"><span><Icon name="search" size={24} /></span><h3>No encontramos oportunidades</h3><p>Prueba con otro lugar, horario o término de búsqueda.</p><button className="secondary-button" onClick={clearFilters}>Restablecer filtros</button></div>}
        <div className="tip-banner"><span><Icon name="spark" /></span><div><b>Una buena primera impresión importa</b><p>Completa tu portafolio y aumenta tus posibilidades de conexión.</p></div><button>Completar perfil <Icon name="arrow" size={17} /></button></div>
      </main>
    </div>
  );
}

function Detail({ item, onBack, darkMode, onToggleTheme }: { item: Opportunity; onBack: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [connection, setConnection] = useState<"idle" | "confirm" | "sent">("idle");
  return (
    <div className="app-shell">
      <Header onLogout={onBack} darkMode={darkMode} onToggleTheme={onToggleTheme} />
      <main className="detail-page">
        <button className="back-button" onClick={onBack}><Icon name="back" size={18} /> Volver a oportunidades</button>
        <div className="detail-layout">
          <section>
            <div className="detail-hero" style={{ backgroundImage: `url("${item.image}")` }}>
              <div className="detail-badge">OPORTUNIDAD DESTACADA</div><button className="save-button"><Icon name="heart" /></button>
              <div className="hero-overlay"><span>{item.type}</span><h1>{item.title}</h1><p><Icon name="map" size={17} /> {item.venue} · {item.city}</p></div>
            </div>
            <div className="detail-content">
              <div className="quick-facts">
                <div><span><Icon name="calendar" /></span><p>FECHA<b>{item.date}</b></p></div>
                <div><span><Icon name="clock" /></span><p>HORARIO<b>{item.time}</b></p></div>
                <div><span><Icon name="music" /></span><p>GÉNERO<b>{item.genre}</b></p></div>
              </div>
              <div className="copy-section"><h2>Sobre la presentación</h2><p>Buscamos un proyecto musical con identidad propia para acompañar una noche especial. El espacio cuenta con sonido profesional y una audiencia cercana que disfruta descubrir propuestas emergentes.</p><p>El repertorio debe tener una duración aproximada de 90 minutos, con un breve intermedio. Puedes interpretar música original y versiones.</p></div>
              <div className="included"><h3>El lugar incluye</h3><div><span><Icon name="check" size={16} /> Sistema de sonido</span><span><Icon name="check" size={16} /> Prueba de sonido</span><span><Icon name="check" size={16} /> Bebidas y cena</span><span><Icon name="check" size={16} /> Parqueadero</span></div></div>
              <div className="map-section"><div><h2>Ubicación</h2><p>{item.city}</p></div><button>Cómo llegar <Icon name="arrow" size={16} /></button><div className="fake-map"><div className="road one"></div><div className="road two"></div><div className="road three"></div><span className="map-pin"><Icon name="music" size={17} /></span><small>Casa Frida</small></div></div>
            </div>
          </section>
          <aside className="connection-card">
            <div className="offer-label">PAGO OFRECIDO</div><div className="offer-price">{item.pay}<span>{item.unit}</span></div><div className="separator"></div>
            <div className="host"><div className="host-avatar">CF</div><div><small>PUBLICADO POR</small><b>Casa Frida Bogotá</b><span><i></i> Identidad verificada</span></div></div>
            <div className="response"><div><Icon name="clock" size={17} /><span>Responde normalmente en <b>2 horas</b></span></div><div><Icon name="user" size={17} /><span><b>8 artistas</b> están interesados</span></div></div>
            {connection === "idle" && <>
              <button className="primary-button full" onClick={() => setConnection("confirm")}>Quiero conectar <Icon name="arrow" /></button>
              <p className="safe-note">No compartirás tus datos hasta que el lugar acepte.</p>
            </>}
            {connection === "confirm" && <div className="confirm-box"><div className="confirm-icon"><Icon name="music" /></div><h3>¿Enviar tu perfil?</h3><p>Casa Frida verá tu perfil artístico, portafolio y datos de contacto.</p><button className="primary-button full" onClick={() => setConnection("sent")}>Sí, enviar interés</button><button className="secondary-button full" onClick={() => setConnection("idle")}>Ahora no</button></div>}
            {connection === "sent" && <div className="success-box"><div className="success-icon"><Icon name="check" size={28} /></div><h3>¡Conexión enviada!</h3><p>Le avisamos a Casa Frida. Te notificaremos cuando respondan.</p><button className="secondary-button full" onClick={onBack}>Seguir explorando</button></div>}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"login" | "dashboard" | "detail">("login");
  const [selected, setSelected] = useState(opportunities[0]);
  const [darkMode, setDarkMode] = useState(false);

  if (screen === "login") return <Login onEnter={() => setScreen("dashboard")} />;
  return <div className={darkMode ? "dark-mode" : ""}>
    {screen === "detail"
      ? <Detail item={selected} onBack={() => setScreen("dashboard")} darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
      : <Dashboard onLogout={() => setScreen("login")} onSelect={(item) => { setSelected(item); setScreen("detail"); }} darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />}
  </div>;
}
