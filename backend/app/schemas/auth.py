from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.usuario import UsuarioOut


class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str = Field(min_length=1, max_length=64)


class RecuperacionRequest(BaseModel):
    numero_documento: str = Field(min_length=5, max_length=20, pattern=r"^[A-Za-z0-9]+$")


class CambiarContrasenaRequest(RecuperacionRequest):
    nueva_contrasena: str = Field(min_length=8, max_length=64)


class ResolverSolicitudRequest(BaseModel):
    estado: str = Field(pattern=r"^(aprobada|rechazada)$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
