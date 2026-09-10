from datetime import datetime

from pydantic import BaseModel, Field


class ProductoBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: float = Field(gt=0)


class ProductoCreate(ProductoBase):
    estado: str = "disponible"


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: float | None = Field(default=None, gt=0)
    estado: str | None = None


class ProductoOut(ProductoBase):
    id_producto: int
    estado: str
    creado_en: datetime
    model_config = {"from_attributes": True}
