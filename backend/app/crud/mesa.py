from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.database import commit_or_conflict
from app.models.mesa import Mesa
from app.models.reserva import Reserva
from app.schemas.mesa import MesaCreate, MesaUpdate

RESTAURANT_TIMEZONE = timezone(timedelta(hours=-5))

def sincronizar_estados_mesas(db: Session):
    ahora = datetime.now(RESTAURANT_TIMEZONE)
    fecha_hoy = ahora.date()
    hora_actual = ahora.time()
    
    # Obtener todas las mesas
    mesas = db.scalars(select(Mesa)).all()
    
    # Obtener IDs de mesas que tienen reservas aprobadas activas en este momento
    reservas_activas = db.scalars(
        select(Reserva.id_mesa)
        .where(
            Reserva.fecha_reserva == fecha_hoy,
            Reserva.estado == "aprobada",
            Reserva.hora_inicio <= hora_actual,
            Reserva.hora_fin >= hora_actual
        )
    ).all()
    
    mesas_ocupadas = set(reservas_activas)
    
    hubo_cambios = False
    for mesa in mesas:
        if mesa.estado == "mantenimiento":
            continue
            
        nuevo_estado = "ocupada" if mesa.id_mesa in mesas_ocupadas else "disponible"
        if mesa.estado != nuevo_estado:
            mesa.estado = nuevo_estado
            hubo_cambios = True
            
    if hubo_cambios:
        commit_or_conflict(db)

def listar(db: Session) -> list[Mesa]:
    sincronizar_estados_mesas(db)
    return db.scalars(select(Mesa).order_by(Mesa.numero_mesa)).all()


def obtener(db: Session, id_mesa: int) -> Mesa:
    sincronizar_estados_mesas(db)
    mesa = db.get(Mesa, id_mesa)
    if mesa is None:
        raise NotFoundError("Mesa", id_mesa)
    return mesa


def crear(db: Session, datos: MesaCreate) -> Mesa:
    existente = db.scalar(select(Mesa).where(Mesa.numero_mesa == datos.numero_mesa))
    if existente:
        raise ConflictError(f"Ya existe una mesa con el número {datos.numero_mesa}")
    mesa = Mesa(**datos.model_dump())
    db.add(mesa)
    commit_or_conflict(db)
    db.refresh(mesa)
    return mesa


def actualizar(db: Session, id_mesa: int, datos: MesaUpdate) -> Mesa:
    mesa = obtener(db, id_mesa)
    dump = datos.model_dump(exclude_unset=True)
    if "numero_mesa" in dump and dump["numero_mesa"] != mesa.numero_mesa:
        existente = db.scalar(
            select(Mesa).where(Mesa.numero_mesa == dump["numero_mesa"], Mesa.id_mesa != id_mesa)
        )
        if existente:
            raise ConflictError(f"Ya existe una mesa con el número {dump['numero_mesa']}")
    for campo, valor in dump.items():
        setattr(mesa, campo, valor)
    commit_or_conflict(db)
    db.refresh(mesa)
    return mesa


def eliminar(db: Session, id_mesa: int) -> None:
    mesa = obtener(db, id_mesa)
    reservas_asociadas = db.scalar(select(Reserva).where(Reserva.id_mesa == id_mesa))
    if reservas_asociadas:
        raise ConflictError("No se puede eliminar la mesa porque tiene reservaciones asociadas")
    db.delete(mesa)
    commit_or_conflict(db)
