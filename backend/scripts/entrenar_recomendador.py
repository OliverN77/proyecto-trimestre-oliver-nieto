"""Entrena fuera de la API el artefacto mínimo usado por recomendaciones."""

import json
from pathlib import Path


def entrenar():
    salida = Path(__file__).parents[1] / "modelos" / "recomendador.json"
    salida.parent.mkdir(exist_ok=True)
    salida.write_text(json.dumps({
        "version": "1.0",
        "metodo": "prioridad_por_tipo_y_coincidencia_de_texto",
        "prioridades": {"producto": 2, "servicio": 1},
    }, indent=2), encoding="utf-8")


if __name__ == "__main__":
    entrenar()