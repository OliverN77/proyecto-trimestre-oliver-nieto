from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.database import commit_or_conflict
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate


def listar(db: Session, skip: int = 0, limit: int = 20):
    return db.scalars(select(Producto).offset(skip).limit(limit)).all()


def obtener(db: Session, id_producto: int) -> Producto:
    producto = db.get(Producto, id_producto)
    if producto is None:
        raise NotFoundError("Producto", id_producto)
    return producto


def crear(db: Session, datos: ProductoCreate) -> Producto:
    producto = Producto(**datos.model_dump())
    db.add(producto)
    commit_or_conflict(db)
    db.refresh(producto)
    return producto


def actualizar(db: Session, id_producto: int, datos: ProductoUpdate) -> Producto:
    producto = obtener(db, id_producto)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    commit_or_conflict(db)
    db.refresh(producto)
    return producto


def eliminar(db: Session, id_producto: int) -> None:
    db.delete(obtener(db, id_producto))
    commit_or_conflict(db)
