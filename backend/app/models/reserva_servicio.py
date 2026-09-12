from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReservaServicio(Base):
    __tablename__ = "reserva_servicios"

    id_reserva: Mapped[int] = mapped_column(ForeignKey("reservas.id_reserva", ondelete="CASCADE"), primary_key=True)
    id_servicio: Mapped[int] = mapped_column(ForeignKey("servicios.id_servicio", ondelete="CASCADE"), primary_key=True)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    servicio = relationship("Servicio")
