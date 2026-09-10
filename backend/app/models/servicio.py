from sqlalchemy import Enum, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Servicio(Base):
    __tablename__ = "servicios"

    id_servicio: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(nullable=False)
    descripcion: Mapped[str | None]
    precio: Mapped[float] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(Enum("activo", "inactivo"), default="activo")

    __table_args__ = (Index("ix_servicios_estado_precio", "estado", "precio"),)
