import logging

from sqlalchemy import create_engine, text

from app.core.config import settings

logger = logging.getLogger("taberna_del_faro.db_migrations")


def is_reserva_estado_compatible(value: str) -> bool:
    return len(value) <= 32


def ensure_reserva_estado_column() -> None:
    """Fixes legacy MySQL schema where the reservas.estado column is too short for 'completada'."""
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE
                FROM information_schema.columns
                WHERE TABLE_SCHEMA = :db_name
                  AND TABLE_NAME = 'reservas'
                  AND COLUMN_NAME = 'estado'
                LIMIT 1
                """
            ),
            {"db_name": settings.db_name},
        ).mappings().first()

        if row is None:
            return

        data_type = (row.get("DATA_TYPE") or "").lower()
        max_length = row.get("CHARACTER_MAXIMUM_LENGTH")

        if data_type == "enum" or (max_length is not None and max_length < 10):
            conn.execute(
                text(
                    "ALTER TABLE reservas MODIFY COLUMN estado VARCHAR(32) NOT NULL DEFAULT 'pendiente'"
                )
            )
            conn.commit()
            logger.warning(
                "Se corrigió la columna reservas.estado para soportar estados largos como 'completada'."
            )
