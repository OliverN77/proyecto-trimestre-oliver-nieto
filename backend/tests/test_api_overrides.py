from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Mesa, Pedido, Producto, Reserva, Rol, Servicio, SolicitudRecuperacion, Usuario


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
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
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_recurso_inexistente_responde_formato_404(client: TestClient):
    response = client.get("/api/productos/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Producto con id 999 no encontrado"
    assert "path" in response.json()


def test_validacion_http_conserva_detalle_por_campo(client: TestClient):
    response = client.get("/api/productos?precio_min=-1")
    assert response.status_code == 422
    assert response.json()["path"] == "/api/productos"
    assert response.json()["detail"]


def test_error_de_negocio_de_pedido_responde_409(client: TestClient, monkeypatch):
    from app.routers import pedidos

    class User:
        id_usuario = 1

    app.dependency_overrides[pedidos.get_current_user] = lambda: User()
    response = client.post("/api/pedidos", json={"productos": [], "servicios": []})
    assert response.status_code == 409
    assert "pedido" in response.json()["detail"].lower()