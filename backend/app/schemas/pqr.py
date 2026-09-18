from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PQRCreate(BaseModel):
    tipo: Literal["peticion", "queja", "reclamo"]
    asunto: str = Field(min_length=3, max_length=255)
    descripcion: str = Field(min_length=10, max_length=2000)


class PQROut(BaseModel):
    id_pqr: int
    id_cliente: int
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    creada_en: datetime
    actualizada_en: datetime
    cliente_nombre: Optional[str] = None
    cliente_apellido: Optional[str] = None

    model_config = {"from_attributes": True}


class PQREstadoUpdate(BaseModel):
    estado: Literal["pendiente", "en_proceso", "respondida", "cerrada"]


class PQRResponder(BaseModel):
    respuesta: str = Field(min_length=5, max_length=2000)
