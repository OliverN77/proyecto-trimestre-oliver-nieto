# Taberna del Faro - Sistema de Gestión de Restaurante 🍽️🌊

![Taberna del Faro](https://img.shields.io/badge/Status-En_Desarrollo-orange) ![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688) ![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1)

Un moderno e integral sistema de gestión para el restaurante **Taberna del Faro**. Esta aplicación web Full-Stack proporciona una solución completa para manejar reservaciones, inventario de menú, control de mesas, interacción mediante inteligencia artificial y módulos administrativos basados en roles.

---

## ✨ Características Principales

### 🔐 Sistema de Roles (RBAC)
La aplicación cuenta con tres perfiles de usuario distintos, garantizando seguridad y accesos controlados mediante tokens JWT (JSON Web Tokens):
- **Administrador:** Control total sobre métricas, reportes, menú, usuarios y configuraciones globales.
- **Empleado:** Gestión activa de reservas diarias, atención de PQR y monitoreo de la operatividad del restaurante.
- **Cliente:** Interfaz amigable para realizar reservas, editar perfil, revisar el historial y levantar PQRs.

### 📅 Gestión Avanzada de Reservas
- Motor de validación de disponibilidad en tiempo real basado en la capacidad y estado de las mesas.
- Flujo interactivo que evita cruces de horarios.
- Historial y emisión de **Comprobantes Digitales**.

### 🤖 Chatbot con Inteligencia Artificial
- Asistente virtual impulsado por los modelos LLM más recientes a través de la **API de Groq (Llama 3.x)**.
- Integrado directamente en la interfaz del cliente.
- Descubrimiento dinámico de modelos de IA, evitando errores de obsolescencia.

### 📊 Dashboard y Reportes
- Panel administrativo con tarjetas de KPI (Métricas Clave de Rendimiento) animadas y responsivas.
- Gráficas de tendencias en SVG puro para análisis de reservas e ingresos.
- Exportación automática de **reportes operativos diarios en PDF y Excel**.

### 📋 Gestión de PQR
- Módulo completo de Peticiones, Quejas y Reclamos.
- Seguimiento de estados: Pendiente, En Revisión y Resuelto, mejorando el servicio al cliente.

---

## 🛠️ Tecnologías y Arquitectura

El proyecto sigue una arquitectura desacoplada estructurada en cliente (Frontend) y servidor (Backend).

### Frontend (Cliente)
- **Framework:** React 19 empaquetado con Vite.
- **Estilos:** Tailwind CSS v4 + Vanilla CSS para variables globales dinámicas.
- **Enrutamiento:** React Router DOM (Manejo de rutas públicas y privadas protegidas).
- **Animaciones:** GSAP (para transiciones fluidas e interactivas).

### Backend (Servidor)
- **Framework:** FastAPI (Python), asegurando concurrencia asíncrona de alto rendimiento.
- **ORM:** SQLAlchemy 2.0.
- **Base de Datos:** MySQL (Alojada y gestionada en Clever Cloud).
- **Autenticación:** Passlib (Bcrypt) para encriptación y Python-JOSE para emisión de JWT.
- **Generación de Archivos:** ReportLab (PDF) y OpenPyXL (Excel).

---

## 🚀 Instalación y Ejecución Local

Para ejecutar el proyecto en un entorno local, asegúrate de tener instalados **Node.js** y **Python 3.10+**.

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd proyecto-trimestre-oliver-nieto
```

### 2. Levantar el Backend (FastAPI)
```bash
cd backend
# Crear un entorno virtual
python -m venv .venv

# Activar el entorno virtual (Windows)
.venv\Scripts\activate
# (En Mac/Linux: source .venv/bin/activate)

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor de desarrollo
uvicorn app.main:app --reload
```
*El servidor backend se ejecutará en `http://localhost:8000`. La documentación automática de la API estará disponible en `http://localhost:8000/docs`.*

### 3. Levantar el Frontend (React)
Abre una nueva terminal en la raíz del proyecto:
```bash
cd frontend

# Instalar los paquetes de NPM
npm install

# Iniciar la aplicación
npm run dev
```
*El servidor frontend estará disponible típicamente en `http://localhost:5173`.*

---

## 🔒 Variables de Entorno (.env)

El sistema requiere de ciertas claves secretas y URLs. Asegúrate de configurar los archivos `.env` en los directorios respectivos.

**`backend/.env`**
```env
# URL de conexión a Clever Cloud MySQL
DATABASE_URL="mysql+pymysql://usuario:contraseña@servidor/basededatos"
SECRET_KEY="tu-super-secreto-jwt"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY="tu-api-key-de-groq"
```

**`frontend/.env`**
```env
VITE_API_URL="http://localhost:8000/api"
```

---

## 🧑‍💻 Decisiones de Diseño (UX/UI)
La interfaz de *Taberna del Faro* fue diseñada con una estética "Premium", priorizando esquemas de color náuticos pero elegantes (Panna, Inchiostro, Azzurro, Terracotta). Se eliminaron las librerías pesadas de componentes prefabricados a favor de un diseño limpio, a medida, veloz y semánticamente correcto.

## 📄 Licencia
Este proyecto es de carácter académico/privado desarrollado como parte del proyecto trimestral de Oliver Nieto (SENA). Todos los derechos reservados.
