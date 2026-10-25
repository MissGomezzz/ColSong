# ColSong

Plataforma para gestionar la información de toques y presentaciones de los establecimientos para artistas y bandas emergentes en Bogotá.

Monolito modular en dos partes dentro del mismo repositorio:

| Carpeta | Qué es |
| --- | --- |
| `src/` | Frontend React + Vite + Tailwind (artistas: login, explorar, detalle, favoritos, "Quiero conectar") |
| `backend/` | API REST en FastAPI + SQLAlchemy (SQLite por defecto) |

## Cómo correrlo

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # opcional: ajusta JWT_SECRET, CORS, etc.
uvicorn app.main:app --reload --port 8000
```

La API queda en http://localhost:8000 y la documentación interactiva en http://localhost:8000/docs. Con `SEED_DEMO=true` (por defecto) la primera vez crea datos de demostración:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Artista | `sofia@luna.com` | `colsong123` |
| Establecimiento | `casafrida@colsong.co`, `cafedelparque@colsong.co`, `distrito47@colsong.co` | `colsong123` |

**Frontend** (Node 22 + pnpm):

```bash
pnpm install
pnpm dev            # http://localhost:8443
```

Si el backend corre en otra URL, crea `.env.local` con `VITE_API_URL=https://tu-api`.

**Pruebas del backend:**

```bash
cd backend && pip install -r requirements-dev.txt && pytest
```

## Flujo de negocio

1. Un **establecimiento** se registra (`role: "venue"`), crea su local (`POST /api/venues`) y publica toques (`POST /api/opportunities`).
2. Un **artista** se registra desde la web, explora oportunidades (filtros por texto, barrio, fecha, horario y cercanía), guarda favoritos y pulsa **Quiero conectar**.
3. El establecimiento ve los interesados (`GET /api/opportunities/{id}/applications`) y **acepta o rechaza** (`PATCH /api/applications/{id}`). Solo al aceptar se revelan el correo y el teléfono del artista.
4. El artista ve el estado de sus postulaciones en `GET /api/applications/mine`.

La interfaz web cubre el lado del artista; el lado del establecimiento ya está disponible en la API (probable desde `/docs`) y es el siguiente paso natural para construir un panel.

## Arquitectura del backend

```
backend/app/
├── main.py            # ensambla la app: routers, CORS, tablas, datos demo
├── seed.py            # datos de demostración
├── core/              # config, base de datos, seguridad (JWT/scrypt), fechas
└── modules/           # un módulo por dominio
    ├── users/         # modelo User (rol: artist | venue)
    ├── auth/          # registro, login, dependencias de sesión y roles
    ├── artists/       # perfil artístico y % de perfil completo
    ├── venues/        # establecimientos (verificación manual por el equipo)
    ├── opportunities/ # toques publicados + consulta con filtros
    ├── applications/  # "Quiero conectar" y decisión del establecimiento
    └── favorites/     # oportunidades guardadas
```

Reglas del monolito modular: cada módulo tiene su `models`, `schemas`, `service` y `router`; un módulo puede usar los `models`/`service` de otro pero nunca su `router`, y no hay `relationship()` entre módulos (solo claves foráneas). El mapa de dependencias permitidas está en `backend/app/main.py`.

## Decisiones y notas

- **Horarios:** `starts_at` se guarda como hora local de Bogotá (sin zona horaria), porque el producto opera en una sola ciudad.
- **Verificación de establecimientos:** el campo `verified` lo gestiona el equipo de ColSong (por ahora directamente en la base de datos).
- **Base de datos:** SQLite para arrancar; para producción basta con definir `DATABASE_URL` hacia PostgreSQL (y añadir `psycopg` a `requirements.txt`). Aún no hay migraciones (Alembic): las tablas se crean al arrancar.
- **Seguridad antes de producción:** define un `JWT_SECRET` largo y aleatorio, restringe `CORS_ORIGINS` y desactiva `SEED_DEMO`.
