from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.database import commit_or_conflict
from app.models.reserva_servicio import ReservaServicio
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate, ServicioUpdate


def listar(db: Session, skip: int = 0, limit: int = 20):
    return db.scalars(select(Servicio).offset(skip).limit(limit)).all()


def obtener(db: Session, id_servicio: int) -> Servicio:
    servicio = db.get(Servicio, id_servicio)
    if servicio is None:
        raise NotFoundError("Servicio", id_servicio)
    return servicio


def crear(db: Session, datos: ServicioCreate) -> Servicio:
    servicio = Servicio(**datos.model_dump())
    db.add(servicio)
    commit_or_conflict(db)
    db.refresh(servicio)
    return servicio


def actualizar(db: Session, id_servicio: int, datos: ServicioUpdate) -> Servicio:
    servicio = obtener(db, id_servicio)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(servicio, campo, valor)
    commit_or_conflict(db)
    db.refresh(servicio)
    return servicio


def eliminar(db: Session, id_servicio: int) -> None:
    # Validate if it's associated with a reservation
    asociaciones = db.scalar(select(ReservaServicio).where(ReservaServicio.id_servicio == id_servicio).limit(1))
    if asociaciones:
        raise ConflictError("No se puede eliminar el servicio porque está asociado a una o más reservaciones.")

    db.delete(obtener(db, id_servicio))
    commit_or_conflict(db)
