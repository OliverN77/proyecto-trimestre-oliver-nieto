"""Puebla la base configurada con datos mínimos y realistas del restaurante."""

from app.database import SessionLocal, commit_or_conflict
from app.models.mesa import Mesa
from app.models.producto import Producto
from app.models.rol import Rol
from app.models.servicio import Servicio


def poblar():
    with SessionLocal() as db:
        if not db.query(Rol).first():
            db.add_all([Rol(id_rol=1, nombre_rol="Administrador"), Rol(id_rol=2, nombre_rol="Empleado"), Rol(id_rol=3, nombre_rol="Cliente")])
        if not db.query(Mesa).first():
            db.add_all([Mesa(numero_mesa=1, capacidad=2, ubicacion="Terraza", estado="disponible"), Mesa(numero_mesa=2, capacidad=4, ubicacion="Salón", estado="disponible")])
        if not db.query(Producto).first():
            db.add_all([Producto(nombre="Risotto al limón", descripcion="Arroz cremoso con cítricos", precio=28.0, estado="disponible"), Producto(nombre="Lubina al horno", descripcion="Pesca del día", precio=42.0, estado="disponible")])
        if not db.query(Servicio).first():
            db.add_all([Servicio(nombre="Cata de vinos", descripcion="Selección de la casa", precio=35.0, estado="activo"), Servicio(nombre="Cena privada", descripcion="Atención para grupos", precio=120.0, estado="activo")])
        commit_or_conflict(db)


if __name__ == "__main__":
    poblar()