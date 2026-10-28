// Cliente de la API de ColSong (backend/). Configura la URL con VITE_API_URL.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
const TOKEN_KEY = "colsong_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string | null) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

// Nombres en español de los campos, para los errores de validación del servidor.
const FIELD_LABELS: Record<string, string> = {
  title: "el título", genre: "el género", pay_amount: "el pago", starts_at: "la fecha y hora", description: "la descripción",
  duration_minutes: "la duración", image_url: "la imagen", name: "el nombre del local", venue_type: "el tipo de local",
  neighborhood: "el barrio", address: "la dirección", phone: "el teléfono", full_name: "el nombre", email: "el correo",
  password: "la contraseña", portfolio_url: "el portafolio", video_url: "el video", bio: "la biografía", stage_name: "el nombre artístico",
};

function validationMessage(detail: unknown[]): string {
  const first = detail[0] as { loc?: unknown[]; msg?: string } | undefined;
  const field = String(first?.loc?.[first.loc.length - 1] ?? "");
  const label = FIELD_LABELS[field] ?? "los datos";
  const custom = first?.msg?.startsWith("Value error, ") ? first.msg.slice("Value error, ".length) : "";
  return custom ? `Revisa ${label}: ${custom}` : `Revisa ${label}: el valor no es válido.`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "No pudimos conectar con el servidor. Intenta de nuevo.");
  }
  if (!res.ok) {
    let message = "Ocurrió un error inesperado.";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail) && body.detail.length) message = validationMessage(body.detail);
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type Role = "artist" | "venue";
export type User = { id: number; email: string; role: Role; full_name: string };
export type ArtistProfile = {
  user_id: number;
  stage_name: string;
  artist_type: string | null;
  bio: string | null;
  genres: string[];
  city: string;
  phone: string | null;
  instagram: string | null;
  portfolio_url: string | null;
  video_url: string | null;
  completeness: number;
  missing: string[];
};
export type ArtistProfileInput = Partial<Omit<ArtistProfile, "user_id" | "completeness" | "missing" | "city">>;

export type Venue = {
  id: number;
  name: string;
  venue_type: string;
  description: string | null;
  neighborhood: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  image_url: string | null;
  accent: string;
  verified: boolean;
  response_hours: number;
};
export type VenueInput = Omit<Venue, "id" | "verified" | "response_hours">;

export type PostInput = {
  venue_id: number;
  title: string;
  description: string | null;
  genre: string;
  starts_at: string; // hora local de Bogotá, "YYYY-MM-DDTHH:mm"
  duration_minutes: number;
  pay_amount: number;
  pay_unit: "toque" | "hora";
  image_url: string | null;
  includes: string[];
};

export type Applicant = {
  id: number;
  opportunity_id: number;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  artist: {
    id: number;
    full_name: string;
    stage_name: string;
    artist_type: string | null;
    genres: string[];
    bio: string | null;
    instagram: string | null;
    portfolio_url: string | null;
    video_url: string | null;
    email: string | null; // solo si el local aceptó
    phone: string | null; // solo si el local aceptó
  };
};

/** Postulación del artista. `venue_contact` llega solo cuando el local aceptó. */
export type Connection = {
  id: number;
  opportunity_id: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  opportunity_title: string | null;
  venue_name: string | null;
  venue_neighborhood: string | null;
  venue_contact: { address: string; phone: string | null } | null;
  starts_at: string | null;
};

type ApiOpportunity = {
  id: number;
  title: string;
  description: string | null;
  genre: string;
  starts_at: string;
  duration_minutes: number;
  pay_amount: number;
  pay_unit: "toque" | "hora";
  image_url: string | null;
  includes: string[];
  status: "open" | "closed";
  venue: { id: number; name: string; venue_type: string; neighborhood: string; address: string | null; verified: boolean; response_hours: number; accent: string };
  distance_km: number | null;
  interested_count: number;
  saved: boolean;
  my_application_status: string | null;
  own_image_url: string | null;
  pending_count: number;
  is_past: boolean;
  venue_phone: string | null;
};

// Modelo que consume la interfaz (textos ya formateados en español).
export type Opportunity = {
  id: number;
  venueId: number;
  venue: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  startsAt: string; // "YYYY-MM-DDTHH:mm:ss", hora de Bogotá
  durationMinutes: number;
  pay: string;
  payAmount: number;
  payUnit: "toque" | "hora";
  unit: string;
  genre: string;
  distance: string | null;
  city: string;
  address: string | null; // dirección exacta: solo tras la aceptación del local (el artista ve solo el barrio)
  image: string;
  ownImage: string | null;
  accent: string;
  includes: string[];
  verified: boolean;
  responseHours: number;
  interested: number;
  pending: number;
  saved: boolean;
  applied: boolean;
  applicationStatus: string | null;
  contactPhone: string | null;
  status: "open" | "closed";
  isPast: boolean;
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1200&q=85";

/** Convierte la hora local de Bogotá ("2026-11-06T20:00:00") a textos legibles, sin convertir zonas horarias. */
export function formatStart(startsAt: string): { date: string; time: string } {
  const match = startsAt.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
  if (!match) return { date: "Fecha por definir", time: "—" };
  const [, y, mo, d, h, mi] = match.map(Number);
  const weekday = new Date(y, mo - 1, d).getDay();
  return {
    date: `${DAYS[weekday]}, ${d} ${MONTHS[mo - 1]}`,
    time: `${h % 12 || 12}:${String(mi).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`,
  };
}

export const formatPay = (amount: number) => `$${new Intl.NumberFormat("es-CO").format(amount)}`;

/** Fecha y hora actuales en Bogotá con el formato de <input type="datetime-local">. */
export function bogotaNowLocal(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 16).replace(" ", "T");
}

function toOpportunity(o: ApiOpportunity): Opportunity {
  const { date, time } = formatStart(o.starts_at);
  return {
    id: o.id,
    venueId: o.venue.id,
    venue: o.venue.name,
    type: o.venue.venue_type,
    title: o.title,
    description: o.description ?? "",
    date,
    time,
    startsAt: o.starts_at,
    durationMinutes: o.duration_minutes,
    pay: formatPay(o.pay_amount),
    payAmount: o.pay_amount,
    payUnit: o.pay_unit,
    unit: `por ${o.pay_unit}`,
    genre: o.genre,
    distance: o.distance_km == null ? null : `${o.distance_km.toFixed(1).replace(".", ",")} km`,
    city: `${o.venue.neighborhood}, Bogotá`,
    address: o.venue.address,
    image: o.image_url ?? FALLBACK_IMAGE,
    ownImage: o.own_image_url,
    accent: o.venue.accent,
    includes: o.includes,
    verified: o.venue.verified,
    responseHours: o.venue.response_hours,
    interested: o.interested_count,
    pending: o.pending_count,
    saved: o.saved,
    applied: o.my_application_status !== null && o.my_application_status !== "withdrawn",
    applicationStatus: o.my_application_status,
    contactPhone: o.venue_phone,
    status: o.status,
    isPast: o.is_past,
  };
}

/** Publicación tal como la vería un artista, a partir de lo que el local va escribiendo (vista previa). */
export function previewOpportunity(venue: Venue, f: Pick<PostInput, "title" | "genre" | "starts_at" | "pay_amount" | "pay_unit" | "image_url" | "description" | "includes" | "duration_minutes">): Opportunity {
  const { date, time } = f.starts_at ? formatStart(f.starts_at) : { date: "Fecha por definir", time: "—" };
  return {
    id: 0, venueId: venue.id, venue: venue.name, type: venue.venue_type,
    title: f.title.trim() || "Título de tu publicación", description: f.description ?? "",
    date, time, startsAt: f.starts_at, durationMinutes: f.duration_minutes,
    pay: f.pay_amount > 0 ? formatPay(f.pay_amount) : "$0", payAmount: f.pay_amount, payUnit: f.pay_unit, unit: `por ${f.pay_unit}`,
    genre: f.genre.trim() || "Género", distance: null, city: `${venue.neighborhood}, Bogotá`, address: venue.address,
    image: f.image_url || venue.image_url || FALLBACK_IMAGE, ownImage: f.image_url, accent: venue.accent, includes: f.includes,
    verified: venue.verified, responseHours: venue.response_hours, interested: 0, pending: 0, saved: false, applied: false,
    applicationStatus: null, contactPhone: null, status: "open", isPast: false,
  };
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: json({ email, password }) }),
  register: (full_name: string, email: string, password: string, role: Role = "artist") =>
    request<{ access_token: string; user: User }>("/auth/register", { method: "POST", body: json({ full_name, email, password, role }) }),
  me: () => request<User>("/auth/me"),

  // Artista
  myProfile: () => request<ArtistProfile>("/artists/me"),
  updateProfile: (data: ArtistProfileInput) => request<ArtistProfile>("/artists/me", { method: "PUT", body: json(data) }),
  async opportunities(coords?: { lat: number; lng: number } | null) {
    const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
    return (await request<ApiOpportunity[]>(`/opportunities${query}`)).map(toOpportunity);
  },
  setSaved: (id: number, saved: boolean) =>
    request<{ saved: boolean }>(`/opportunities/${id}/favorite`, { method: saved ? "PUT" : "DELETE" }),
  connect: (id: number) => request(`/opportunities/${id}/applications`, { method: "POST", body: json({}) }),
  myConnections: () => request<Connection[]>("/applications/mine"),

  // Establecimiento
  myVenues: () => request<Venue[]>("/venues/mine"),
  createVenue: (data: VenueInput) => request<Venue>("/venues", { method: "POST", body: json(data) }),
  updateVenue: (id: number, data: VenueInput) => request<Venue>(`/venues/${id}`, { method: "PUT", body: json(data) }),
  async myPosts() {
    return (await request<ApiOpportunity[]>("/opportunities/mine")).map(toOpportunity);
  },
  async createPost(data: PostInput) {
    return toOpportunity(await request<ApiOpportunity>("/opportunities", { method: "POST", body: json(data) }));
  },
  async updatePost(id: number, data: Partial<Omit<PostInput, "venue_id">> & { status?: "open" | "closed" }) {
    return toOpportunity(await request<ApiOpportunity>(`/opportunities/${id}`, { method: "PATCH", body: json(data) }));
  },
  deletePost: (id: number) => request<void>(`/opportunities/${id}`, { method: "DELETE" }),
  applicants: (id: number) => request<Applicant[]>(`/opportunities/${id}/applications`),
  decide: (applicationId: number, status: "accepted" | "rejected") =>
    request<Applicant>(`/applications/${applicationId}`, { method: "PATCH", body: json({ status }) }),
};
