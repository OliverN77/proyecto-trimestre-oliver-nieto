from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        correo = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except (JWTError, TypeError):
        raise credentials_exception

    usuario = db.scalar(select(Usuario).where(Usuario.correo == correo))
    if usuario is None or usuario.estado != "activo":
        raise credentials_exception
    return usuario


def require_role(*roles_permitidos: str):
    def verificador(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol.nombre_rol not in roles_permitidos:
            raise HTTPException(status_code=403, detail="No tienes permisos para esta operación")
        return usuario

    return verificador
