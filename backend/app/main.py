import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AuthorizationError, ConflictError, CredencialesInvalidasError, NotFoundError
from app.routers import auth, pedidos, productos, recuperacion, reservas, servicios, usuarios

logger = logging.getLogger("taberna_del_faro.api")

app = FastAPI(
    title="Taberna del Faro API",
    description="Backend FastAPI del proyecto Taberna del Faro",
    version="1.0.0",
    openapi_tags=[
        {"name": "Autenticación", "description": "Registro, login y generación de JWT"},
        {"name": "Usuarios", "description": "Gestión de usuarios y roles"},
        {"name": "Productos", "description": "Carta de productos del restaurante"},
        {"name": "Servicios", "description": "Servicios adicionales del restaurante"},
        {"name": "Reservas", "description": "Reservas de mesas del restaurante"},
        {"name": "Pedidos", "description": "Pedidos de productos y servicios"},
        {"name": "Recuperación", "description": "Solicitudes de recuperación de acceso"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Error inesperado en %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})


@app.exception_handler(AuthorizationError)
async def authorization_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})


@app.exception_handler(CredencialesInvalidasError)
async def credenciales_handler(request: Request, exc: CredencialesInvalidasError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errores = [
        {"campo": ".".join(str(parte) for parte in error["loc"]), "mensaje": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": "Error de validación", "errores": errores})


app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(servicios.router)
app.include_router(reservas.router)
app.include_router(pedidos.router)
app.include_router(recuperacion.router)
