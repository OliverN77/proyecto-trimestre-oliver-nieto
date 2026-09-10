class DomainError(Exception):
    pass


class NotFoundError(DomainError):
    def __init__(self, recurso: str, identificador):
        super().__init__(f"{recurso} con id {identificador} no encontrado")


class ConflictError(DomainError):
    pass


class CredencialesInvalidasError(DomainError):
    def __init__(self):
        super().__init__("Correo o contraseña incorrectos")


class AuthorizationError(DomainError):
    def __init__(self, mensaje: str = "No tienes permisos para esta operación"):
        super().__init__(mensaje)
