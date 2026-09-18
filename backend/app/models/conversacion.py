from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id_conversacion: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id_usuario"), nullable=True)
    creada_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    mensajes = relationship("Mensaje", backref="conversacion", cascade="all, delete-orphan", order_by="Mensaje.creado_en")
