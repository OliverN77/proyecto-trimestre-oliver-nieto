from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class MesaBase(BaseModel):
    numero_mesa: int = Field(gt=0)
    capacidad: int = Field(gt=0)
    ubicacion: Literal["interior", "terraza", "vip"] = "interior"

    @field_validator("ubicacion", mode="before")
    @classmethod
    def normalizar_ubicacion(cls, v):
        if not v:
            return "interior"
        v_str = str(v).lower().strip()
        if v_str in ("interior", "terraza", "vip"):
            return v_str
        return "interior"


class MesaCreate(MesaBase):
    estado: Literal["disponible", "ocupada", "mantenimiento"] = "disponible"


class MesaUpdate(BaseModel):
    numero_mesa: int | None = Field(default=None, gt=0)
    capacidad: int | None = Field(default=None, gt=0)
    ubicacion: Literal["interior", "terraza", "vip"] | None = None
    estado: Literal["disponible", "ocupada", "mantenimiento"] | None = None

    @field_validator("ubicacion", mode="before")
    @classmethod
    def normalizar_ubicacion_update(cls, v):
        if v is None:
            return None
        v_str = str(v).lower().strip()
        if v_str in ("interior", "terraza", "vip"):
            return v_str
        return "interior"


class MesaOut(MesaBase):
    id_mesa: int
    estado: str
    creado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}
