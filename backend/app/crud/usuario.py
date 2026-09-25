from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, CredencialesInvalidasError, NotFoundError
from app.core.security import hash_password, verify_password
from app.database import commit_or_conflict
from app.models.usuario import Usuario
from app.models.recuperacion import SolicitudRecuperacion
from app.models.reserva import Reserva
from app.schemas.usuario import UsuarioAdminCreate, UsuarioAdminUpdate, UsuarioCreate, UsuarioUpdate

ROLES = {"Administrador": 1, "Empleado": 2, "Cliente": 3}


def obtener_usuario(db: Session, id_usuario: int) -> Usuario:
    usuario = db.get(Usuario, id_usuario)
    if usuario is None:
        raise NotFoundError("Usuario", id_usuario)
    return usuario


def listar_usuarios(db: Session, skip: int = 0, limit: int = 20, rol: str | None = None):
    stmt = select(Usuario)
    if rol:
        stmt = stmt.join(Usuario.rol).where(Usuario.rol.has(nombre_rol=rol))
    return db.scalars(stmt.offset(skip).limit(limit)).all()


def crear_usuario(db: Session, datos: UsuarioCreate, id_rol_cliente: int) -> Usuario:
    existe = db.scalar(
        select(Usuario).where(
            (Usuario.correo == datos.correo)
            | (Usuario.numero_documento == datos.numero_documento)
        )
    )
    if existe:
        raise ConflictError("Ya existe un usuario con ese correo o número de documento")

    usuario = Usuario(
        nombre=datos.nombre,
        apellido=datos.apellido,
        tipo_documento=datos.tipo_documento,
        numero_documento=datos.numero_documento,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=str(datos.correo),
        contrasena_hash=hash_password(datos.contrasena),
        id_rol=id_rol_cliente,
    )
    db.add(usuario)
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def crear_usuario_admin(db: Session, datos: UsuarioAdminCreate) -> Usuario:
    if datos.rol not in ROLES:
        raise ConflictError("Rol inválido")
    existe = db.scalar(select(Usuario).where((Usuario.correo == datos.correo) | (Usuario.numero_documento == datos.numero_documento)))
    if existe:
        raise ConflictError("Ya existe un usuario con ese correo o número de documento")
    usuario = Usuario(
        nombre=datos.nombre, apellido=datos.apellido, tipo_documento=datos.tipo_documento,
        numero_documento=datos.numero_documento, direccion=datos.direccion, telefono=datos.telefono,
        correo=str(datos.correo), contrasena_hash=hash_password(datos.contrasena), id_rol=ROLES[datos.rol], estado="activo",
    )
    db.add(usuario)
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def actualizar_usuario(db: Session, id_usuario: int, datos: UsuarioUpdate) -> Usuario:
    usuario = obtener_usuario(db, id_usuario)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(usuario, campo, valor)
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def actualizar_usuario_admin(db: Session, id_usuario: int, datos: UsuarioAdminUpdate) -> Usuario:
    usuario = obtener_usuario(db, id_usuario)
    cambios = datos.model_dump(exclude_unset=True)
    rol = cambios.pop("rol", None)
    contrasena = cambios.pop("contrasena", None)
    
    # Check for unique constraints if correo or numero_documento are being updated
    correo_nuevo = cambios.get("correo")
    numero_doc_nuevo = cambios.get("numero_documento")
    if correo_nuevo or numero_doc_nuevo:
        query = select(Usuario).where(Usuario.id_usuario != id_usuario)
        condiciones = []
        if correo_nuevo:
            condiciones.append(Usuario.correo == correo_nuevo)
        if numero_doc_nuevo:
            condiciones.append(Usuario.numero_documento == numero_doc_nuevo)
        
        from sqlalchemy import or_
        existe = db.scalar(query.where(or_(*condiciones)))
        if existe:
            raise ConflictError("Ya existe otro usuario con ese correo o número de documento")

    if rol is not None:
        if rol not in ROLES:
            raise ConflictError("Rol inválido")
        usuario.id_rol = ROLES[rol]
    if contrasena:
        usuario.contrasena_hash = hash_password(contrasena)
    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def cambiar_rol(db: Session, id_usuario: int, rol: str) -> Usuario:
    usuario = obtener_usuario(db, id_usuario)
    if rol not in ROLES:
        raise ConflictError("Rol inválido")
    usuario.id_rol = ROLES[rol]
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def cambiar_estado(db: Session, id_usuario: int, nuevo_estado: str) -> Usuario:
    usuario = obtener_usuario(db, id_usuario)
    if nuevo_estado not in {"activo", "inactivo"}:
        raise ConflictError("El estado debe ser activo o inactivo")
    usuario.estado = nuevo_estado
    commit_or_conflict(db)
    db.refresh(usuario)
    return usuario


def eliminar_usuario(db: Session, id_usuario: int) -> None:
    usuario = obtener_usuario(db, id_usuario)
    
    # Check for associated recovery requests
    solicitud = db.scalar(select(SolicitudRecuperacion).where(SolicitudRecuperacion.id_usuario == id_usuario).limit(1))
    if solicitud:
        raise ConflictError("No se puede eliminar el usuario porque tiene solicitudes de recuperación de contraseña asociadas.")
        
    # Check for associated reservations (as client or employee)
    reserva = db.scalar(select(Reserva).where((Reserva.id_cliente == id_usuario) | (Reserva.id_empleado == id_usuario)).limit(1))
    if reserva:
        raise ConflictError("No se puede eliminar el usuario porque está asociado a una o más reservaciones.")

    db.delete(usuario)
    db.commit()


def autenticar_usuario(db: Session, correo: str, contrasena: str) -> Usuario:
    # Explicit prepared statement implementation to prevent SQL Injection
    query = text("SELECT * FROM usuarios WHERE correo = :correo")
    # Bind parameters securely (SQLAlchemy handles the actual parameterization with the DB driver)
    usuario = db.scalars(select(Usuario).from_statement(query).params(correo=correo)).first()

    if usuario is None or not verify_password(contrasena, usuario.contrasena_hash):
        raise CredencialesInvalidasError()
    if usuario.estado != "activo":
        raise CredencialesInvalidasError()
    return usuario
