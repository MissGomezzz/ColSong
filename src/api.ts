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
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type User = { id: number; email: string; role: "artist" | "venue"; full_name: string };
export type ArtistProfile = { stage_name: string; artist_type: string | null; completeness: number; missing: string[] };

type ApiOpportunity = {
  id: number;
  title: string;
  description: string | null;
  genre: string;
  starts_at: string;
  pay_amount: number;
  pay_unit: "toque" | "hora";
  image_url: string | null;
  includes: string[];
  venue: { name: string; venue_type: string; neighborhood: string; address: string; verified: boolean; response_hours: number; accent: string };
  distance_km: number | null;
  interested_count: number;
  saved: boolean;
  my_application_status: string | null;
};

// Modelo que consume la interfaz (textos ya formateados en español).
export type Opportunity = {
  id: number;
  venue: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  pay: string;
  unit: string;
  genre: string;
  distance: string | null;
  city: string;
  address: string;
  image: string;
  accent: string;
  includes: string[];
  verified: boolean;
  responseHours: number;
  interested: number;
  saved: boolean;
  applied: boolean;
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1200&q=85";

function toOpportunity(o: ApiOpportunity): Opportunity {
  // starts_at llega como hora local de Bogotá ("2026-11-06T20:00:00"), se lee sin convertir zonas.
  const [, y, mo, d, h, mi] = o.starts_at.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/)!.map(Number);
  const weekday = new Date(y, mo - 1, d).getDay();
  return {
    id: o.id,
    venue: o.venue.name,
    type: o.venue.venue_type,
    title: o.title,
    description: o.description ?? "",
    date: `${DAYS[weekday]}, ${d} ${MONTHS[mo - 1]}`,
    time: `${h % 12 || 12}:${String(mi).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`,
    pay: `$${new Intl.NumberFormat("es-CO").format(o.pay_amount)}`,
    unit: `por ${o.pay_unit}`,
    genre: o.genre,
    distance: o.distance_km == null ? null : `${o.distance_km.toFixed(1).replace(".", ",")} km`,
    city: `${o.venue.neighborhood}, Bogotá`,
    address: o.venue.address,
    image: o.image_url ?? FALLBACK_IMAGE,
    accent: o.venue.accent,
    includes: o.includes,
    verified: o.venue.verified,
    responseHours: o.venue.response_hours,
    interested: o.interested_count,
    saved: o.saved,
    applied: o.my_application_status !== null && o.my_application_status !== "withdrawn",
  };
}

export const api = {
  async login(email: string, password: string) {
    const res = await request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return res;
  },
  async register(full_name: string, email: string, password: string) {
    return request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password, role: "artist" }),
    });
  },
  me: () => request<User>("/auth/me"),
  myProfile: () => request<ArtistProfile>("/artists/me"),
  async opportunities(coords?: { lat: number; lng: number } | null) {
    const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
    return (await request<ApiOpportunity[]>(`/opportunities${query}`)).map(toOpportunity);
  },
  setSaved: (id: number, saved: boolean) =>
    request<{ saved: boolean }>(`/opportunities/${id}/favorite`, { method: saved ? "PUT" : "DELETE" }),
  connect: (id: number) =>
    request(`/opportunities/${id}/applications`, { method: "POST", body: JSON.stringify({}) }),
};
