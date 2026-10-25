"""Flujo completo del negocio: venue publica -> artista descubre y conecta -> venue acepta."""

import os
import tempfile

_db_file = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file}"
os.environ["SEED_DEMO"] = "true"
os.environ["JWT_SECRET"] = "test-secret"

from datetime import timedelta  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.timeutil import now_bogota  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
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
