# Quinto Avance — React + Vite + FastAPI
### Integración de Gestión de Reservas, Analítica, Despliegue e Inteligencia Artificial
### Adaptado al proyecto: Taberna del Faro

**Instructor:** Jhan Hader Muñoz
**Ficha:** 3406211
**Trimestre:** 03
**Ambiente:** 702
**Competencia:** React

> **Nota de adaptación:** este documento es una versión del "Quinto Avance" oficial en la que los requerimientos orientados a **ventas / facturación de productos** se reformulan como **gestión de reservas** de mesas/servicios, ya que Taberna del Faro es un proyecto de reservas y no de ventas de productos. La base de datos del proyecto (`taberna_del_faro`) ya cuenta con las tablas `usuarios`, `roles`, `permisos`, `productos`, `servicios`, `mesas`, `reservas`, `pedidos`, `pedido_detalles`, `solicitudes_recuperacion`, así que este avance amplía especialmente `reservas` y añade las tablas nuevas necesarias.

---

## Contexto de la actividad

Una vez finalizados los requerimientos establecidos en los avances anteriores, se debe continuar con la evolución del proyecto, conservando la arquitectura tecnológica implementada en el cuarto avance:

**React + Vite → FastAPI → Base de Datos SQL (MySQL)**

En el cuarto avance se estableció la integración entre el *Frontend* (React + Vite), el *Backend* (FastAPI) y la base de datos MySQL `taberna_del_faro`, incorporando autenticación mediante JWT, control de roles, operaciones CRUD, protección de *endpoints*, validaciones y paneles diferenciados por usuario (Administrador, Empleado, Cliente).

Para este quinto avance, se deben ampliar las funcionalidades existentes y transformar la aplicación en una solución con mayores capacidades de **gestión de reservas**, generación de reportes, visualización de información, comprobantes de reserva, análisis de datos, despliegue en la nube e integración de un *Chatbot* basado en Inteligencia Artificial.

El objetivo no es desarrollar una aplicación diferente, sino continuar evolucionando Taberna del Faro, aprovechando la estructura, componentes, base de datos, endpoints, autenticación, roles y funcionalidades ya implementadas.

## Objetivo de aprendizaje

Desarrollar nuevas funcionalidades sobre la aplicación Full Stack existente, utilizando React + Vite, FastAPI y MySQL, mediante la implementación de módulos de **reservas**, comprobantes/confirmaciones de reserva, generación de reportes, *Dashboards*, despliegue en la nube e integración de un *Chatbot* con Inteligencia Artificial para atención de clientes y gestión de PQR.

## Objetivos específicos

- Ampliar la base de datos MySQL incorporando las entidades necesarias para administrar reservas, detalle de reservas, PQR y demás información requerida por el proyecto.
- Desarrollar nuevos *endpoints* en FastAPI para gestionar las funcionalidades de reservas y administrativas.
- Implementar el registro y consulta de reservas de mesas/servicios ofrecidos a través del sitio web.
- Generar reportes diarios de reservas en formatos PDF y Excel.
- Implementar un módulo de generación y consulta de comprobantes de reserva.
- Desarrollar *Dashboards* diferenciados de acuerdo con los roles definidos en el proyecto.
- Incorporar elementos visuales como tarjetas informativas, gráficos de barras y gráficos lineales.
- Implementar mecanismos de filtrado y consulta de información para facilitar el análisis de los datos.
- Preparar la aplicación para su despliegue en un entorno de producción.
- Integrar un chatbot basado en Inteligencia Artificial para brindar atención a los usuarios y gestionar consultas, quejas, reclamos y PQR.

---

## Nuevos requerimientos del quinto avance

Se deben implementar como mínimo 20 nuevos requerimientos funcionales y/o técnicos, integrados al proyecto existente.

### 1. Módulo de reservas *(antes: módulo de ventas)*

El sistema deberá permitir registrar las reservas realizadas desde el sitio web. La reserva deberá relacionarse, como mínimo, con cliente, usuario que gestiona la operación cuando corresponda, mesa(s) y/o servicios reservados, cantidad de personas, fecha y hora de la reserva, precios o cargos cuando correspondan, descuentos cuando correspondan, subtotal, impuestos cuando correspondan, total, fecha y hora de registro, y estado de la reserva (pendiente, confirmada, cancelada, finalizada, etc.). La información deberá almacenarse de manera persistente en la base de datos (tabla `reservas`, ya existente, ampliada según se requiera).

### 2. Registro de mesas y/o servicios reservados *(antes: registro de productos y servicios vendidos)*

El sistema deberá permitir identificar las mesas y/o servicios incluidos en cada reserva (por ejemplo: mesa específica, menú especial, evento privado). Deberá existir una relación entre la reserva y su respectivo detalle (`detalle_reservas`), permitiendo almacenar cantidades, precios y valores correspondientes a cada elemento reservado.

### 3. Historial de reservas *(antes: historial de ventas)*

El sistema deberá disponer de un módulo que permita consultar el historial de reservas. Los usuarios autorizados podrán realizar consultas utilizando criterios como fecha, cliente, mesa, servicio, estado y valor de la reserva.

### 4. Reporte diario de reservas *(antes: reporte diario de ventas)*

El sistema deberá generar un reporte diario de reservas con la información registrada durante una fecha determinada. El reporte deberá incluir fecha, número de reserva, cliente, mesa(s)/servicio(s), cantidad de personas, valor (si aplica), total y estado.

### 5. Exportación del reporte en PDF

Se deberá implementar la generación del reporte diario de reservas en formato PDF. El documento deberá presentar una estructura organizada, incluyendo como mínimo nombre o identificación del proyecto (Taberna del Faro), fecha del reporte, información de las reservas, totales e información de generación del reporte.

### 6. Exportación del reporte en Excel

El mismo reporte de reservas deberá poder exportarse en formato Excel (.xlsx). El archivo deberá contener información organizada en columnas y permitir posteriormente realizar procesos de análisis o filtrado de datos.

### 7. Generación de comprobante de reserva *(antes: generación de facturas de venta)*

El sistema deberá generar un comprobante/confirmación de reserva a partir de una operación registrada. El comprobante deberá contener como mínimo número de reserva, fecha y hora, datos del cliente, mesa(s)/servicio(s), cantidad de personas, precio (cuando aplique), subtotal, impuestos cuando correspondan, total y estado de la reserva.

### 8. Consulta de comprobantes de reserva *(antes: consulta de facturas)*

Los usuarios autorizados deberán poder consultar los comprobantes generados. El sistema deberá permitir buscar comprobantes mediante diferentes criterios, como número de reserva, cliente o fecha.

### 9. Descarga de comprobantes de reserva *(antes: descarga de facturas)*

Se deberá implementar la posibilidad de generar o descargar el comprobante de reserva en un formato apropiado, preferiblemente PDF.

### 10. *Dashboard* administrativo

El Administrador deberá disponer de un dashboard con información consolidada del sistema. Como mínimo deberá presentar indicadores relacionados con total de usuarios, mesas, servicios, **reservas**, comprobantes emitidos y PQR recibidas y pendientes. Los indicadores deberán representarse mediante componentes visuales tipo Card.

### 11. *Dashboard* de reservas *(antes: dashboard de ventas)*

El sistema deberá incorporar gráficos que permitan analizar el comportamiento de las reservas. Como mínimo deberá implementar gráfico de barras, gráfico lineal e indicadores numéricos mediante Cards. Los gráficos podrán representar información por día, semana o mes (por ejemplo: reservas por franja horaria, ocupación de mesas, reservas confirmadas vs. canceladas).

### 12. *Dashboard* de acuerdo con los roles

Los Dashboards deberán respetar el sistema de roles ya desarrollado (Administrador, Empleado, Cliente). Cada rol deberá visualizar únicamente la información y funcionalidades que correspondan a sus permisos.

### 13. Filtros para los *Dashboards*

Los gráficos e indicadores deberán permitir, cuando sea aplicable, filtrar información mediante criterios como fecha inicial, fecha final, mesa, servicio, estado y cliente.

### 14. Nuevos endpoints en FastAPI

Se deberán crear los endpoints necesarios para soportar las nuevas funcionalidades, incluyendo, según corresponda: reservas, detalle de reservas, comprobantes, reportes, PQR, chatbot y estadísticas.

### 15. Integración del Dashboard con FastAPI

La información presentada en los Dashboards no deberá estar escrita manualmente en el Frontend. React deberá consumir los endpoints de FastAPI para obtener la información almacenada en la base de datos y generar los indicadores y gráficos dinámicamente.

### 16. Módulo de PQR (Petición de Quejas y Reclamos)

El sistema deberá incorporar un módulo para la gestión de peticiones, quejas y reclamos. El cliente deberá poder registrar una solicitud y consultar su estado. El sistema deberá permitir estados como pendiente, en proceso, respondida y cerrada.

### 17. *Chatbot* para atención al cliente

Se deberá implementar un Chatbot integrado al sitio web para proporcionar atención inicial a los clientes. Deberá permitir resolver preguntas frecuentes, orientar sobre mesas y servicios disponibles, proporcionar información general, **orientar el proceso de reserva** y recibir u orientar solicitudes relacionadas con PQR.

### 18. Integración del *Chatbot* con Inteligencia Artificial

El Chatbot deberá utilizar un servicio de Inteligencia Artificial que permita generar respuestas más naturales y contextualizadas. Se podrá utilizar una API de IA, como OpenAI API, o cualquier otro proveedor equivalente que sea técnicamente viable. La integración deberá realizarse preferiblemente desde FastAPI.

### 19. Gestión segura de la API Key

Para utilizar el servicio de Inteligencia Artificial, se deberá configurar la clave de acceso mediante variables de entorno. La clave deberá mantenerse privada y no deberá publicarse en GitHub ni incorporarse directamente al código fuente.

### 20. Integración completa y despliegue del proyecto

Se deberá realizar el despliegue de la aplicación para demostrar que el proyecto puede funcionar fuera del entorno local. Railway será una plataforma recomendada, aunque podrá utilizarse otra plataforma técnicamente viable. El despliegue deberá contemplar Frontend React + Vite, Backend FastAPI, base de datos MySQL, variables de entorno, configuración de URLs, CORS y credenciales de forma segura. Se deberá presentar la URL pública de la aplicación y evidencias de funcionamiento.

---

## Requerimientos técnicos adicionales

### ➤ Base de datos

La base de datos `taberna_del_faro` deberá evolucionar respecto a los avances anteriores para soportar las nuevas funcionalidades. Podrán incorporarse o ampliarse tablas como:

- `reservas` *(ya existente — ampliar campos: estado, subtotal, impuestos, total, etc.)*
- `detalle_reservas` *(antes: detalle_ventas)*
- `comprobantes_reserva` *(antes: facturas)*
- `detalle_comprobantes` *(antes: detalle_facturas)*
- `pqr`
- `conversaciones`
- `mensajes`
- u otras que sean necesarias según el proyecto.

### ➤ FastAPI

Las nuevas funcionalidades deberán contar con *endpoints*, modelos y esquemas correspondientes. Se deberá mantener la separación entre modelos de base de datos y esquemas de validación.

### ➤ React + Vite

Las nuevas funcionalidades deberán integrarse mediante componentes reutilizables y mantener la estructura visual (paleta mediterránea: notte, limone, terracotta, azzurro, panna, oliva, inchiostro; tipografía Jost/Work Sans) desarrollada durante los avances anteriores.

### ➤ Seguridad

- JWT.
- Control de roles.
- Protección de endpoints.
- Hashing de contraseñas.
- Variables de entorno.
- Protección de claves y credenciales.

### ➤ Pruebas

Se deberán probar los nuevos endpoints mediante Postman o una herramienta equivalente. Deberán presentarse evidencias de las solicitudes y respuestas correspondientes.

---

## Entregables del quinto avance

- Proyecto completo actualizado.
- Frontend React + Vite.
- Backend FastAPI.
- Base de datos MySQL actualizada.
- Script SQL actualizado.
- Nuevas tablas y relaciones.
- **Módulo de reservas.**
- **Historial de reservas.**
- **Reporte diario de reservas.**
- Reporte en PDF.
- Reporte en Excel.
- **Módulo de comprobantes de reserva.**
- Dashboard administrativo.
- **Dashboard de reservas.**
- Dashboards diferenciados por roles.
- Gráficos de barras.
- Gráficos lineales.
- Cards de indicadores.
- Módulo de PQR.
- Chatbot integrado al sitio web.
- Integración del Chatbot con Inteligencia Artificial.
- Configuración segura de la API Key mediante variables de entorno.
- Nuevos endpoints desarrollados en FastAPI.
- Pruebas mediante Postman.
- Despliegue del proyecto.
- URL pública de la aplicación.
- Evidencias del funcionamiento en producción.
- Evidencias de los reportes.
- **Evidencias de los comprobantes de reserva.**
- Evidencias de los Dashboards.
- Evidencias del Chatbot.
- Evidencias de la integración con IA.
- Código fuente organizado.
- Documentación técnica de las nuevas funcionalidades.

## Evidencias requeridas

- **Registro de una reserva.**
- **Consulta del historial de reservas.**
- Generación del reporte diario.
- Exportación a PDF.
- Exportación a Excel.
- **Generación de un comprobante de reserva.**
- **Consulta de un comprobante de reserva.**
- Dashboard administrativo.
- Dashboard de empleado, cuando corresponda.
- Dashboard de cliente, cuando corresponda.
- Gráficos de barras.
- Gráficos lineales.
- Cards de indicadores.
- Registro de una PQR.
- Gestión de una PQR.
- Funcionamiento del Chatbot.
- Conversación con el chatbot mediante IA.
- Configuración de variables de entorno, sin exponer las claves.
- Pruebas de los nuevos endpoints mediante Postman.
- Aplicación desplegada.
- URL pública funcionando correctamente.

---

## Resultado esperado

Al finalizar el quinto avance, se deberá contar con una aplicación web Full Stack funcional y desplegada (Taberna del Faro), construida sobre la arquitectura React + Vite → FastAPI → MySQL.

La aplicación deberá demostrar la evolución progresiva del proyecto, incorporando nuevas capacidades orientadas a la **gestión de reservas**, generación de reportes, emisión de comprobantes, análisis visual de información, gestión de PQR, atención mediante chatbot, integración de Inteligencia Artificial y despliegue en la nube.

El proyecto deberá permitir registrar y consultar reservas de mesas y servicios, generar reportes diarios en PDF y Excel, emitir comprobantes de reserva, visualizar información mediante Dashboards diferenciados por roles y atender consultas de los clientes mediante un Chatbot integrado con un servicio de Inteligencia Artificial.

Finalmente, se deberá demostrar que la solución puede ejecutarse en un entorno de producción, manteniendo buenas prácticas de seguridad, especialmente en el manejo de credenciales, variables de entorno y claves de acceso a servicios externos.

## Recomendaciones para la presentación

- Conservar la estructura y funcionalidades desarrolladas en los avances anteriores.
- Evitar exponer contraseñas, tokens, API Keys o credenciales en capturas, repositorios o documentos públicos.
- Presentar evidencias claras y organizadas de cada requerimiento.
- Verificar que el Frontend, Backend y base de datos funcionen correctamente de manera integrada.
- Comprobar que los Dashboards obtengan información real desde FastAPI y la base de datos.
- Probar las funcionalidades tanto en entorno local como en el entorno desplegado.
- Documentar los endpoints nuevos y sus respectivas pruebas.
- Presentar la URL pública del proyecto desplegado.
- Explicar durante la sustentación el flujo de información entre React, FastAPI, MySQL, el sistema de reportes y el Chatbot con IA.
