from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field, model_validator


from app.schemas.producto import ProductoOut


class ReservaProductoCreate(BaseModel):
    id_producto: int
    cantidad: int = Field(ge=1)


class ReservaProductoOut(BaseModel):
    id_producto: int
    cantidad: int
    producto: ProductoOut

    model_config = {"from_attributes": True}


class ReservaCreate(BaseModel):
    fecha_reserva: date
    hora_inicio: time
    hora_fin: time
    cantidad_personas: int = Field(ge=1)
    id_mesa: int
    observaciones: str | None = Field(default=None, max_length=500)
    productos: list[ReservaProductoCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def horario_valido(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValueError("La hora de finalización debe ser posterior a la de inicio")
        return self


class ReservaOut(ReservaCreate):
    id_reserva: int
    estado: str
    numero_mesa: int
    productos: list[ReservaProductoOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ReservaConCliente(ReservaOut):
    cliente_nombre: str
    cliente_apellido: str


class ReservaEstadoUpdate(BaseModel):
    estado: Literal["confirmada", "cancelada", "completada"]
