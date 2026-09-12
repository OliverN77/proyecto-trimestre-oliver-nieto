from app.core.db_migrations import is_reserva_estado_compatible


def test_reserva_estado_accepts_completada():
    assert is_reserva_estado_compatible("completada") is True
    assert is_reserva_estado_compatible("cancelada") is True
    assert is_reserva_estado_compatible("pendiente") is True
