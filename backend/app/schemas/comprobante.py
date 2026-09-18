from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ComprobanteCreate(BaseModel):
    id_reserva: int


class ComprobanteOut(BaseModel):
    id_comprobante: int
    id_reserva: int
    numero_comprobante: str
    fecha_emision: datetime
    datos_json: str
    estado: str

    model_config = {"from_attributes": True}


class ComprobanteSearch(BaseModel):
    numero_comprobante: Optional[str] = None
    cliente: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
