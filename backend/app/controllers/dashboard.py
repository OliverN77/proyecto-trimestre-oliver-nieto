from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, case, extract
from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationError
from app.core.responses import API_RESPONSES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.comprobante_reserva import ComprobanteReserva
from app.models.mesa import Mesa
from app.models.pqr import PQR
from app.models.reserva import Reserva
from app.models.servicio import Servicio
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"], responses=API_RESPONSES)


@router.get("/admin", summary="Dashboard administrativo — indicadores generales")
def dashboard_admin(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol != 1:
        raise AuthorizationError()

    total_usuarios = db.scalar(select(func.count(Usuario.id_usuario))) or 0
    total_mesas = db.scalar(select(func.count(Mesa.id_mesa))) or 0
    total_servicios = db.scalar(select(func.count(Servicio.id_servicio))) or 0
    total_reservas = db.scalar(select(func.count(Reserva.id_reserva))) or 0
    total_comprobantes = db.scalar(select(func.count(ComprobanteReserva.id_comprobante))) or 0
    total_pqr = db.scalar(select(func.count(PQR.id_pqr))) or 0
    pqr_pendientes = db.scalar(select(func.count(PQR.id_pqr)).where(PQR.estado.in_(["pendiente", "en_proceso"]))) or 0

    return {
        "total_usuarios": total_usuarios,
        "total_mesas": total_mesas,
        "total_servicios": total_servicios,
        "total_reservas": total_reservas,
        "total_comprobantes": total_comprobantes,
        "total_pqr": total_pqr,
        "pqr_pendientes": pqr_pendientes,
    }


@router.get("/reservas", summary="Dashboard de reservas — analítica con gráficos")
def dashboard_reservas(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    id_mesa: Optional[int] = None,
    estado: Optional[str] = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    if not fecha_inicio:
        fecha_inicio = date.today() - timedelta(days=30)
    if not fecha_fin:
        fecha_fin = date.today()

    base_filter = [
        Reserva.fecha_reserva >= fecha_inicio,
        Reserva.fecha_reserva <= fecha_fin,
    ]
    if id_mesa:
        base_filter.append(Reserva.id_mesa == id_mesa)
    if estado:
        base_filter.append(Reserva.estado == estado)

    # KPI Cards
    total = db.scalar(select(func.count(Reserva.id_reserva)).where(*base_filter)) or 0
    ingresos = db.scalar(select(func.coalesce(func.sum(Reserva.total), 0)).where(*base_filter)) or 0
    promedio_personas = db.scalar(select(func.coalesce(func.avg(Reserva.cantidad_personas), 0)).where(*base_filter)) or 0

    # Status breakdown
    status_counts = db.execute(
        select(Reserva.estado, func.count(Reserva.id_reserva))
        .where(*base_filter)
        .group_by(Reserva.estado)
    ).all()

    # Bar chart: reservas por día de la semana (1=Mon...7=Sun)
    day_of_week = db.execute(
        select(
            func.dayofweek(Reserva.fecha_reserva).label("dow"),
            func.count(Reserva.id_reserva).label("total"),
        )
        .where(*base_filter)
        .group_by("dow")
        .order_by("dow")
    ).all()
    day_names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    bar_chart = [{"dia": day_names[row.dow - 1] if 1 <= row.dow <= 7 else "?", "total": row.total} for row in day_of_week]

    # Line chart: reservas por fecha
    by_date = db.execute(
        select(
            Reserva.fecha_reserva,
            func.count(Reserva.id_reserva).label("total"),
        )
        .where(*base_filter)
        .group_by(Reserva.fecha_reserva)
        .order_by(Reserva.fecha_reserva)
    ).all()
    line_chart = [{"fecha": str(row.fecha_reserva), "total": row.total} for row in by_date]

    # Mesa occupancy
    mesa_occupancy = db.execute(
        select(
            Mesa.numero_mesa,
            func.count(Reserva.id_reserva).label("total"),
        )
        .join(Reserva, Reserva.id_mesa == Mesa.id_mesa)
        .where(*base_filter)
        .group_by(Mesa.numero_mesa)
        .order_by(Mesa.numero_mesa)
    ).all()

    return {
        "cards": {
            "total_reservas": total,
            "ingresos_totales": round(float(ingresos), 2),
            "promedio_personas": round(float(promedio_personas), 1),
        },
        "status_breakdown": {row[0]: row[1] for row in status_counts},
        "bar_chart": bar_chart,
        "line_chart": line_chart,
        "mesa_occupancy": [{"mesa": row.numero_mesa, "total": row.total} for row in mesa_occupancy],
    }


@router.get("/cliente", summary="Dashboard del cliente")
def dashboard_cliente(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_reservas = db.scalar(
        select(func.count(Reserva.id_reserva)).where(Reserva.id_cliente == usuario.id_usuario)
    ) or 0
    reservas_activas = db.scalar(
        select(func.count(Reserva.id_reserva)).where(
            Reserva.id_cliente == usuario.id_usuario,
            Reserva.estado.in_(["pendiente", "confirmada"]),
        )
    ) or 0
    total_gastado = db.scalar(
        select(func.coalesce(func.sum(Reserva.total), 0)).where(
            Reserva.id_cliente == usuario.id_usuario,
            Reserva.estado.in_(["confirmada", "completada"]),
        )
    ) or 0
    mis_pqr = db.scalar(
        select(func.count(PQR.id_pqr)).where(PQR.id_cliente == usuario.id_usuario)
    ) or 0
    pqr_pendientes = db.scalar(
        select(func.count(PQR.id_pqr)).where(
            PQR.id_cliente == usuario.id_usuario,
            PQR.estado.in_(["pendiente", "en_proceso"]),
        )
    ) or 0

    return {
        "total_reservas": total_reservas,
        "reservas_activas": reservas_activas,
        "total_gastado": round(float(total_gastado), 2),
        "mis_pqr": mis_pqr,
        "pqr_pendientes": pqr_pendientes,
    }


@router.get("/empleado", summary="Dashboard del empleado")
def dashboard_empleado(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.id_rol not in (1, 2):
        raise AuthorizationError()

    hoy = date.today()
    reservas_hoy = db.scalar(
        select(func.count(Reserva.id_reserva)).where(Reserva.fecha_reserva == hoy)
    ) or 0
    pendientes_hoy = db.scalar(
        select(func.count(Reserva.id_reserva)).where(
            Reserva.fecha_reserva == hoy,
            Reserva.estado == "pendiente",
        )
    ) or 0
    confirmadas_hoy = db.scalar(
        select(func.count(Reserva.id_reserva)).where(
            Reserva.fecha_reserva == hoy,
            Reserva.estado == "confirmada",
        )
    ) or 0
    pqr_pendientes = db.scalar(
        select(func.count(PQR.id_pqr)).where(PQR.estado.in_(["pendiente", "en_proceso"]))
    ) or 0

    return {
        "reservas_hoy": reservas_hoy,
        "pendientes_hoy": pendientes_hoy,
        "confirmadas_hoy": confirmadas_hoy,
        "pqr_pendientes": pqr_pendientes,
    }
