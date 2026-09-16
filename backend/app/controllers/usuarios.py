from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.crud import usuario as crud_usuario
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.dependencies.pagination import PaginacionParams
from app.dependencies.resources import ResourceById
from app.models.usuario import Usuario
from app.schemas.usuario import EstadoUsuario, RolUsuario, UsuarioAdminCreate, UsuarioAdminUpdate, UsuarioOut, UsuarioUpdate

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"],
    responses=API_RESPONSES,
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[UsuarioOut], summary="Lista usuarios paginados")
def listar(
    paginacion: PaginacionParams = Depends(),
    rol: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_role("Administrador")),
):
    return crud_usuario.listar_usuarios(db, paginacion.skip, paginacion.limit, rol)


@router.get("/{id_usuario}", response_model=UsuarioOut, summary="Consulta un usuario", dependencies=[Depends(require_role("Administrador"))])
def obtener(usuario: Usuario = Depends(ResourceById(Usuario, "Usuario", "id_usuario"))):
    return usuario


@router.put("/{id_usuario}", response_model=UsuarioOut, summary="Actualiza un usuario")
def actualizar(datos: UsuarioAdminUpdate, db: Session = Depends(get_db), usuario: Usuario = Depends(ResourceById(Usuario, "Usuario", "id_usuario")), _=Depends(require_role("Administrador"))):
    return crud_usuario.actualizar_usuario_admin(db, usuario.id_usuario, datos)


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED, summary="Crea un usuario", dependencies=[Depends(require_role("Administrador"))])
def crear(datos: UsuarioAdminCreate, db: Session = Depends(get_db)):
    return crud_usuario.crear_usuario_admin(db, datos)


@router.patch("/{id_usuario}/estado", response_model=UsuarioOut, summary="Cambia el estado")
def cambiar_estado(
    datos: EstadoUsuario,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(ResourceById(Usuario, "Usuario", "id_usuario")),
    _=Depends(require_role("Administrador")),
):
    return crud_usuario.cambiar_estado(db, usuario.id_usuario, datos.estado)


@router.patch("/{id_usuario}/rol", response_model=UsuarioOut, summary="Cambia el rol")
def cambiar_rol(datos: RolUsuario, db: Session = Depends(get_db), usuario: Usuario = Depends(ResourceById(Usuario, "Usuario", "id_usuario")), _=Depends(require_role("Administrador"))):
    return crud_usuario.cambiar_rol(db, usuario.id_usuario, datos.rol)


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT, summary="Elimina un usuario")
def eliminar(db: Session = Depends(get_db), usuario: Usuario = Depends(ResourceById(Usuario, "Usuario", "id_usuario")), _=Depends(require_role("Administrador"))):
    crud_usuario.eliminar_usuario(db, usuario.id_usuario)
