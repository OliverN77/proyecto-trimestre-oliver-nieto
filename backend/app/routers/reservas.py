from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.mesa import Mesa
from app.models.reserva import Reserva
from app.models.reserva_producto import ReservaProducto
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.reserva import ReservaConCliente, ReservaCreate, ReservaEstadoUpdate, ReservaOut, ReservaProductoCreate

router = APIRouter(prefix="/api/reservas", tags=["Reservas"], responses=API_RESPONSES)


def reserva_dict(reserva, numero_mesa):
    productos = []
    if getattr(reserva, "productos", None) is not None:
        for rp in reserva.productos:
            productos.append({
                "id_producto": rp.id_producto,
                "cantidad": rp.cantidad,
                "producto": rp.producto
            })

    return {
        **{field: getattr(reserva, field) for field in ("id_reserva", "fecha_reserva", "hora_inicio", "hora_fin", "cantidad_personas", "id_mesa", "observaciones", "estado")},
        "numero_mesa": numero_mesa,
        "productos": productos,
    }


def reserva_dict_con_cliente(reserva, numero_mesa, cliente):
    return {
        **reserva_dict(reserva, numero_mesa),
        "cliente_nombre": cliente.nombre,
        "cliente_apellido": cliente.apellido,
    }


# ─── Customer endpoints ────────────────────────────────────────────────────────

@router.get("/mias", response_model=list[ReservaOut], summary="Lista mis reservas")
def mis_reservas(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Reserva, Mesa.numero_mesa)
        .join(Mesa, Mesa.id_mesa == Reserva.id_mesa)
        .where(Reserva.id_cliente == usuario.id_usuario)
        .order_by(Reserva.fecha_reserva.desc(), Reserva.hora_inicio)
    ).all()
    return [reserva_dict(reserva, numero_mesa) for reserva, numero_mesa in rows]


@router.get("/mesas-disponibles", summary="Consulta mesas disponibles")
def mesas_disponibles(
    fecha: date,
    hora_inicio: time,
    hora_fin: time,
    personas: int = Query(ge=1),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ocupadas = select(Reserva.id_mesa).where(
        and_(
            Reserva.fecha_reserva == fecha,
            Reserva.estado.in_(["pendiente", "confirmada"]),
            Reserva.hora_inicio < hora_fin,
            Reserva.hora_fin > hora_inicio,
        )
    )
    return db.scalars(
        select(Mesa).where(Mesa.capacidad >= personas, Mesa.estado == "disponible", Mesa.id_mesa.not_in(ocupadas))
    ).all()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ReservaOut, summary="Crea una reserva")
def crear_reserva(datos: ReservaCreate, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if datos.hora_fin <= datos.hora_inicio:
        raise ConflictError("La hora de finalización debe ser posterior a la de inicio")
    mesa = db.get(Mesa, datos.id_mesa)
    if mesa is None or mesa.estado != "disponible" or mesa.capacidad < datos.cantidad_personas:
        raise ConflictError("La mesa no está disponible")
    overlap = db.scalar(
        select(Reserva).where(
            Reserva.id_mesa == datos.id_mesa,
            Reserva.fecha_reserva == datos.fecha_reserva,
            Reserva.estado.in_(["pendiente", "confirmada"]),
            Reserva.hora_inicio < datos.hora_fin,
            Reserva.hora_fin > datos.hora_inicio,
        )
    )
    if overlap:
        raise ConflictError("La mesa ya está reservada en ese horario")
    datos_dump = datos.model_dump(exclude={"productos"})
    reserva = Reserva(**datos_dump, id_cliente=usuario.id_usuario, estado="pendiente")
    db.add(reserva)
    
    if datos.productos:
        for prod in datos.productos:
            rp = ReservaProducto(id_reserva=reserva.id_reserva, id_producto=prod.id_producto, cantidad=prod.cantidad)
            reserva.productos.append(rp)
            
    db.commit()
    db.refresh(reserva)
    return reserva_dict(reserva, mesa.numero_mesa)


@router.delete("/{id_reserva}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancela una reserva propia pendiente")
def cancelar_mi_reserva(id_reserva: int, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    reserva = db.get(Reserva, id_reserva)
    if reserva is None:
        raise NotFoundError("Reserva", id_reserva)
    if reserva.id_cliente != usuario.id_usuario:
        raise AuthorizationError("No puedes cancelar una reserva que no es tuya")
    if reserva.estado != "pendiente":
        raise ConflictError("Solo puedes cancelar reservas en estado pendiente")
    reserva.estado = "cancelada"
    db.commit()


# ─── Employee / Admin endpoints ────────────────────────────────────────────────

@router.get("/todas", response_model=list[ReservaConCliente], summary="Lista todas las reservas (empleado/admin)")
def todas_las_reservas(
    fecha: Optional[date] = None,
    estado: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):  # 1 = admin, 2 = empleado
        raise AuthorizationError()

    query = (
        select(Reserva, Mesa.numero_mesa, Usuario)
        .join(Mesa, Mesa.id_mesa == Reserva.id_mesa)
        .join(Usuario, Usuario.id_usuario == Reserva.id_cliente)
    )
    if fecha:
        query = query.where(Reserva.fecha_reserva == fecha)
    if estado:
        query = query.where(Reserva.estado == estado)
    query = query.order_by(Reserva.fecha_reserva, Reserva.hora_inicio)

    rows = db.execute(query).all()
    return [reserva_dict_con_cliente(reserva, numero_mesa, cliente) for reserva, numero_mesa, cliente in rows]


@router.patch("/{id_reserva}/estado", response_model=ReservaOut, summary="Actualiza el estado de una reserva (empleado/admin)")
def actualizar_estado_reserva(
    id_reserva: int,
    datos: ReservaEstadoUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):  # 1 = admin, 2 = empleado
        raise AuthorizationError()

    reserva = db.get(Reserva, id_reserva)
    if reserva is None:
        raise NotFoundError("Reserva", id_reserva)

    # Enforce sensible state transitions
    allowed_transitions = {
        "pendiente": {"confirmada", "cancelada"},
        "confirmada": {"completada", "cancelada"},
    }
    if reserva.estado not in allowed_transitions or datos.estado not in allowed_transitions[reserva.estado]:
        raise ConflictError(f"No se puede cambiar de '{reserva.estado}' a '{datos.estado}'")

    reserva.estado = datos.estado
    db.commit()
    db.refresh(reserva)
    mesa = db.get(Mesa, reserva.id_mesa)
    return reserva_dict(reserva, mesa.numero_mesa)


@router.put("/{id_reserva}/productos", response_model=ReservaOut, summary="Actualiza los platos de una reserva (empleado/admin)")
def actualizar_productos_reserva(
    id_reserva: int,
    productos: list[ReservaProductoCreate],
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):  # 1 = admin, 2 = empleado
        raise AuthorizationError()

    reserva = db.get(Reserva, id_reserva)
    if reserva is None:
        raise NotFoundError("Reserva", id_reserva)

    # Eliminar todos los productos actuales
    db.execute(
        ReservaProducto.__table__.delete().where(ReservaProducto.id_reserva == id_reserva)
    )

    # Agregar los nuevos
    for prod in productos:
        db.add(ReservaProducto(id_reserva=id_reserva, id_producto=prod.id_producto, cantidad=prod.cantidad))

    db.commit()
    db.refresh(reserva)
    mesa = db.get(Mesa, reserva.id_mesa)
    return reserva_dict(reserva, mesa.numero_mesa)
