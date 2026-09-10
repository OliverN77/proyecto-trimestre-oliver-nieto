from datetime import datetime

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id_pedido: Mapped[int] = mapped_column(primary_key=True)
    id_cliente: Mapped[int] = mapped_column(ForeignKey("usuarios.id_usuario"), nullable=False)
    id_empleado: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id_usuario"))
    estado: Mapped[str] = mapped_column(Enum("pendiente", "preparando", "completado", "cancelado"), nullable=False)
    total: Mapped[float] = mapped_column(nullable=False)
    creado_en: Mapped[datetime]
    actualizado_en: Mapped[datetime | None]


class PedidoDetalle(Base):
    __tablename__ = "pedido_detalles"

    id_detalle: Mapped[int] = mapped_column(primary_key=True)
    id_pedido: Mapped[int] = mapped_column(ForeignKey("pedidos.id_pedido"), nullable=False)
    id_producto: Mapped[int | None] = mapped_column(ForeignKey("productos.id_producto"))
    id_servicio: Mapped[int | None] = mapped_column(ForeignKey("servicios.id_servicio"))
    cantidad: Mapped[int] = mapped_column(nullable=False)
    precio_unitario: Mapped[float] = mapped_column(nullable=False)
