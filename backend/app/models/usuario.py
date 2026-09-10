from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(nullable=False)
    apellido: Mapped[str] = mapped_column(nullable=False)
    tipo_documento: Mapped[str] = mapped_column(nullable=False)
    numero_documento: Mapped[str] = mapped_column(unique=True, nullable=False)
    direccion: Mapped[str | None]
    telefono: Mapped[str] = mapped_column(nullable=False)
    correo: Mapped[str] = mapped_column(unique=True, nullable=False)
    contrasena_hash: Mapped[str] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(Enum("activo", "inactivo"), default="activo")
    id_rol: Mapped[int] = mapped_column(ForeignKey("roles.id_rol"), nullable=False)
    ultima_contrasena_cambiada_en: Mapped[datetime | None]
    creado_en: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    rol: Mapped["Rol"] = relationship(back_populates="usuarios")

    __table_args__ = (Index("ix_usuarios_estado", "estado"),)
