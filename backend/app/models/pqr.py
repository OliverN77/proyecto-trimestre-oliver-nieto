from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PQR(Base):
    __tablename__ = "pqr"

    id_pqr: Mapped[int] = mapped_column(primary_key=True)
    id_cliente: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # peticion, queja, reclamo
    asunto: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")
    respuesta: Mapped[str | None] = mapped_column(Text)
    creada_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    actualizada_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
