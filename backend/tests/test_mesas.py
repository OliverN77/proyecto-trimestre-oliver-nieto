from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.dependencies.auth import get_current_user


@pytest.fixture
def client_db() -> Generator[tuple[TestClient, sessionmaker], None, None]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = session_factory()
    rol_admin = Rol(id_rol=1, nombre_rol="Administrador")
    rol_cliente = Rol(id_rol=3, nombre_rol="Cliente")
    db.add_all([rol_admin, rol_cliente])

    admin = Usuario(
        id_usuario=1,
        nombre="Admin",
        apellido="User",
        tipo_documento="CC",
        numero_documento="12345678",
        telefono="3000000000",
        correo="admin@test.com",
        contrasena_hash="hash",
        id_rol=1,
        estado="activo"
    )
    db.add(admin)
    db.commit()
    db.close()

    def override_get_current_user(db: Session = pytest.FixtureRequest):
        # Return admin user from current test session
        pass

    try:
        yield TestClient(app), session_factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_crud_mesas_admin(client_db):
    client, session_factory = client_db

    def mock_get_current_user(db: Session = pytest.importorskip("fastapi").Depends(get_db)):
        return db.scalar(select(Usuario).where(Usuario.id_usuario == 1))

    app.dependency_overrides[get_current_user] = mock_get_current_user

    # 1. Crear mesa
    nueva_mesa = {
        "numero_mesa": 10,
        "capacidad": 4,
        "ubicacion": "terraza",
        "estado": "disponible"
    }
    response = client.post("/api/mesas", json=nueva_mesa)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["numero_mesa"] == 10
    assert data["capacidad"] == 4
    assert data["ubicacion"] == "terraza"
    id_mesa = data["id_mesa"]

    # 2. Listar mesas
    response = client.get("/api/mesas")
    assert response.status_code == 200
    mesas_list = response.json()
    assert len(mesas_list) == 1
    assert mesas_list[0]["id_mesa"] == id_mesa

    # 3. Actualizar mesa
    update_data = {"capacidad": 6, "ubicacion": "interior"}
    response = client.put(f"/api/mesas/{id_mesa}", json=update_data)
    assert response.status_code == 200
    assert response.json()["capacidad"] == 6
    assert response.json()["ubicacion"] == "interior"

    # 4. Eliminar mesa
    response = client.delete(f"/api/mesas/{id_mesa}")
    assert response.status_code == 204

    # 5. Listar mesas post-eliminar
    response = client.get("/api/mesas")
    assert response.status_code == 200
    assert len(response.json()) == 0
