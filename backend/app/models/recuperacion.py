from datetime import datetime

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SolicitudRecuperacion(Base):
    __tablename__ = "solicitudes_recuperacion"

    id_solicitud: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"), nullable=False)
    estado: Mapped[str] = mapped_column(Enum("pendiente", "aprobada", "rechazada", "usada"), nullable=False)
    solicitada_en: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    aprobada_en: Mapped[datetime | None]