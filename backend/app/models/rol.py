from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id_rol: Mapped[int] = mapped_column(primary_key=True)
    nombre_rol: Mapped[str] = mapped_column(unique=True, nullable=False)
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol")
