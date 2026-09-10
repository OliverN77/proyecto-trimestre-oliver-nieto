from datetime import datetime

from sqlalchemy import Enum, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id_producto: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(nullable=False)
    descripcion: Mapped[str | None]
    precio: Mapped[float] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(Enum("disponible", "agotado"), default="disponible")
    creado_en: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    __table_args__ = (Index("ix_productos_estado_precio", "estado", "precio"),)
