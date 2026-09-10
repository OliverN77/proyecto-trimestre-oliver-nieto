from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud import producto as crud
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import require_role
from app.dependencies.pagination import PaginacionParams
from app.dependencies.resources import ResourceById
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate

router = APIRouter(prefix="/api/productos", tags=["Productos"], responses=API_RESPONSES)


@router.get("", response_model=list[ProductoOut], summary="Lista productos")
def listar(
    paginacion: PaginacionParams = Depends(),
    nombre: str | None = Query(default=None, min_length=1),
    precio_min: float | None = Query(default=None, ge=0),
    precio_max: float | None = Query(default=None, ge=0),
    estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(crud.Producto)
    if nombre:
        stmt = stmt.where(crud.Producto.nombre.ilike(f"%{nombre}%"))
    if precio_min is not None:
        stmt = stmt.where(crud.Producto.precio >= precio_min)
    if precio_max is not None:
        stmt = stmt.where(crud.Producto.precio <= precio_max)
    if estado:
        stmt = stmt.where(crud.Producto.estado == estado)
    return db.scalars(stmt.offset(paginacion.skip).limit(paginacion.limit)).all()


@router.get("/{id_producto}", response_model=ProductoOut, summary="Consulta un producto")
def obtener(producto: Producto = Depends(ResourceById(Producto, "Producto", "id_producto"))):
    return producto


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("Administrador"))])
def crear(datos: ProductoCreate, db: Session = Depends(get_db)):
    return crud.crear(db, datos)


@router.put("/{id_producto}", response_model=ProductoOut, dependencies=[Depends(require_role("Administrador"))])
def actualizar(datos: ProductoUpdate, db: Session = Depends(get_db), producto: Producto = Depends(ResourceById(Producto, "Producto", "id_producto"))):
    return crud.actualizar(db, producto.id_producto, datos)


@router.delete("/{id_producto}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("Administrador"))])
def eliminar(producto: Producto = Depends(ResourceById(Producto, "Producto", "id_producto")), db: Session = Depends(get_db)):
    crud.eliminar(db, producto.id_producto)
