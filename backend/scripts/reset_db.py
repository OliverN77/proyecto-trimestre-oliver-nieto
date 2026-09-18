"""
reset_db.py
-----------
Truncates all tables EXCEPT `productos`, then seeds:
  - 3 roles (Administrador, Empleado, Cliente)
  - 8 mesas
  - 3 users (admin, empleado, cliente)

Run from the `backend/` directory:
    venv\\Scripts\\python.exe scripts/reset_db.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from sqlalchemy import text
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.mesa import Mesa
from app.models.pedido import Pedido, PedidoDetalle
from app.models.recuperacion import SolicitudRecuperacion
from app.models.reserva import Reserva
from app.models.reserva_producto import ReservaProducto
from app.models.rol import Rol
from app.models.usuario import Usuario


def reset():
    with SessionLocal() as db:
        print(">> Desactivando Foreign Key checks ...")
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

        tablas = [
            "mensajes",
            "conversaciones",
            "pqr",
            "comprobantes_reserva",
            "detalle_reservas",
            "reserva_servicios",
            "reserva_productos",
            "reservas",
            "pedido_detalles",
            "pedidos",
            "solicitudes_recuperacion",
            "usuarios",
            "mesas",
        ]
        for tabla in tablas:
            try:
                db.execute(text(f"TRUNCATE TABLE `{tabla}`"))
                print(f"   [OK] TRUNCATE {tabla}")
            except Exception as exc:
                print(f"   [SKIP] {tabla} — {exc}")

        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        if not db.query(Rol).filter_by(id_rol=1).first():
            db.add_all([
                Rol(id_rol=1, nombre_rol="Administrador"),
                Rol(id_rol=2, nombre_rol="Empleado"),
                Rol(id_rol=3, nombre_rol="Cliente"),
            ])
            db.flush()
            print("   [OK] Roles creados")
        else:
            print("   [OK] Roles ya existentes")

        mesas = [
            Mesa(numero_mesa=1, capacidad=2, ubicacion="Terraza",  estado="disponible"),
            Mesa(numero_mesa=2, capacidad=4, ubicacion="Terraza",  estado="disponible"),
            Mesa(numero_mesa=3, capacidad=2, ubicacion="Ventana",  estado="disponible"),
            Mesa(numero_mesa=4, capacidad=4, ubicacion="Ventana",  estado="disponible"),
            Mesa(numero_mesa=5, capacidad=6, ubicacion="Interior", estado="disponible"),
            Mesa(numero_mesa=6, capacidad=6, ubicacion="Interior", estado="disponible"),
            Mesa(numero_mesa=7, capacidad=8, ubicacion="Jardin",   estado="disponible"),
            Mesa(numero_mesa=8, capacidad=2, ubicacion="Bar",      estado="disponible"),
        ]
        db.add_all(mesas)
        db.flush()
        print(f"   [OK] {len(mesas)} mesas creadas")

        ahora = datetime.utcnow()
        usuarios = [
            Usuario(
                nombre="Administrador",
                apellido="Principal",
                tipo_documento="CC",
                numero_documento="1000000001",
                telefono="3000000001",
                correo="admin@tabernadelfaro.com",
                contrasena_hash=hash_password("Admin1234"),
                estado="activo",
                id_rol=1,
                creado_en=ahora,
            ),
            Usuario(
                nombre="Empleado",
                apellido="Principal",
                tipo_documento="CC",
                numero_documento="1000000002",
                telefono="3000000002",
                correo="empleado@tabernadelfaro.com",
                contrasena_hash=hash_password("Employee1234"),
                estado="activo",
                id_rol=2,
                creado_en=ahora,
            ),
            Usuario(
                nombre="Cliente",
                apellido="Principal",
                tipo_documento="CC",
                numero_documento="1000000003",
                telefono="3000000003",
                correo="cliente@tabernadelfaro.com",
                contrasena_hash=hash_password("Customer1234"),
                estado="activo",
                id_rol=3,
                creado_en=ahora,
            ),
        ]
        db.add_all(usuarios)
        db.flush()
        print(f"   [OK] {len(usuarios)} usuarios creados")

        db.commit()
        print("")
        print("[OK] Base de datos reseteada correctamente.")
        print("   Admin    -> admin@tabernadelfaro.com    / Admin1234")
        print("   Empleado -> empleado@tabernadelfaro.com / Employee1234")
        print("   Cliente  -> cliente@tabernadelfaro.com  / Customer1234")


if __name__ == "__main__":
    reset()
