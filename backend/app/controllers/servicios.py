from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud import servicio as crud
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import require_role
from app.dependencies.pagination import PaginacionParams
from app.dependencies.resources import ResourceById
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate, ServicioOut, ServicioUpdate

router = APIRouter(prefix="/api/servicios", tags=["Servicios"], responses=API_RESPONSES)


@router.get("", response_model=list[ServicioOut], summary="Lista servicios")
def listar(
    paginacion: PaginacionParams = Depends(),
    nombre: str | None = Query(default=None, min_length=1),
    precio_min: float | None = Query(default=None, ge=0),
    precio_max: float | None = Query(default=None, ge=0),
    estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(crud.Servicio)
    if nombre:
        stmt = stmt.where(crud.Servicio.nombre.ilike(f"%{nombre}%"))
    if precio_min is not None:
        stmt = stmt.where(crud.Servicio.precio >= precio_min)
    if precio_max is not None:
        stmt = stmt.where(crud.Servicio.precio <= precio_max)
    if estado:
        stmt = stmt.where(crud.Servicio.estado == estado)
    return db.scalars(stmt.offset(paginacion.skip).limit(paginacion.limit)).all()


@router.get("/{id_servicio}", response_model=ServicioOut, summary="Consulta un servicio")
def obtener(servicio: Servicio = Depends(ResourceById(Servicio, "Servicio", "id_servicio"))):
    return servicio


@router.post("", response_model=ServicioOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("Administrador"))])
def crear(datos: ServicioCreate, db: Session = Depends(get_db)):
    return crud.crear(db, datos)


@router.put("/{id_servicio}", response_model=ServicioOut, dependencies=[Depends(require_role("Administrador"))])
def actualizar(datos: ServicioUpdate, db: Session = Depends(get_db), servicio: Servicio = Depends(ResourceById(Servicio, "Servicio", "id_servicio"))):
    return crud.actualizar(db, servicio.id_servicio, datos)


@router.delete("/{id_servicio}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("Administrador"))])
def eliminar(servicio: Servicio = Depends(ResourceById(Servicio, "Servicio", "id_servicio")), db: Session = Depends(get_db)):
    crud.eliminar(db, servicio.id_servicio)
