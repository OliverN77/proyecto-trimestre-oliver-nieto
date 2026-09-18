from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Mensaje(Base):
    __tablename__ = "mensajes"

    id_mensaje: Mapped[int] = mapped_column(primary_key=True)
    id_conversacion: Mapped[int] = mapped_column(ForeignKey("conversaciones.id_conversacion", ondelete="CASCADE"), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
