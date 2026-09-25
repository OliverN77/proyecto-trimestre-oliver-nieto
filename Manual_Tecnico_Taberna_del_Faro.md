# Manual Técnico del Proyecto Formativo: Taberna del Faro

---

## 1. Portada

**Nombre del proyecto:** Taberna del Faro - Sistema de Gestión de Restaurante
**Ficha:** 3406211
**Programa de formación:** Análisis y Desarrollo de Software (ADSO)
**Integrantes:** Oliver Nieto
**Instructor:** Cesar Augusto Moreno Mena
**Centro / Regional:** CESGE
**Fecha:** 24 de septiembre de 2026

---

## 2. Tabla de contenido

1. Portada
2. Tabla de contenido
3. Introducción y descripción general del proyecto
4. Objetivos
5. Alcance del proyecto
6. Arquitectura de la solución
7. Modelo de datos
8. Diseño de la solución
9. Manual de instalación y configuración
10. Documentación técnica de los Controladores
11. Pruebas realizadas
12. Conclusiones y recomendaciones
13. Anexos

---

## 3. Introducción y descripción general del proyecto

**Problema que resuelve:**
Los restaurantes suelen enfrentarse a dificultades en la gestión de reservas, la pérdida de información sobre requerimientos de los clientes y retrasos en la atención por falta de personal dedicado exclusivamente a consultas (PQR y dudas del menú). Además, carecen de métricas claras sobre su rendimiento diario en tiempo real. 

**Contexto y solución:**
*Taberna del Faro* es una aplicación web Full-Stack diseñada para digitalizar y centralizar la administración del restaurante. Proporciona una solución completa y automatizada para gestionar reservas en tiempo real, manejar inventario, gestionar peticiones, quejas y reclamos (PQR) y ofrecer atención al cliente automatizada mediante un chatbot integrado con inteligencia artificial (Groq Llama 3).

**Usuarios y actores:**
*   **Administrador:** Control total (métricas, reportes, gestión de menús y usuarios).
*   **Empleado:** Gestión operativa diaria, aprobación de reservas y seguimiento de PQR.
*   **Cliente:** Reserva de mesas, interacción con el chatbot de IA, historial de consumos y creación de PQR.

---

## 4. Objetivos

**Objetivo General:**
Desarrollar e implementar un sistema de gestión web integral para el restaurante "Taberna del Faro", optimizando el proceso de reservas, atención al cliente y generación de métricas operativas.

**Objetivos Específicos:**
1. Implementar un sistema de Control de Acceso Basado en Roles (RBAC) seguro utilizando JSON Web Tokens (JWT).
2. Desarrollar un motor de reservas interactivo con validación de disponibilidad en tiempo real.
3. Integrar un chatbot con Inteligencia Artificial utilizando la API de Groq para atención al cliente.
4. Crear un panel administrativo (Dashboard) que permita visualizar métricas clave (KPIs) y gráficas de rendimiento.
5. Desarrollar la capacidad de exportar reportes operativos en formato PDF y Excel.
6. Implementar un módulo completo de seguimiento y resolución de Peticiones, Quejas y Reclamos (PQR).

---

## 5. Alcance del proyecto

**Funcionalidades Incluidas:**
*   Autenticación y autorización (login/registro) para tres tipos de roles.
*   Creación, validación, actualización y cancelación de reservas.
*   Asistente virtual (Chatbot AI) integrado en la interfaz del cliente.
*   Dashboard administrativo con gráficos en SVG e indicadores de rendimiento.
*   Generación y descarga de comprobantes digitales, y reportes en PDF/Excel.
*   Módulo para levantar y gestionar el ciclo de vida de PQR (Pendiente, En Revisión, Resuelto).

**Funcionalidades Excluidas (Fuera del alcance actual):**
*   Pasarelas de pago electrónico integradas para cobros de reservas o pedidos.
*   Módulo de facturación electrónica conforme a entidades tributarias.
*   Gestión de envíos a domicilio (delivery).

---

## 6. Arquitectura de la solución

El proyecto sigue el patrón de diseño arquitectónico Modelo-Vista-Controlador (MVC), con una separación clara entre la interfaz, la lógica de negocio y los datos.

*   **Vista (View - Frontend):** 
    *   **Framework:** React 19 empaquetado con Vite.
    *   **Estilos:** Tailwind CSS v4 y Vanilla CSS.
    *   **Enrutamiento:** React Router DOM (Manejo de rutas protegidas).
    *   **Animaciones:** GSAP para transiciones.
*   **Controlador (Controller - Backend):**
    *   **Framework:** FastAPI (Python), actuando como intermediario manejando la lógica de negocio y concurrencia asíncrona.
    *   **Seguridad:** Passlib (Bcrypt) y Python-JOSE para JWT.
    *   **Generación de archivos:** ReportLab (PDF) y OpenPyXL (Excel).
*   **Modelo (Model - Base de Datos):**
    *   **Motor:** MySQL gestionado en Clever Cloud.
    *   **ORM:** SQLAlchemy 2.0, representando las entidades de datos.
*   **Servicios Externos:**
    *   **Inteligencia Artificial:** API de Groq (Modelos Llama 3.x).

---

## 7. Modelo de datos

La base de datos MySQL relacional contiene las siguientes entidades principales (Diccionario de Datos y Relaciones):

*   **Usuarios (`users`)**:
    *   `id` (INT, PK), `nombre` (VARCHAR), `email` (VARCHAR, UNIQUE), `password_hash` (VARCHAR), `rol` (ENUM: 'admin', 'empleado', 'cliente').
*   **Reservas (`reservations`)**:
    *   `id` (INT, PK), `usuario_id` (INT, FK), `fecha_hora` (DATETIME), `numero_personas` (INT), `estado` (ENUM: 'confirmada', 'cancelada', 'completada').
    *   *Relación:* Un usuario puede tener muchas reservas (1:N).
*   **Mesas (`tables`)**:
    *   `id` (INT, PK), `numero` (INT), `capacidad` (INT), `estado` (VARCHAR).
*   **PQR (`pqrs`)**:
    *   `id` (INT, PK), `usuario_id` (INT, FK), `asunto` (VARCHAR), `descripcion` (TEXT), `estado` (ENUM: 'pendiente', 'en_revision', 'resuelto').
    *   *Relación:* Un usuario puede crear múltiples PQR (1:N).

---

## 8. Diseño de la solución

**Casos de uso principales (Historias de Usuario):**

1.  **CU01 - Gestión de Reservas:** El usuario cliente selecciona una fecha, hora y número de personas. El sistema consulta a la base de datos la disponibilidad de mesas. Si hay espacio, se confirma la reserva y genera un comprobante digital.
2.  **CU02 - Consulta al Chatbot:** El cliente interactúa con el widget de IA. El frontend envía la consulta al backend, el cual se comunica con la API de Groq, retornando una respuesta contextual sobre el restaurante y el menú.
3.  **CU03 - Monitoreo Administrativo:** El administrador ingresa al sistema y visualiza el Dashboard. El backend calcula en tiempo real los ingresos proyectados y la ocupación, entregando la data para que el frontend renderice las gráficas SVG.
4.  **CU04 - Exportación de Reportes:** El empleado/admin solicita un reporte del día. El backend extrae los datos usando SQLAlchemy, utiliza ReportLab o OpenPyXL para armar el documento y lo retorna como un `StreamingResponse` para descarga directa en el navegador.

---

## 9. Manual de instalación y configuración

**Requisitos Previos:**
*   Python 3.10 o superior.
*   Node.js (versión 18+ recomendada) y NPM.
*   Git instalado.

**Paso 1: Clonar el proyecto**
```bash
git clone https://github.com/OliverN77/proyecto-trimestre-oliver-nieto
cd proyecto-trimestre-oliver-nieto
```

**Paso 2: Configuración del Backend (FastAPI)**
1.  Navegar a la carpeta backend: `cd backend`
2.  Crear y activar entorno virtual:
    ```bash
    python -m venv .venv
    .venv\Scripts\activate   # En Windows
    ```
3.  Instalar dependencias: `pip install -r requirements.txt`
4.  Crear archivo `.env` en la carpeta `backend/`:
    ```env
    DATABASE_URL="mysql+pymysql://usuario:contraseña@servidor/basededatos"
    SECRET_KEY="tu-super-secreto-jwt"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    GROQ_API_KEY="tu-api-key-de-groq"
    ```
5.  Ejecutar el servidor: `uvicorn app.main:app --reload` (Correrá en el puerto 8000).

**Paso 3: Configuración del Frontend (React)**
1.  Navegar a la carpeta frontend (abriendo una nueva terminal): `cd frontend`
2.  Instalar módulos de node: `npm install`
3.  Crear archivo `.env` en la carpeta `frontend/`:
    ```env
    VITE_API_URL="http://localhost:8000/api"
    ```
4.  Iniciar el entorno de desarrollo: `npm run dev` (Correrá en el puerto 5173).

---

## 10. Documentación técnica de los Controladores

FastAPI genera documentación automática de las rutas del controlador (API). Puede accederse localmente en `http://localhost:8000/docs` (Swagger UI). 

**Controladores Principales (Endpoints):**
*   `POST /api/auth/login`: Autentica a un usuario y retorna un Token JWT.
    *   *Body:* `username` (email) y `password`.
*   `GET /api/reservas/`: Retorna el listado de reservas (requiere token, varía según rol).
*   `POST /api/reservas/`: Crea una nueva reserva.
    *   *Body:* `{ "fecha_hora": "2026-10-15T20:00:00", "personas": 4 }`
*   `POST /api/chatbot/ask`: Envía un mensaje a la IA.
    *   *Body:* `{ "mensaje": "¿Cuál es el plato de la casa?" }`
*   `GET /api/reportes/exportar/pdf`: Descarga el reporte operativo en formato PDF.

---

## 11. Pruebas realizadas

*   **Pruebas Unitarias del Backend (Pytest):** Se ejecutaron pruebas sobre los esquemas de Pydantic, modelos de SQLAlchemy y generación de JWT, validando el correcto funcionamiento de rutas críticas. Los resultados reposan en la carpeta `.pytest_cache`.
*   **Pruebas de Integración (Postman/Swagger):** Validación del flujo completo de creación de reserva comprobando la lógica de cruce de horarios y capacidad de mesas. Se confirmó la integridad de los datos mediante consultas SQL directas.
*   **Pruebas de Interfaz (Navegador):** Verificación de la experiencia del usuario en diferentes roles. Se confirmó la operatividad del Chatbot de IA para consultas básicas y la correcta visualización de los gráficos del Dashboard.
*   **Pruebas de Seguridad:** Verificación de la generación de tokens JWT y la protección de rutas sensibles. La autenticación funcionó correctamente, restringiendo el acceso a usuarios no autorizados.

**Nota:** Se realizaron pruebasexhaustive de los endpoints de la API y se documentaron en el documento pruebas_api.docx

---

## 12. Conclusiones y recomendaciones

**Conclusiones:**
*   La combinación de FastAPI y React resultó en una aplicación altamente eficiente y rápida. El uso de validaciones de Pydantic en el backend evitó múltiples errores de tipos de datos en la entrada.
*   La implementación del chatbot con Groq Llama 3 agrega un gran valor al producto final, reduciendo la carga de atención al cliente para preguntas frecuentes.
*   La separación de frontend y backend facilita enormemente el despliegue en múltiples plataformas y servicios en la nube.

**Recomendaciones (Próximas versiones):**
*   **Pasarelas de Pago:** Integrar pasarelas de pago (MercadoPago / Stripe) para confirmar reservas mediante un abono monetario.
*   **Notificaciones:** Incorporar envío de confirmaciones mediante correos electrónicos (ej. SendGrid) o WhatsApp automatizado.
*   **Aplicación Móvil:** Extender la solución creando una app móvil nativa usando React Native reutilizando gran parte del código y la misma API actual.

---

---

## 13. Anexos

*   **Enlace al Repositorio:** [https://github.com/OliverN77/proyecto-trimestre-oliver-nieto](https://github.com/OliverN77/proyecto-trimestre-oliver-nieto)
*   **Capturas de Pantalla Adicionales:** 
    *   Pruebas de endpoints [https://i0005.clarodrive.com/s/DScRPLCPnxeaDga?originalview=true]

---
*Fin del Documento Técnico - GFPI-F SENA*
