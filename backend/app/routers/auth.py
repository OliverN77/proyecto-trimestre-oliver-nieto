from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.core.responses import API_RESPONSES
from app.crud.usuario import autenticar_usuario, crear_usuario
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioOut

router = APIRouter(tags=["Autenticación"], responses=API_RESPONSES)
ID_ROL_CLIENTE = 3


@router.post("/api/auth/login", response_model=TokenResponse, summary="Inicia sesión y devuelve un JWT")
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = autenticar_usuario(db, str(datos.correo), datos.contrasena)
    return TokenResponse(
        access_token=create_access_token(str(usuario.correo), usuario.rol.nombre_rol),
        usuario=usuario,
    )


@router.post(
    "/api/usuarios/registro",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registra un nuevo cliente",
)
def registrar(datos: UsuarioCreate, db: Session = Depends(get_db)):
    return crear_usuario(db, datos, id_rol_cliente=ID_ROL_CLIENTE)


@router.get("/api/auth/perfil", response_model=UsuarioOut, summary="Consulta el perfil autenticado")
def perfil(usuario=Depends(get_current_user)):
    return usuario
