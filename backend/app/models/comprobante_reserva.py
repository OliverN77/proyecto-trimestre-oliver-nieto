from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ComprobanteReserva(Base):
    __tablename__ = "comprobantes_reserva"

    id_comprobante: Mapped[int] = mapped_column(primary_key=True)
    id_reserva: Mapped[int] = mapped_column(ForeignKey("reservas.id_reserva", ondelete="CASCADE"), nullable=False)
    numero_comprobante: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    fecha_emision: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    datos_json: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="emitido")
