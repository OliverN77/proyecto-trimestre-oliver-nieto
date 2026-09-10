from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.responses import API_RESPONSES
from app.database import get_async_db
from app.dependencies.auth import get_current_user
from app.models.producto import Producto
from app.models.servicio import Servicio
from app.schemas.recomendacion import RecomendacionRequest, RecomendacionResponse
from app.services.provider import fetch_external_recommendations
from app.services.recommender import LocalRecommender

router = APIRouter(prefix="/api/recomendaciones", tags=["Recomendaciones"], responses=API_RESPONSES)


async def catalog_items(db: AsyncSession) -> list[dict]:
    products = (await db.scalars(select(Producto).where(Producto.estado == "disponible"))).all()
    services = (await db.scalars(select(Servicio).where(Servicio.estado == "activo"))).all()
    return [
        {"tipo": "producto", "id": item.id_producto, "nombre": item.nombre, "descripcion": item.descripcion, "precio": item.precio}
        for item in products
    ] + [
        {"tipo": "servicio", "id": item.id_servicio, "nombre": item.nombre, "descripcion": item.descripcion, "precio": item.precio}
        for item in services
    ]


@router.post("", response_model=RecomendacionResponse, summary="Genera recomendaciones del catálogo")
async def recomendar(datos: RecomendacionRequest, db: AsyncSession = Depends(get_async_db), _=Depends(get_current_user)):
    items = catalog_items(db)
    external = await fetch_external_recommendations(
        settings.recommendation_provider_url,
        {"preferencia": datos.preferencia, "limite": datos.limite},
        settings.recommendation_provider_timeout,
        settings.recommendation_provider_retries,
    )
    valid_items = {(item["tipo"], item["id"]): item for item in items}
    if external is not None:
        recommendations = [valid_items[(item.tipo, item.id)] for item in external if (item.tipo, item.id) in valid_items][:datos.limite]
        if recommendations:
            return {"recomendaciones": [{**item, "razon": "Sugerido por el proveedor externo"} for item in recommendations], "fuente": "externo", "proveedor_disponible": True}

    local = await run_in_threadpool(app_state_recommender().predict, datos.preferencia, items, datos.limite)
    return {"recomendaciones": [{**item, "razon": "Sugerido por el recomendador local"} for item in local], "fuente": "local", "proveedor_disponible": False}


def app_state_recommender() -> LocalRecommender:
    from app.main import app

    return app.state.recommender