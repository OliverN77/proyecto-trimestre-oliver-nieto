from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.database import commit_or_conflict
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
    db.delete(obtener(db, id_servicio))
    commit_or_conflict(db)
