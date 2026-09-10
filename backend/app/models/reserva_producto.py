from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReservaProducto(Base):
    __tablename__ = "reserva_productos"

    id_reserva: Mapped[int] = mapped_column(ForeignKey("reservas.id_reserva", ondelete="CASCADE"), primary_key=True)
    id_producto: Mapped[int] = mapped_column(ForeignKey("productos.id_producto", ondelete="CASCADE"), primary_key=True)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    producto = relationship("Producto")
