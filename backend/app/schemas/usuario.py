import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class UsuarioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    apellido: str = Field(min_length=2, max_length=50)
    tipo_documento: str = Field(min_length=2, max_length=20)
    numero_documento: str = Field(min_length=5, max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    telefono: str = Field(min_length=7, max_length=15)
    correo: EmailStr


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(min_length=8, max_length=64)
    confirmar_contrasena: str

    @field_validator("numero_documento")
    @classmethod
    def solo_numeros_y_letras(cls, value: str) -> str:
        if not re.match(r"^[A-Za-z0-9]+$", value):
            raise ValueError("El número de documento solo admite letras y números")
        return value

    @model_validator(mode="after")
    def contrasenas_coinciden(self):
        if self.contrasena != self.confirmar_contrasena:
            raise ValueError("Las contraseñas no coinciden")
        return self


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=50)
    apellido: str | None = Field(default=None, min_length=2, max_length=50)
    direccion: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, min_length=7, max_length=15)


class UsuarioAdminCreate(UsuarioBase):
    contrasena: str = Field(min_length=8, max_length=64)
    rol: str = "Cliente"


class UsuarioAdminUpdate(UsuarioUpdate):
    correo: EmailStr | None = None
    tipo_documento: str | None = Field(default=None, min_length=2, max_length=20)
    numero_documento: str | None = Field(default=None, min_length=5, max_length=20)
    contrasena: str | None = Field(default=None, min_length=8, max_length=64)
    rol: str | None = None


class EstadoUsuario(BaseModel):
    estado: str = Field(pattern="^(activo|inactivo)$")


class RolUsuario(BaseModel):
    rol: str = Field(pattern="^(Administrador|Empleado|Cliente)$")


class UsuarioOut(UsuarioBase):
    id_usuario: int
    estado: str
    id_rol: int
    creado_en: datetime

    model_config = {"from_attributes": True}
