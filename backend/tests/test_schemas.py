import pytest
from pydantic import ValidationError

from app.schemas.pedido import PedidoItem
from app.schemas.reserva import ReservaCreate


def test_pedido_item_exige_un_solo_recurso():
    with pytest.raises(ValidationError):
        PedidoItem(id_producto=1, id_servicio=2, cantidad=1)


def test_reserva_rechaza_horario_invertido():
    with pytest.raises(ValidationError):
        ReservaCreate(
            fecha_reserva="2026-09-03",
            hora_inicio="20:00",
            hora_fin="19:00",
            cantidad_personas=2,
            id_mesa=1,
        )