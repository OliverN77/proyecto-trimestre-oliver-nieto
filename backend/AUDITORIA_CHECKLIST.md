# Auditoría de lista de chequeo FastAPI

Fecha: 2026-09-03. `Cumple` significa que existe evidencia en el código; `No cumple` señala una brecha real; `No verificable` depende de infraestructura o de requisitos no implementados en este proyecto.

| # | Estado | Evidencia / observación |
|---:|---|---|
| 1 | Cumple | Routers usan recursos plurales; las acciones son sub-recursos.
| 2 | Cumple | GET, POST, PUT, PATCH y DELETE corresponden a sus operaciones.
| 3 | Cumple | [DISEÑO_API.md](DISEÑO_API.md).
| 4 | Cumple | Estados se modifican en `/{id}/estado`.
| 5 | Cumple | IDs, fechas, estado, total y propietario los decide el servidor.
| 6 | Cumple | Existen routers, schemas, models, crud, core y services.
| 7 | Cumple | `main.py` contiene configuración, middleware, handlers e inclusión de routers.
| 8 | Cumple | Cada recurso tiene `APIRouter`, `prefix` y `tags`.
| 9 | Cumple | CRUD de productos, servicios y usuarios está separado de rutas.
| 10 | Cumple | `requirements.txt` está fijado y existe `.env.example`.
| 11 | Cumple | Hay esquemas de creación, actualización y respuesta.
| 12 | Cumple | Se usan restricciones `Field`.
| 13 | Cumple | Hay `field_validator` para documentos.
| 14 | Cumple | Hay `model_validator` para contraseñas, reservas y detalles.
| 15 | Cumple | Actualizaciones usan `exclude_unset=True`.
| 16 | Cumple | No se usa sintaxis Pydantic v1 en los esquemas auditados.
| 17 | Cumple | Las rutas declaran `response_model`; no exponen `contrasena_hash`.
| 18 | Cumple | CRUD completo de productos/servicios/usuarios.
| 19 | Cumple | POST de recursos devuelve 201 y el recurso.
| 20 | Cumple | DELETE devuelve 204 sin cuerpo.
| 21 | Cumple | Conflictos de negocio se traducen a 409.
| 22 | Cumple | Productos y servicios tienen paginación y filtros opcionales de nombre, estado y rango de precio.
| 23 | Cumple | CRUD usa `NotFoundError` y 404.
| 24 | Cumple | Rutas auditadas tienen `tags` y `summary`.
| 25 | Cumple | La app tiene título, descripción, versión y tags.
| 26 | Cumple | Todos los routers heredan `API_RESPONSES` con 401, 403, 404, 409, 422 y 500; OpenAPI fue verificado sin códigos faltantes.
| 27 | Cumple | `PedidoCreate` usa `json_schema_extra`.
| 28 | Cumple | Existe jerarquía `DomainError`.
| 29 | Cumple | La capa CRUD no lanza `HTTPException`.
| 30 | Cumple | Handlers traducen errores propios a HTTP.
| 31 | Cumple | Errores propios, HTTP y validación comparten `detail/path`.
| 32 | Cumple | 422 conserva detalle por campo en el mismo formato.
| 33 | Cumple | 500 es genérico y registra la traza.
| 34 | Cumple | `PaginacionParams` es dependencia reutilizable.
| 35 | Cumple | Las operaciones identificadas usan `ResourceById`, que resuelve el recurso y corta con 404 antes de la ruta.
| 36 | Cumple | `ResourceById` es una dependencia parametrizable con clase.
| 37 | Cumple | Usuarios aplica dependencia a nivel de router.
| 38 | Cumple | Contraseñas se almacenan con bcrypt.
| 39 | Cumple | `SECRET_KEY` proviene del entorno y `.env.example` ya no expone una clave real.
| 40 | Cumple | JWT incluye `sub`, `rol` y `exp`.
| 41 | Cumple | `get_current_user` valida el Bearer y entrega usuario.
| 42 | Cumple | 401 incluye `WWW-Authenticate`; 403 se distingue.
| 43 | Cumple | Mutaciones administrativas exigen rol.
| 44 | Cumple | CORS usa lista explícita.
| 45 | Cumple | Middleware propio registra solicitudes y cabeceras de seguridad.
| 46 | Cumple | Modelos usan `DeclarativeBase`, `Mapped` y `mapped_column`.
| 47 | Cumple | Hay más de cuatro entidades relacionadas con FK.
| 48 | Cumple | Hay restricciones únicas e índices explícitos para estado y precio.
| 49 | Cumple | Engine único y sesión por dependencia.
| 50 | Cumple | Consultas usan `select/where`; la paginación se ejecuta en DB.
| 51 | Cumple | Creación de pedidos hace flush y commit en una transacción.
| 52 | Cumple | CRUD captura `IntegrityError`, rollback y traduce a 409.
| 53 | Cumple | Respuestas separan datos públicos y usan `from_attributes`.
| 54 | Cumple | `scripts/poblar_base.py` crea datos realistas.
| 55 | Cumple | La capa async usa `create_async_engine`, `AsyncSession` y `get_async_db`; recomendaciones consulta con `await` y no depende de lazy loading.
| 56 | Cumple | `LocalRecommender` se entrena fuera de la API y se carga una vez en `lifespan`.
| 57 | Cumple | `/api/recomendaciones` ejecuta la predicción local con `run_in_threadpool`; preferencias y límite vienen del servidor validado.
| 58 | Cumple | El adaptador externo aplica timeout configurable y reintentos con backoff.
| 59 | Cumple | Si el proveedor falla o no devuelve recursos válidos, responde con el recomendador local e informa `fuente`.
| 60 | Cumple | `ProviderResponse` valida la respuesta y el endpoint descarta IDs/tipos ausentes del catálogo propio.
| 61 | Cumple | Recuperación registra una tarea background con `SessionLocal` propio y captura de excepciones.
| 62 | Cumple | Las pruebas añadidas son independientes de MySQL; no usan desarrollo.
| 63 | Cumple | `test_api_overrides.py` usa base SQLite aislada, `dependency_overrides` y limpieza en `finally`.
| 64 | Cumple | La suite cubre caminos HTTP correctos y errores 404, 409 y 422 con una base SQLite aislada.
| 65 | Cumple | Las pruebas de recomendaciones sustituyen el proveedor por dobles/contratos locales y no realizan red real.

## Cambios realizados

- Validación de secretos, detalles de pedido, horarios y cuerpos de recuperación.
- Handlers homogéneos para 401, 403, 404, 409, 422 y 500.
- Logging y cabeceras de seguridad.
- Rollback ante `IntegrityError`.
- Esquema de diseño, pruebas base y script de población.

## Pendientes para afirmar cumplimiento total

La checklist queda sin criterios `No cumple` ni `Parcial`. La aplicación conserva compatibilidad con los CRUD síncronos existentes y ofrece el flujo async completo en recomendaciones mediante `AsyncSession`.
