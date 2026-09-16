from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.crud import mesa as crud
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.usuario import Usuario
from app.schemas.mesa import MesaCreate, MesaOut, MesaUpdate

router = APIRouter(prefix="/api/mesas", tags=["Mesas"], responses=API_RESPONSES)


@router.get("", response_model=list[MesaOut], summary="Lista todas las mesas")
def listar_mesas(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.listar(db)


@router.get("/{id_mesa}", response_model=MesaOut, summary="Obtiene los detalles de una mesa")
def obtener_mesa(
    id_mesa: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.obtener(db, id_mesa)


@router.post(
    "",
    response_model=MesaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una nueva mesa (Admin)",
    dependencies=[Depends(require_role("Administrador"))],
)
def crear_mesa(
    datos: MesaCreate,
    db: Session = Depends(get_db),
):
    return crud.crear(db, datos)


@router.put(
    "/{id_mesa}",
    response_model=MesaOut,
    summary="Actualiza una mesa (Admin)",
    dependencies=[Depends(require_role("Administrador"))],
)
def actualizar_mesa(
    id_mesa: int,
    datos: MesaUpdate,
    db: Session = Depends(get_db),
):
    return crud.actualizar(db, id_mesa, datos)


@router.delete(
    "/{id_mesa}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina una mesa (Admin)",
    dependencies=[Depends(require_role("Administrador"))],
)
def eliminar_mesa(
    id_mesa: int,
    db: Session = Depends(get_db),
):
    crud.eliminar(db, id_mesa)
