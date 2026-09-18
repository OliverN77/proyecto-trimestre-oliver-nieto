from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationError, NotFoundError
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.pqr import PQR
from app.models.usuario import Usuario
from app.schemas.pqr import PQRCreate, PQREstadoUpdate, PQROut, PQRResponder

router = APIRouter(prefix="/api/pqr", tags=["PQR"], responses=API_RESPONSES)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Crea una PQR")
def crear_pqr(
    datos: PQRCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pqr = PQR(
        id_cliente=usuario.id_usuario,
        tipo=datos.tipo,
        asunto=datos.asunto,
        descripcion=datos.descripcion,
        estado="pendiente",
    )
    db.add(pqr)
    db.commit()
    db.refresh(pqr)
    return _pqr_to_dict(pqr, usuario)


@router.get("", summary="Lista PQR")
def listar_pqr(
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(PQR, Usuario).join(Usuario, Usuario.id_usuario == PQR.id_cliente)

    # Clients only see their own
    if usuario.id_rol == 3:
        query = query.where(PQR.id_cliente == usuario.id_usuario)

    if estado:
        query = query.where(PQR.estado == estado)
    if tipo:
        query = query.where(PQR.tipo == tipo)

    query = query.order_by(PQR.creada_en.desc())
    rows = db.execute(query).all()
    return [_pqr_to_dict(pqr, cli) for pqr, cli in rows]


@router.get("/{id_pqr}", summary="Obtiene una PQR")
def obtener_pqr(
    id_pqr: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pqr = db.get(PQR, id_pqr)
    if not pqr:
        raise NotFoundError("PQR", id_pqr)
    if usuario.id_rol == 3 and pqr.id_cliente != usuario.id_usuario:
        raise AuthorizationError()
    cliente = db.get(Usuario, pqr.id_cliente)
    return _pqr_to_dict(pqr, cliente)


@router.patch("/{id_pqr}/estado", summary="Actualiza el estado de una PQR (admin/empleado)")
def actualizar_estado_pqr(
    id_pqr: int,
    datos: PQREstadoUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    pqr = db.get(PQR, id_pqr)
    if not pqr:
        raise NotFoundError("PQR", id_pqr)

    pqr.estado = datos.estado
    pqr.actualizada_en = datetime.utcnow()
    db.commit()
    db.refresh(pqr)
    cliente = db.get(Usuario, pqr.id_cliente)
    return _pqr_to_dict(pqr, cliente)


@router.patch("/{id_pqr}/responder", summary="Responde a una PQR (admin/empleado)")
def responder_pqr(
    id_pqr: int,
    datos: PQRResponder,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    pqr = db.get(PQR, id_pqr)
    if not pqr:
        raise NotFoundError("PQR", id_pqr)

    pqr.respuesta = datos.respuesta
    pqr.estado = "respondida"
    pqr.actualizada_en = datetime.utcnow()
    db.commit()
    db.refresh(pqr)
    cliente = db.get(Usuario, pqr.id_cliente)
    return _pqr_to_dict(pqr, cliente)


def _pqr_to_dict(pqr: PQR, cliente: Usuario):
    return {
        "id_pqr": pqr.id_pqr,
        "id_cliente": pqr.id_cliente,
        "tipo": pqr.tipo,
        "asunto": pqr.asunto,
        "descripcion": pqr.descripcion,
        "estado": pqr.estado,
        "respuesta": pqr.respuesta,
        "creada_en": pqr.creada_en,
        "actualizada_en": pqr.actualizada_en,
        "cliente_nombre": cliente.nombre if cliente else None,
        "cliente_apellido": cliente.apellido if cliente else None,
    }
