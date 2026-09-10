from typing import Generic, TypeVar

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.database import get_db

ModelT = TypeVar("ModelT")


class ResourceById(Generic[ModelT]):
    def __init__(self, model: type[ModelT], resource_name: str, path_parameter: str):
        self.model = model
        self.resource_name = resource_name
        self.path_parameter = path_parameter

    def __call__(self, request: Request, db: Session = Depends(get_db)) -> ModelT:
        resource_id = request.path_params[self.path_parameter]
        resource = db.get(self.model, resource_id)
        if resource is None:
            raise NotFoundError(self.resource_name, resource_id)
        return resource