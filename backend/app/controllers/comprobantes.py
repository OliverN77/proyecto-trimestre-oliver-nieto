import io
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.comprobante_reserva import ComprobanteReserva
from app.models.mesa import Mesa
from app.models.reserva import Reserva
from app.models.reserva_producto import ReservaProducto
from app.models.reserva_servicio import ReservaServicio
from app.models.usuario import Usuario
from app.schemas.comprobante import ComprobanteOut

router = APIRouter(prefix="/api/comprobantes", tags=["Comprobantes"], responses=API_RESPONSES)


def _build_comprobante_data(reserva, mesa, cliente):
    """Build the JSON snapshot for a comprobante."""
    return json.dumps({
        "id_reserva": reserva.id_reserva,
        "fecha_reserva": str(reserva.fecha_reserva),
        "hora_inicio": str(reserva.hora_inicio)[:5],
        "hora_fin": str(reserva.hora_fin)[:5],
        "cantidad_personas": reserva.cantidad_personas,
        "mesa": mesa.numero_mesa,
        "ubicacion_mesa": mesa.ubicacion,
        "estado": reserva.estado,
        "cliente": {
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "documento": cliente.numero_documento,
            "correo": cliente.correo,
            "telefono": cliente.telefono,
        },
        "productos": [
            {"nombre": rp.producto.nombre, "cantidad": rp.cantidad, "precio": rp.producto.precio, "subtotal": rp.cantidad * rp.producto.precio}
            for rp in reserva.productos
        ] if reserva.productos else [],
        "servicios": [
            {"nombre": rs.servicio.nombre, "cantidad": rs.cantidad, "precio": rs.servicio.precio, "subtotal": rs.cantidad * rs.servicio.precio}
            for rs in reserva.servicios
        ] if reserva.servicios else [],
        "subtotal": reserva.subtotal,
        "impuestos": reserva.impuestos,
        "total": reserva.total,
        "observaciones": reserva.observaciones,
    }, ensure_ascii=False)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ComprobanteOut, summary="Genera un comprobante de reserva")
def generar_comprobante(
    id_reserva: int = Query(...),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    reserva = db.scalar(
        select(Reserva)
        .options(
            selectinload(Reserva.productos).selectinload(ReservaProducto.producto),
            selectinload(Reserva.servicios).selectinload(ReservaServicio.servicio),
        )
        .where(Reserva.id_reserva == id_reserva)
    )
    if not reserva:
        raise NotFoundError("Reserva", id_reserva)

    # Check if comprobante already exists
    existing = db.scalar(
        select(ComprobanteReserva).where(ComprobanteReserva.id_reserva == id_reserva, ComprobanteReserva.estado == "emitido")
    )
    if existing:
        raise ConflictError("Ya existe un comprobante para esta reserva")

    mesa = db.get(Mesa, reserva.id_mesa)
    cliente = db.get(Usuario, reserva.id_cliente)

    # Generate unique comprobante number
    now = datetime.utcnow()
    numero = f"COMP-{now.strftime('%Y%m%d')}-{reserva.id_reserva:04d}"

    comprobante = ComprobanteReserva(
        id_reserva=id_reserva,
        numero_comprobante=numero,
        fecha_emision=now,
        datos_json=_build_comprobante_data(reserva, mesa, cliente),
        estado="emitido",
    )
    db.add(comprobante)
    db.commit()
    db.refresh(comprobante)
    return comprobante


@router.get("", response_model=list[ComprobanteOut], summary="Lista comprobantes de reserva")
def listar_comprobantes(
    numero: Optional[str] = None,
    cliente: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    query = (
        select(ComprobanteReserva)
        .join(Reserva, Reserva.id_reserva == ComprobanteReserva.id_reserva)
        .join(Usuario, Usuario.id_usuario == Reserva.id_cliente)
    )

    if numero:
        query = query.where(ComprobanteReserva.numero_comprobante.ilike(f"%{numero}%"))
    if cliente:
        query = query.where(
            (Usuario.nombre.ilike(f"%{cliente}%")) | (Usuario.apellido.ilike(f"%{cliente}%"))
        )
    if fecha_inicio:
        query = query.where(ComprobanteReserva.fecha_emision >= fecha_inicio)
    if fecha_fin:
        query = query.where(ComprobanteReserva.fecha_emision <= fecha_fin + " 23:59:59")

    query = query.order_by(ComprobanteReserva.fecha_emision.desc())
    return db.scalars(query).all()


@router.get("/{id_comprobante}", response_model=ComprobanteOut, summary="Obtiene un comprobante")
def obtener_comprobante(
    id_comprobante: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comprobante = db.get(ComprobanteReserva, id_comprobante)
    if not comprobante:
        raise NotFoundError("Comprobante", id_comprobante)

    # Clients can only see their own
    if usuario.id_rol == 3:
        reserva = db.get(Reserva, comprobante.id_reserva)
        if reserva.id_cliente != usuario.id_usuario:
            raise AuthorizationError()

    return comprobante


@router.get("/{id_comprobante}/pdf", summary="Descarga comprobante en PDF")
def descargar_comprobante_pdf(
    id_comprobante: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comprobante = db.get(ComprobanteReserva, id_comprobante)
    if not comprobante:
        raise NotFoundError("Comprobante", id_comprobante)

    if usuario.id_rol == 3:
        reserva = db.get(Reserva, comprobante.id_reserva)
        if reserva.id_cliente != usuario.id_usuario:
            raise AuthorizationError()

    datos = json.loads(comprobante.datos_json)

    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Taberna del Faro", styles["Title"]))
    elements.append(Paragraph("Comprobante de Reserva", styles["Heading2"]))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"<b>N° Comprobante:</b> {comprobante.numero_comprobante}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Fecha emisión:</b> {comprobante.fecha_emision.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Client info
    cli = datos.get("cliente", {})
    elements.append(Paragraph(f"<b>Cliente:</b> {cli.get('nombre', '')} {cli.get('apellido', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Documento:</b> {cli.get('documento', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Correo:</b> {cli.get('correo', '')}", styles["Normal"]))
    elements.append(Spacer(1, 8))

    # Reservation info
    elements.append(Paragraph(f"<b>Reserva #:</b> {datos.get('id_reserva', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Fecha:</b> {datos.get('fecha_reserva', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Horario:</b> {datos.get('hora_inicio', '')} – {datos.get('hora_fin', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Mesa:</b> {datos.get('mesa', '')} ({datos.get('ubicacion_mesa', '')})", styles["Normal"]))
    elements.append(Paragraph(f"<b>Personas:</b> {datos.get('cantidad_personas', '')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Estado:</b> {datos.get('estado', '')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Items table
    items_data = [["Descripción", "Cantidad", "Precio Unit.", "Subtotal"]]
    for p in datos.get("productos", []):
        items_data.append([p["nombre"], str(p["cantidad"]), f"${p['precio']:,.2f}", f"${p['subtotal']:,.2f}"])
    for s in datos.get("servicios", []):
        items_data.append([s["nombre"], str(s["cantidad"]), f"${s['precio']:,.2f}", f"${s['subtotal']:,.2f}"])

    if len(items_data) > 1:
        items_data.append(["", "", "Subtotal", f"${datos.get('subtotal', 0):,.2f}"])
        items_data.append(["", "", "Impuestos (IVA)", f"${datos.get('impuestos', 0):,.2f}"])
        items_data.append(["", "", "TOTAL", f"${datos.get('total', 0):,.2f}"])

        table = Table(items_data, colWidths=[200, 60, 80, 80])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16324f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -4), 0.5, colors.grey),
            ("FONTNAME", (2, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (2, -1), (-1, -1), colors.HexColor("#e8b23d")),
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph("Sin productos o servicios registrados.", styles["Normal"]))

    if datos.get("observaciones"):
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(f"<b>Observaciones:</b> {datos['observaciones']}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={comprobante.numero_comprobante}.pdf"},
    )
