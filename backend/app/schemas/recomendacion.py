from pydantic import BaseModel, Field


class RecomendacionRequest(BaseModel):
    preferencia: str = Field(min_length=2, max_length=100)
    limite: int = Field(default=3, ge=1, le=10)


class RecomendacionItem(BaseModel):
    tipo: str
    id: int
    nombre: str
    precio: float
    razon: str


class RecomendacionResponse(BaseModel):
    recomendaciones: list[RecomendacionItem]
    fuente: str
    proveedor_disponible: bool