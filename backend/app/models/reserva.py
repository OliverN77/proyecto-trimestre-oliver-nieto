from datetime import date, time, datetime

from sqlalchemy import Date, ForeignKey, Integer, String, Time, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Reserva(Base):
    __tablename__ = "reservas"

    id_reserva: Mapped[int] = mapped_column(primary_key=True)
    id_cliente: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"), nullable=False)
    id_mesa: Mapped[int] = mapped_column(ForeignKey("mesas.id_mesa"), nullable=False)
    fecha_reserva: Mapped[date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[time] = mapped_column(Time, nullable=False)
    hora_fin: Mapped[time] = mapped_column(Time, nullable=False)
    cantidad_personas: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(32), nullable=False, default="pendiente")
    observaciones: Mapped[str | None] = mapped_column(Text)
    creada_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    productos = relationship("ReservaProducto", backref="reserva", cascade="all, delete-orphan")
    servicios = relationship("ReservaServicio", backref="reserva", cascade="all, delete-orphan")

