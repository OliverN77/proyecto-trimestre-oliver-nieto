import logging
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.usuario import Usuario
from app.schemas.chatbot import ChatMessage, ChatResponse

logger = logging.getLogger("taberna_del_faro.chatbot")

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"], responses=API_RESPONSES)

SYSTEM_PROMPT = """Eres el asistente virtual de la Taberna del Faro, un restaurante mediterráneo con ambiente cálido y acogedor. Tu nombre es "Faro" y eres amable, profesional y servicial.

Puedes ayudar con:
- Información sobre el restaurante (horarios, ubicación, ambiente)
- Orientar sobre el proceso de reservas de mesas
- Informar sobre mesas disponibles y tipos (Terraza, Interior, VIP, Bar, Jardín)
- Explicar servicios adicionales del restaurante
- Orientar sobre productos y menú
- Recibir y orientar solicitudes de PQR (Peticiones, Quejas, Reclamos)
- Responder preguntas frecuentes

Información clave:
- Horario: Martes a Domingo, 12:00 PM - 11:00 PM
- Tipos de mesa: Terraza (2-4 personas), Interior (2-6 personas), VIP (requiere producto + servicio), Bar (2 personas), Jardín (hasta 8 personas)
- Para reservar: El cliente puede hacerlo desde su panel de usuario en el sitio web
- Las mesas VIP requieren incluir al menos 1 producto y 1 servicio
- Para PQR: Los clientes pueden registrar peticiones, quejas o reclamos desde su panel

Responde siempre en español. Sé conciso pero amable. Si no sabes algo, sugiere al cliente contactar directamente al restaurante o visitar la sección correspondiente del sitio web."""


async def _get_ai_response(messages: list[dict]) -> str:
    """Call OpenAI API for a response. Falls back to a default if no API key."""
    if not settings.openai_api_key:
        # Fallback: simple rule-based responses
        last_msg = messages[-1]["content"].lower() if messages else ""
        if any(word in last_msg for word in ["reserva", "reservar", "mesa"]):
            return "¡Con gusto te ayudo con tu reserva! 🍽️ Para reservar una mesa, inicia sesión en tu cuenta y ve a la sección 'Nueva reserva' en tu panel. Allí podrás elegir fecha, horario, número de personas y la mesa que prefieras. ¿Necesitas algo más?"
        elif any(word in last_msg for word in ["horario", "hora", "abierto", "cerrado"]):
            return "🕐 Nuestro horario es de Martes a Domingo, de 12:00 PM a 11:00 PM. Los lunes descansamos. ¡Te esperamos!"
        elif any(word in last_msg for word in ["queja", "reclamo", "peticion", "pqr", "problema"]):
            return "Lamento que tengas un inconveniente. 😔 Puedes registrar tu PQR (Petición, Queja o Reclamo) desde tu panel de usuario en la sección 'Mis PQR'. Nuestro equipo te responderá lo antes posible. ¿Puedo ayudarte con algo más?"
        elif any(word in last_msg for word in ["menu", "menú", "plato", "comida", "producto"]):
            return "🍕 ¡Tenemos una deliciosa carta mediterránea! Puedes ver nuestro menú completo al hacer tu reserva, donde podrás pre-seleccionar los platos que desees. ¿Te gustaría saber algo más?"
        elif any(word in last_msg for word in ["vip", "especial", "evento"]):
            return "✨ ¡Nuestras mesas VIP son perfectas para ocasiones especiales! Están ubicadas en una zona exclusiva y requieren incluir al menos 1 producto y 1 servicio adicional al hacer la reserva. ¿Quieres saber más?"
        elif any(word in last_msg for word in ["hola", "buenos", "buenas", "saludos"]):
            return "¡Hola! 👋 Bienvenido a la Taberna del Faro. Soy Faro, tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedo orientarte sobre reservas, nuestro menú, servicios o cualquier consulta que tengas."
        elif any(word in last_msg for word in ["gracias", "genial", "perfecto"]):
            return "¡Con mucho gusto! 😊 Si necesitas algo más, aquí estoy. ¡Que tengas un excelente día y esperamos verte pronto en la Taberna del Faro! 🏮"
        else:
            return "¡Gracias por tu mensaje! 😊 Puedo ayudarte con información sobre reservas, nuestro menú, horarios, servicios adicionales, o recibir tus PQR. ¿Qué te gustaría saber?"

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("Error calling OpenAI API: %s", e)
        return "Lo siento, estoy teniendo dificultades técnicas en este momento. Por favor intenta de nuevo en unos minutos o contacta directamente al restaurante. 🙏"


@router.post("", response_model=ChatResponse, summary="Envía un mensaje al chatbot")
async def enviar_mensaje(
    datos: ChatMessage,
    usuario: Optional[Usuario] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get or create conversation
    if datos.id_conversacion:
        conversacion = db.get(Conversacion, datos.id_conversacion)
        if not conversacion:
            conversacion = Conversacion(id_usuario=usuario.id_usuario if usuario else None)
            db.add(conversacion)
            db.flush()
    else:
        conversacion = Conversacion(id_usuario=usuario.id_usuario if usuario else None)
        db.add(conversacion)
        db.flush()

    # Save user message
    user_msg = Mensaje(
        id_conversacion=conversacion.id_conversacion,
        rol="user",
        contenido=datos.mensaje,
    )
    db.add(user_msg)
    db.flush()

    # Build conversation history for AI
    history = db.scalars(
        select(Mensaje)
        .where(Mensaje.id_conversacion == conversacion.id_conversacion)
        .order_by(Mensaje.creado_en)
    ).all()

    messages = [{"role": msg.rol, "content": msg.contenido} for msg in history[-10:]]  # Last 10 messages

    # Get AI response
    respuesta_text = await _get_ai_response(messages)

    # Save assistant message
    assistant_msg = Mensaje(
        id_conversacion=conversacion.id_conversacion,
        rol="assistant",
        contenido=respuesta_text,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        respuesta=respuesta_text,
        id_conversacion=conversacion.id_conversacion,
    )
