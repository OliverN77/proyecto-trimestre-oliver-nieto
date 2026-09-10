from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.core.exceptions import ConflictError
from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.pedido import Pedido, PedidoDetalle
from app.models.producto import Producto
from app.models.servicio import Servicio
from app.models.usuario import Usuario
from app.schemas.pedido import PedidoCreate, PedidoEstadoUpdate, PedidoOut

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


def pedido_dict(pedido, empleado=None, cliente=None):
    return {"id_pedido": pedido.id_pedido, "estado": pedido.estado, "total": pedido.total, "empleado_nombre": getattr(empleado, "nombre", None), "empleado_apellido": getattr(empleado, "apellido", None), "cliente_nombre": getattr(cliente, "nombre", None), "cliente_apellido": getattr(cliente, "apellido", None)}


@router.get("/mios", response_model=list[PedidoOut])
def mis_pedidos(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    empleado = aliased(Usuario)
    rows = db.execute(select(Pedido, empleado).outerjoin(empleado, empleado.id_usuario == Pedido.id_empleado).where(Pedido.id_cliente == usuario.id_usuario).order_by(Pedido.creado_en.desc())).all()
    return [pedido_dict(pedido, empleado_usuario) for pedido, empleado_usuario in rows]


@router.get("/asignados", response_model=list[PedidoOut], dependencies=[Depends(require_role("Empleado"))])
def pedidos_asignados(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    return [pedido_dict(pedido) for pedido in db.scalars(select(Pedido).where(Pedido.id_empleado == usuario.id_usuario).order_by(Pedido.creado_en.desc())).all()]


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoCreate, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    detalles = []
    for item in datos.productos:
        if item.id_producto is None:
            raise ConflictError("Cada producto debe incluir id_producto")
        producto = db.get(Producto, item.id_producto)
        if producto is None or producto.estado != "disponible":
            raise ConflictError("Producto no disponible")
        detalles.append((item.id_producto, None, item.cantidad, producto.precio))
    for item in datos.servicios:
        if item.id_servicio is None:
            raise ConflictError("Cada servicio debe incluir id_servicio")
        servicio = db.get(Servicio, item.id_servicio)
        if servicio is None or servicio.estado != "activo":
            raise ConflictError("Servicio no disponible")
        detalles.append((None, item.id_servicio, item.cantidad, servicio.precio))
    if not detalles:
        raise ConflictError("El pedido debe incluir al menos un producto o servicio")
    total = sum(cantidad * precio for _, _, cantidad, precio in detalles)
    pedido = Pedido(id_cliente=usuario.id_usuario, estado="pendiente", total=total)
    db.add(pedido)
    db.flush()
    db.add_all([PedidoDetalle(id_pedido=pedido.id_pedido, id_producto=producto_id, id_servicio=servicio_id, cantidad=cantidad, precio_unitario=precio) for producto_id, servicio_id, cantidad, precio in detalles])
    db.commit()
    return {"id_pedido": pedido.id_pedido, "estado": pedido.estado, "total": pedido.total, "mensaje": "Pedido creado correctamente"}


@router.patch("/{id_pedido}/estado", response_model=PedidoOut, dependencies=[Depends(require_role("Empleado"))], summary="Actualiza el estado de un pedido")
def cambiar_estado(id_pedido: int, datos: PedidoEstadoUpdate, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    pedido = db.get(Pedido, id_pedido)
    if pedido is None or pedido.id_empleado != usuario.id_usuario:
        raise ConflictError("Pedido no asignado a este empleado")
    pedido.estado = datos.estado
    db.commit()
    db.refresh(pedido)
    return pedido_dict(pedido)
