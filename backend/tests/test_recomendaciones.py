import pytest
from pydantic import ValidationError

from app.schemas.recomendacion import RecomendacionRequest
from app.services.provider import ProviderResponse
from app.services.recommender import LocalRecommender


def test_recomendador_local_carga_artefacto_y_prioriza_coincidencias():
    recommender = LocalRecommender("modelos/recomendador.json")
    result = recommender.predict("limón", [{"tipo": "producto", "id": 1, "nombre": "Risotto al limón", "descripcion": "Cítrico", "precio": 28}], 1)
    assert result[0]["id"] == 1


def test_proveedor_rechaza_respuesta_invalida():
    with pytest.raises(ValidationError):
        ProviderResponse.model_validate({"recomendaciones": [{"tipo": "producto", "id": 0}]})


def test_solicitud_limita_preferencia_y_cantidad():
    with pytest.raises(ValidationError):
        RecomendacionRequest(preferencia="x", limite=20)