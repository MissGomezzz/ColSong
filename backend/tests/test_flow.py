"""Flujo completo del negocio: venue publica -> artista descubre y conecta -> venue acepta."""

import os
import tempfile

# Por defecto usa una base SQLite temporal. Con TEST_DATABASE_URL (p. ej. PostgreSQL en el CI)
# corre contra esa base, que se vacía al empezar.
_db_file = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{_db_file}"
os.environ["SEED_DEMO"] = "true"
os.environ["JWT_SECRET"] = "test-secret"

from datetime import timedelta  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.timeutil import now_bogota  # noqa: E402
from app.core.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    Base.metadata.drop_all(engine)  # no-op en SQLite temporal; limpia la base si es PostgreSQL
    with TestClient(app) as c:  # dispara el lifespan: crea tablas y siembra datos
        yield c


def login(client, email, password="colsong123"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_login_rejects_bad_password(client):
    r = client.post("/api/auth/login", json={"email": "sofia@luna.com", "password": "incorrecta"})
    assert r.status_code == 401


def test_requires_auth_for_artist_endpoints(client):
    assert client.get("/api/artists/me").status_code == 401


def test_artist_profile_completeness(client):
    h = login(client, "sofia@luna.com")
    profile = client.get("/api/artists/me", headers=h).json()
    assert profile["completeness"] == 88
    assert profile["missing"] == ["video"]
    r = client.put("/api/artists/me", headers=h, json={"video_url": "https://youtu.be/x"})
    assert r.json()["completeness"] == 100


def test_list_filters_and_flags(client):
    h = login(client, "sofia@luna.com")
    all_items = client.get("/api/opportunities", headers=h).json()
    assert len(all_items) == 6
    assert all_items == sorted(all_items, key=lambda o: o["starts_at"])
    assert all(o["venue"]["name"] for o in all_items)

    assert {o["venue"]["neighborhood"] for o in client.get("/api/opportunities?neighborhood=Chapinero").json()} == {"Chapinero"}
    assert all(o["genre"].lower().find("jazz") >= 0 for o in client.get("/api/opportunities?q=jazz").json())
    night = client.get("/api/opportunities?period=night").json()
    assert night and all(int(o["starts_at"][11:13]) >= 19 for o in night)

    near = client.get("/api/opportunities?lat=4.65&lng=-74.06").json()
    assert all(o["distance_km"] is not None for o in near)


def test_favorite_toggle(client):
    h = login(client, "sofia@luna.com")
    first = client.get("/api/opportunities", headers=h).json()[0]["id"]
    assert client.put(f"/api/opportunities/{first}/favorite", headers=h).json() == {"saved": True}
    assert client.get(f"/api/opportunities/{first}", headers=h).json()["saved"] is True
    assert [o["id"] for o in client.get("/api/favorites", headers=h).json()] == [first]
    assert client.delete(f"/api/opportunities/{first}/favorite", headers=h).json() == {"saved": False}
    assert client.get("/api/favorites", headers=h).json() == []


def test_full_connection_flow(client):
    artist = login(client, "sofia@luna.com")
    venue = login(client, "casafrida@colsong.co")

    # el establecimiento publica
    venue_id = client.get("/api/venues/mine", headers=venue).json()[0]["id"]
    when = (now_bogota() + timedelta(days=10)).replace(microsecond=0).isoformat()
    created = client.post(
        "/api/opportunities", headers=venue,
        json={"venue_id": venue_id, "title": "Noche de prueba", "genre": "Pop", "starts_at": when,
              "pay_amount": 300000, "pay_unit": "toque", "includes": ["Sistema de sonido"]},
    )
    assert created.status_code == 201, created.text
    opp_id = created.json()["id"]

    # un artista no puede publicar; un venue no puede postularse
    assert client.post("/api/opportunities", headers=artist, json={}).status_code == 403
    assert client.post(f"/api/opportunities/{opp_id}/applications", headers=venue).status_code == 403
    # fecha pasada rechazada
    past = client.post(
        "/api/opportunities", headers=venue,
        json={"venue_id": venue_id, "title": "Ayer", "genre": "Pop", "starts_at": "2020-01-01T20:00:00", "pay_amount": 1},
    )
    assert past.status_code == 422

    # el artista conecta
    r = client.post(f"/api/opportunities/{opp_id}/applications", headers=artist, json={"message": "¡Hola!"})
    assert r.status_code == 201 and r.json()["status"] == "pending"
    assert client.post(f"/api/opportunities/{opp_id}/applications", headers=artist).status_code == 409
    detail = client.get(f"/api/opportunities/{opp_id}", headers=artist).json()
    assert detail["interested_count"] == 1 and detail["my_application_status"] == "pending"

    # el venue ve al artista SIN contacto, acepta y entonces se revela
    apps = client.get(f"/api/opportunities/{opp_id}/applications", headers=venue).json()
    assert apps[0]["artist"]["stage_name"] == "Sofía Luna" and apps[0]["artist"]["email"] is None
    decided = client.patch(f"/api/applications/{apps[0]['id']}", headers=venue, json={"status": "accepted"}).json()
    assert decided["artist"]["email"] == "sofia@luna.com"

    # otro venue no puede ver ni decidir sobre esta oportunidad
    other = login(client, "cafedelparque@colsong.co")
    assert client.get(f"/api/opportunities/{opp_id}/applications", headers=other).status_code == 404
    assert client.patch(f"/api/applications/{apps[0]['id']}", headers=other, json={"status": "rejected"}).status_code == 404

    # el artista ve su historial
    mine = client.get("/api/applications/mine", headers=artist).json()
    assert mine[0]["status"] == "accepted" and mine[0]["venue_name"] == "Casa Frida"

    # cerrar la oportunidad la saca del listado público
    assert client.patch(f"/api/opportunities/{opp_id}", headers=venue, json={"status": "closed"}).status_code == 200
    assert opp_id not in [o["id"] for o in client.get("/api/opportunities").json()]


def test_register_new_artist(client):
    r = client.post("/api/auth/register", json={"email": "Nuevo@Banda.co", "password": "supersecreta", "full_name": "Los Nuevos"})
    assert r.status_code == 201
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get("/api/artists/me", headers=h).json()["stage_name"] == "Los Nuevos"
    assert client.post("/api/auth/register", json={"email": "nuevo@banda.co", "password": "supersecreta", "full_name": "Otro"}).status_code == 409


def test_profile_accepts_cleared_fields(client):
    """El frontend envía null para campos vacíos: debe bajar el porcentaje, no fallar."""
    h = login(client, "sofia@luna.com")
    r = client.put("/api/artists/me", headers=h, json={"bio": None, "phone": None, "genres": []})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["missing"] == ["biografía", "géneros", "teléfono"]
    assert body["completeness"] == 62
    assert client.put("/api/artists/me", headers=h, json={"stage_name": ""}).status_code == 422


def _future(days=10, hour=20):
    return (now_bogota() + timedelta(days=days)).replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


def _new_post(client, venue_h, venue_id, **overrides):
    body = {"venue_id": venue_id, "title": "Publicación de prueba", "genre": "Rock", "starts_at": _future(),
            "pay_amount": 250000, "pay_unit": "toque", "includes": ["Backline"], **overrides}
    r = client.post("/api/opportunities", headers=venue_h, json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_new_venue_onboarding_and_panel(client):
    """Un local nuevo se registra, crea su perfil, publica y ve su panel (con conteos)."""
    r = client.post("/api/auth/register", json={"email": "nuevo@local.co", "password": "supersecreta",
                                                "full_name": "Ana Gómez", "role": "venue"})
    assert r.status_code == 201 and r.json()["user"]["role"] == "venue"
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}

    assert client.get("/api/venues/mine", headers=h).json() == []
    venue = client.post("/api/venues", headers=h, json={
        "name": "La Casa del Rock", "venue_type": "Bar", "neighborhood": "Usaquén", "address": "Cra. 7 #119-10",
        "latitude": 4.69, "longitude": -74.03, "phone": "+57 300 111 2233", "accent": "orange"})
    assert venue.status_code == 201 and venue.json()["verified"] is False
    venue_id = venue.json()["id"]

    post = _new_post(client, h, venue_id, title="Rock en vivo")
    assert post["pending_count"] == 0 and post["is_past"] is False and post["own_image_url"] is None
    # y la publicación es visible para los artistas, con el barrio nuevo
    artist = login(client, "sofia@luna.com")
    listed = client.get("/api/opportunities", headers=artist).json()
    assert post["id"] in [o["id"] for o in listed]
    assert "Usaquén" in {o["venue"]["neighborhood"] for o in listed}

    # el panel ve el conteo de pendientes cuando un artista conecta
    client.post(f"/api/opportunities/{post['id']}/applications", headers=artist, json={})
    mine = client.get("/api/opportunities/mine", headers=h).json()
    assert [(o["title"], o["pending_count"], o["interested_count"]) for o in mine] == [("Rock en vivo", 1, 1)]


def test_venue_can_clear_optional_fields_and_urls_are_validated(client):
    h = login(client, "distrito47@colsong.co")
    venue = client.get("/api/venues/mine", headers=h).json()[0]
    r = client.put(f"/api/venues/{venue['id']}", headers=h, json={"phone": None, "description": None, "name": None})
    assert r.status_code == 200
    assert r.json()["phone"] is None and r.json()["name"] == "Distrito 47"  # name no admite null: se conserva
    bad = client.put(f"/api/venues/{venue['id']}", headers=h, json={"image_url": "javascript:alert(1)"})
    assert bad.status_code == 422
    # un artista tampoco puede guardar enlaces que no sean http(s)
    artist = login(client, "sofia@luna.com")
    assert client.put("/api/artists/me", headers=artist, json={"portfolio_url": "javascript:alert(1)"}).status_code == 422
    ok = client.put("/api/artists/me", headers=artist, json={"portfolio_url": "https://sofialuna.example.com"})
    assert ok.status_code == 200


def test_update_close_reopen_and_date_rules(client):
    h = login(client, "cafedelparque@colsong.co")
    venue_id = client.get("/api/venues/mine", headers=h).json()[0]["id"]
    post = _new_post(client, h, venue_id, image_url="https://example.com/foto.jpg", description="Texto")
    pid = post["id"]
    assert post["own_image_url"] == "https://example.com/foto.jpg"

    r = client.patch(f"/api/opportunities/{pid}", headers=h, json={"title": "Título nuevo", "description": None, "image_url": None})
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Título nuevo" and body["description"] is None and body["own_image_url"] is None

    assert client.patch(f"/api/opportunities/{pid}", headers=h, json={"starts_at": "2020-01-01T20:00:00"}).status_code == 422
    assert client.patch(f"/api/opportunities/{pid}", headers=h, json={"status": "closed"}).json()["status"] == "closed"
    assert client.patch(f"/api/opportunities/{pid}", headers=h, json={"status": "open"}).json()["status"] == "open"
    client.delete(f"/api/opportunities/{pid}", headers=h)


def test_delete_removes_applications_and_favorites_and_checks_owner(client):
    owner = login(client, "casafrida@colsong.co")
    other = login(client, "cafedelparque@colsong.co")
    artist = login(client, "sofia@luna.com")
    venue_id = client.get("/api/venues/mine", headers=owner).json()[0]["id"]
    pid = _new_post(client, owner, venue_id)["id"]
    client.post(f"/api/opportunities/{pid}/applications", headers=artist, json={})
    client.put(f"/api/opportunities/{pid}/favorite", headers=artist)

    assert client.delete(f"/api/opportunities/{pid}", headers=other).status_code == 404  # no es su local
    assert client.delete(f"/api/opportunities/{pid}", headers=artist).status_code == 403  # un artista no borra
    assert client.delete(f"/api/opportunities/{pid}", headers=owner).status_code == 204

    assert client.get(f"/api/opportunities/{pid}", headers=artist).status_code == 404
    assert pid not in [o["id"] for o in client.get("/api/favorites", headers=artist).json()]
    assert pid not in [a["opportunity_id"] for a in client.get("/api/applications/mine", headers=artist).json()]


def test_artist_sees_venue_phone_only_after_acceptance(client):
    owner = login(client, "casafrida@colsong.co")
    artist = login(client, "sofia@luna.com")
    venue = client.get("/api/venues/mine", headers=owner).json()[0]
    pid = _new_post(client, owner, venue["id"])["id"]
    client.post(f"/api/opportunities/{pid}/applications", headers=artist, json={})
    assert client.get(f"/api/opportunities/{pid}", headers=artist).json()["venue_phone"] is None

    app_id = client.get(f"/api/opportunities/{pid}/applications", headers=owner).json()[0]["id"]
    client.patch(f"/api/applications/{app_id}", headers=owner, json={"status": "accepted"})
    detail = client.get(f"/api/opportunities/{pid}", headers=artist).json()
    assert detail["my_application_status"] == "accepted" and detail["venue_phone"] == venue["phone"]
    client.delete(f"/api/opportunities/{pid}", headers=owner)


def test_contact_stays_hidden_until_the_venue_accepts(client):
    """Política tipo Airbnb: dirección, teléfonos, Instagram y contactos en texto libre
    solo se revelan cuando el local acepta al artista."""
    owner = login(client, "casafrida@colsong.co")
    artist = login(client, "sofia@luna.com")
    venue = client.get("/api/venues/mine", headers=owner).json()[0]
    pid = _new_post(
        client, owner, venue["id"],
        title="Noche de jazz (info 300 123 4567)",
        description="Escríbenos a casa@frida.co o al +57 300 123 4567. Pago $1.200.000.",
    )["id"]

    # --- Antes de aceptar: el artista (y cualquier visitante) solo ve el barrio
    for headers in (artist, {}):
        d = client.get(f"/api/opportunities/{pid}?lat=4.65&lng=-74.06", headers=headers).json()
        assert d["venue"]["address"] is None and d["venue"]["latitude"] is None and d["venue"]["longitude"] is None
        assert d["venue"]["neighborhood"] == "Chapinero" and d["venue_phone"] is None
        assert "300 123 4567" not in d["title"] and "casa@frida.co" not in d["description"]
        assert "$1.200.000" in d["description"]  # los precios no se enmascaran
        assert d["distance_km"] is not None and (d["distance_km"] * 2) % 1 == 0  # redondeada a 0,5 km
    listed = next(o for o in client.get("/api/opportunities", headers=artist).json() if o["id"] == pid)
    assert listed["venue"]["address"] is None
    # el dueño sí ve su texto completo y la dirección
    own = client.get(f"/api/opportunities/{pid}", headers=owner).json()
    assert "casa@frida.co" in own["description"] and own["venue"]["address"] == venue["address"]

    # --- El artista intenta colar su contacto en la biografía y en el mensaje
    client.put("/api/artists/me", headers=artist,
               json={"bio": "Escríbeme al 300 765 4321 o a @sofia.luna.music", "instagram": "@sofialuna.music"})
    client.post(f"/api/opportunities/{pid}/applications", headers=artist, json={"message": "Mi correo es sofia@luna.com"})
    apps_url = f"/api/opportunities/{pid}/applications"
    first = client.get(apps_url, headers=owner).json()[0]
    a = first["artist"]
    assert a["instagram"] is None and a["email"] is None and a["phone"] is None
    assert "765 4321" not in a["bio"] and "sofia.luna.music" not in a["bio"]
    assert "sofia@luna.com" not in first["message"]
    assert a["portfolio_url"]  # el portafolio sí se ve: es lo que permite evaluar al artista
    entry = next(x for x in client.get("/api/applications/mine", headers=artist).json() if x["opportunity_id"] == pid)
    assert entry["venue_contact"] is None and entry["venue_neighborhood"] == "Chapinero"
    assert entry["message"] == "Mi correo es sofia@luna.com"  # el artista ve su propio mensaje completo
    assert "300 123 4567" not in entry["opportunity_title"]

    # --- Tras aceptar: se revela todo, en ambos sentidos
    client.patch(f"/api/applications/{first['id']}", headers=owner, json={"status": "accepted"})
    a = client.get(apps_url, headers=owner).json()[0]["artist"]
    assert a["instagram"] == "@sofialuna.music" and a["email"] == "sofia@luna.com" and "765 4321" in a["bio"]
    d = client.get(f"/api/opportunities/{pid}", headers=artist).json()
    assert d["venue"]["address"] == venue["address"] and d["venue"]["latitude"] == venue["latitude"]
    assert d["venue_phone"] == venue["phone"] and "casa@frida.co" in d["description"]
    # y el artista conserva el contacto aunque el local cierre la publicación (ya no sale en el listado)
    client.patch(f"/api/opportunities/{pid}", headers=owner, json={"status": "closed"})
    assert pid not in [o["id"] for o in client.get("/api/opportunities", headers=artist).json()]
    entry = next(x for x in client.get("/api/applications/mine", headers=artist).json() if x["opportunity_id"] == pid)
    assert entry["venue_contact"] == {"address": venue["address"], "phone": venue["phone"]}
    client.delete(f"/api/opportunities/{pid}", headers=owner)
