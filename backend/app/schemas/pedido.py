from typing import Literal

from pydantic import BaseModel, Field, model_validator


class PedidoItem(BaseModel):
    id_producto: int | None = None
    id_servicio: int | None = None
    cantidad: int = Field(ge=1)

    @model_validator(mode="after")
    def exactly_one_resource(self):
        if (self.id_producto is None) == (self.id_servicio is None):
            raise ValueError("Cada detalle debe incluir exactamente un producto o un servicio")
        return self


class PedidoCreate(BaseModel):
    productos: list[PedidoItem] = Field(default_factory=list)
    servicios: list[PedidoItem] = Field(default_factory=list)

    model_config = {
        "json_schema_extra": {
            "example": {
                "productos": [{"id_producto": 1, "cantidad": 2}],
                "servicios": [{"id_servicio": 3, "cantidad": 1}],
            }
        }
    }


class PedidoEstadoUpdate(BaseModel):
    estado: Literal["pendiente", "preparando", "completado", "cancelado"]


class PedidoOut(BaseModel):
    id_pedido: int
    estado: str
    total: float
    empleado_nombre: str | None = None
    empleado_apellido: str | None = None
    model_config = {"from_attributes": True}
