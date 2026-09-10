from pydantic import BaseModel, Field


class ServicioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: float = Field(gt=0)


class ServicioCreate(ServicioBase):
    estado: str = "activo"


class ServicioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: float | None = Field(default=None, gt=0)
    estado: str | None = None


class ServicioOut(ServicioBase):
    id_servicio: int
    estado: str
    model_config = {"from_attributes": True}
