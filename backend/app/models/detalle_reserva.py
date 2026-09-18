from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DetalleReserva(Base):
    __tablename__ = "detalle_reservas"

    id_detalle: Mapped[int] = mapped_column(primary_key=True)
    id_reserva: Mapped[int] = mapped_column(ForeignKey("reservas.id_reserva", ondelete="CASCADE"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # mesa, producto, servicio
    id_item: Mapped[int] = mapped_column(Integer, nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    precio_unitario: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
