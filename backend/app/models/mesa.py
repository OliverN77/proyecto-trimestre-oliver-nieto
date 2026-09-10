from sqlalchemy import Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Mesa(Base):
    __tablename__ = "mesas"

    id_mesa: Mapped[int] = mapped_column(primary_key=True)
    numero_mesa: Mapped[int] = mapped_column(nullable=False)
    capacidad: Mapped[int] = mapped_column(nullable=False)
    ubicacion: Mapped[str] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(Enum("disponible", "ocupada", "mantenimiento"), nullable=False)
