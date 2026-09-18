from typing import Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    mensaje: str = Field(min_length=1, max_length=1000)
    id_conversacion: Optional[int] = None


class ChatResponse(BaseModel):
    respuesta: str
    id_conversacion: int
