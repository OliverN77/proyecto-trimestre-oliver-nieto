# Backend FastAPI - Taberna del Faro

## Puesta en marcha

1. Activa el entorno virtual: `venv\Scripts\activate`
2. Copia `.env.example` como `.env` y completa las credenciales de MySQL.
3. Instala dependencias: `pip install -r requirements.txt`
4. Inicia la API: `uvicorn app.main:app --reload --port 8000`

## Calidad y datos de demostracion

- Poblar datos iniciales: `python scripts/seed.py`
- Ejecutar pruebas: `python -m pytest tests -q`
- Generar la lista de chequeo PDF desde la raiz del proyecto: `backend\\venv\\Scripts\\python.exe docs\\generar_pdf.py`

Documentación interactiva: `http://127.0.0.1:8000/docs`

La base de datos debe existir previamente con el dump SQL del proyecto. El backend no ejecuta `create_all()` ni modifica el esquema.

## Rutas principales

- `POST /api/usuarios/registro` - registro público de clientes.
- `POST /api/auth/login` - genera JWT.
- `GET /api/productos` y `GET /api/servicios` - consultas públicas paginadas.
- CRUD de usuarios, productos y servicios - protegido por JWT y rol de administrador cuando corresponde.

La evidencia de los 65 criterios se encuentra en `docs/lista_chequeo_final.md` y `docs/lista_chequeo_final.pdf`.
