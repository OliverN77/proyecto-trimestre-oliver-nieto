import asyncio
import importlib
import logging

from pydantic import BaseModel, Field

httpx = importlib.import_module("httpx2")

logger = logging.getLogger("taberna.recomendaciones")


class ProviderItem(BaseModel):
    tipo: str
    id: int = Field(gt=0)


class ProviderResponse(BaseModel):
    recomendaciones: list[ProviderItem]


async def fetch_external_recommendations(url: str, payload: dict, timeout: float, retries: int) -> list[ProviderItem] | None:
    if not url:
        return None
    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return ProviderResponse.model_validate(response.json()).recomendaciones
        except (httpx.HTTPError, ValueError) as exc:
            if attempt == retries:
                logger.warning("Proveedor de recomendaciones no disponible: %s", exc)
                return None
            await asyncio.sleep(0.1 * (attempt + 1))
    return None