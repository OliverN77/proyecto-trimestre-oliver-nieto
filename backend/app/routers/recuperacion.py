from datetime import datetime, timedelta, timezone

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.responses import API_RESPONSES
from app.core.security import hash_password
from app.database import get_db
from app.database import SessionLocal
from app.dependencies.auth import require_role
from app.dependencies.resources import ResourceById
from app.models.recuperacion import SolicitudRecuperacion
from app.models.usuario import Usuario
from app.schemas.auth import CambiarContrasenaRequest, RecuperacionRequest, ResolverSolicitudRequest

router = APIRouter(prefix="/api/recuperacion", tags=["Recuperación"], responses=API_RESPONSES)
COOLDOWN_MINUTOS = 30
logger = logging.getLogger("taberna.recuperacion")


def registrar_solicitud_background(id_solicitud: int):
    """Registra la tarea con su propia sesión, sin reutilizar la sesión HTTP."""
    try:
        with SessionLocal() as db:
            logger.info("Solicitud de recuperación creada: %s", id_solicitud)
            db.get(SolicitudRecuperacion, id_solicitud)
    except Exception:
        logger.exception("No se pudo registrar la solicitud %s", id_solicitud)


def solicitud_dict(solicitud, usuario):
    return {
        "id_solicitud": solicitud.id_solicitud,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "numero_documento": usuario.numero_documento,
        "estado": solicitud.estado,
        "solicitada_en": solicitud.solicitada_en,
        "aprobada_en": solicitud.aprobada_en,
    }


def buscar_usuario(db: Session, documento: str) -> Usuario:
    usuario = db.scalar(select(Usuario).where(Usuario.numero_documento == documento))
    if usuario is None:
        raise NotFoundError("Usuario", documento)
    return usuario


@router.get("/estado")
def estado(documento: str, db: Session = Depends(get_db)):
    usuario = buscar_usuario(db, documento)
    solicitud = db.scalar(select(SolicitudRecuperacion).where(SolicitudRecuperacion.id_usuario == usuario.id_usuario).order_by(SolicitudRecuperacion.solicitada_en.desc()))
    if solicitud is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    minutos = 0
    if solicitud.estado == "usada":
        limite = solicitud.solicitada_en.replace(tzinfo=timezone.utc) + timedelta(minutes=COOLDOWN_MINUTOS)
        minutos = max(0, int((limite - datetime.now(timezone.utc)).total_seconds() // 60))
    return {**solicitud_dict(solicitud, usuario), "minutos_restantes": minutos}


@router.get("/solicitud/{id_solicitud}")
def consultar_solicitud(id_solicitud: int, documento: str, db: Session = Depends(get_db)):
    usuario = buscar_usuario(db, documento)
    solicitud = db.get(SolicitudRecuperacion, id_solicitud)
    if solicitud is None or solicitud.id_usuario != usuario.id_usuario:
        raise NotFoundError("Solicitud de recuperación", id_solicitud)
    return {**solicitud_dict(solicitud, usuario), "minutos_restantes": 0}


@router.post("/solicitar", status_code=status.HTTP_201_CREATED, summary="Solicita recuperación de contraseña")
def solicitar(datos: RecuperacionRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    documento = datos.numero_documento
    usuario = buscar_usuario(db, documento)
    pendiente = db.scalar(select(SolicitudRecuperacion).where(SolicitudRecuperacion.id_usuario == usuario.id_usuario, SolicitudRecuperacion.estado == "pendiente"))
    if pendiente:
        raise ConflictError("Ya tienes una solicitud pendiente")
    solicitud = SolicitudRecuperacion(id_usuario=usuario.id_usuario, estado="pendiente")
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    background_tasks.add_task(registrar_solicitud_background, solicitud.id_solicitud)
    return {**solicitud_dict(solicitud, usuario), "mensaje": "Solicitud enviada correctamente"}


@router.post("/cambiar-contrasena", summary="Cambia la contraseña con una solicitud aprobada")
def cambiar_contrasena(datos: CambiarContrasenaRequest, db: Session = Depends(get_db)):
    usuario = buscar_usuario(db, datos.numero_documento)
    solicitud = db.scalar(select(SolicitudRecuperacion).where(SolicitudRecuperacion.id_usuario == usuario.id_usuario, SolicitudRecuperacion.estado == "aprobada").order_by(SolicitudRecuperacion.aprobada_en.desc()))
    if solicitud is None:
        raise ConflictError("No tienes una solicitud aprobada")
    usuario.contrasena_hash = hash_password(datos.nueva_contrasena)
    solicitud.estado = "usada"
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}


@router.get("/solicitudes", dependencies=[Depends(require_role("Administrador"))])
def listar_solicitudes(db: Session = Depends(get_db)):
    rows = db.execute(select(SolicitudRecuperacion, Usuario).join(Usuario, Usuario.id_usuario == SolicitudRecuperacion.id_usuario).order_by(SolicitudRecuperacion.solicitada_en.desc())).all()
    return [solicitud_dict(solicitud, usuario) for solicitud, usuario in rows]


@router.patch("/solicitudes/{id_solicitud}", summary="Resuelve una solicitud de recuperación", dependencies=[Depends(require_role("Administrador"))])
def resolver_solicitud(datos: ResolverSolicitudRequest, db: Session = Depends(get_db), solicitud: SolicitudRecuperacion = Depends(ResourceById(SolicitudRecuperacion, "Solicitud de recuperación", "id_solicitud"))):
    estado_nuevo = datos.estado
    if estado_nuevo not in {"aprobada", "rechazada"}:
        raise ConflictError("Estado de solicitud inválido")
    solicitud.estado = estado_nuevo
    solicitud.aprobada_en = datetime.utcnow() if estado_nuevo == "aprobada" else None
    db.commit()
    return {"mensaje": f"Solicitud {estado_nuevo} correctamente"}


@router.delete("/solicitudes/{id_solicitud}", dependencies=[Depends(require_role("Administrador"))])
def eliminar_solicitud(db: Session = Depends(get_db), solicitud: SolicitudRecuperacion = Depends(ResourceById(SolicitudRecuperacion, "Solicitud de recuperación", "id_solicitud"))):
    db.delete(solicitud)
    db.commit()
    return {"mensaje": "Solicitud eliminada correctamente"}