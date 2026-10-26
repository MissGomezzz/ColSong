# ColSong

[![CI](https://github.com/MissGomezzz/ColSong/actions/workflows/ci.yml/badge.svg)](https://github.com/MissGomezzz/ColSong/actions/workflows/ci.yml)

Plataforma para gestionar la información de toques y presentaciones de los establecimientos para artistas y bandas emergentes en Bogotá.

Monolito modular en dos partes dentro del mismo repositorio:

| Carpeta | Qué es |
| --- | --- |
| `src/` | Frontend React + Vite + Tailwind. Artistas: explorar, detalle, favoritos, "Quiero conectar", perfil. Establecimientos: panel de publicaciones, formulario, interesados y perfil del local (`VenueApp.tsx`) |
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
| Establecimiento | `casafrida@colsong.co` (también `cafedelparque@…` y `distrito47@…`) | `colsong123` |
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

## Integración continua (CI)

Cada push a `main` dispara `.github/workflows/ci.yml` en GitHub Actions, con dos trabajos en paralelo:

| Trabajo | Qué hace |
| --- | --- |
| **Backend (pytest)** | Instala `backend/requirements-dev.txt` en Python 3.12 y corre las pruebas dos veces: con SQLite y contra un PostgreSQL 16 real (servicio del workflow) |
| **Frontend (typecheck + build)** | `pnpm install --frozen-lockfile`, `pnpm typecheck` y `pnpm build` en Node 22 |

El resultado se ve en la pestaña **Actions** del repositorio y en la insignia de arriba. Para reproducirlo en tu computador:

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest -q
cd .. && pnpm install --frozen-lockfile && pnpm typecheck && pnpm build
```

El despliegue continuo (CD) todavía no está configurado.

## Flujo de negocio

1. **Registro:** en la pantalla de acceso, "Crea tu perfil" permite elegir **artista** o **establecimiento**. Al iniciar sesión, la interfaz se adapta al rol de la cuenta.
2. **Establecimiento:** completa el perfil de su local (nombre, tipo, barrio, dirección, foto, color) y desde su panel **crea publicaciones** (título, género, fecha y hora, duración, pago, descripción, qué incluye el lugar e imagen). Mientras escribe ve una **vista previa** de la tarjeta tal como la verán los artistas. Puede **editar, cerrar/reabrir, reprogramar y eliminar** cada publicación.
3. **Artista:** explora las publicaciones abiertas (filtros por texto, barrio, fecha, horario y cercanía), guarda favoritos y pulsa **Quiero conectar**.
4. **Establecimiento:** en "Interesados" ve el perfil de cada artista y **acepta o rechaza**. Solo al aceptar se revelan el correo y el teléfono del artista.
5. **Artista:** al volver a la publicación ve si fue **aceptado** (y el teléfono del local) o no seleccionado.

Todo el flujo está disponible también en la API (`/docs`): `POST /api/venues`, `POST|PATCH|DELETE /api/opportunities`, `GET /api/opportunities/mine`, `GET /api/opportunities/{id}/applications`, `PATCH /api/applications/{id}`.

## Persistencia de datos

Las publicaciones, perfiles, postulaciones y favoritos se guardan en la base de datos configurada en `DATABASE_URL`, no en el navegador:

- **Local:** SQLite (`backend/colsong.db`, se crea sola; ignorada por Git). Los datos sobreviven a reiniciar el servidor.
- **Producción:** PostgreSQL. Basta con definir `DATABASE_URL` (por ejemplo, la URL que entrega Neon, `postgresql://...`); el backend ya incluye el driver y el CI prueba contra PostgreSQL 16 en cada push.
- Los datos de demostración (`SEED_DEMO=true`) solo se cargan si la base está vacía.
- Eliminar una publicación borra en cascada sus postulaciones y favoritos.

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
- **Migraciones:** aún no hay Alembic; las tablas se crean al arrancar. Si más adelante cambian columnas de tablas ya existentes en producción, habrá que añadir migraciones.
- **Coordenadas de los locales:** al elegir un barrio de la lista se guardan coordenadas aproximadas de la zona; solo sirven para ordenar por cercanía y mostrar la distancia al artista.
- **Enlaces:** el backend solo acepta enlaces `http(s)` en portafolio, video e imágenes, para que nadie pueda guardar un enlace malicioso que luego otro usuario vea.
- **Seguridad antes de producción:** define un `JWT_SECRET` largo y aleatorio, restringe `CORS_ORIGINS` y desactiva `SEED_DEMO`.
