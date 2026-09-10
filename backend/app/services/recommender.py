import json
from pathlib import Path


class LocalRecommender:
    def __init__(self, artifact_path: str):
        self.artifact = json.loads(Path(artifact_path).read_text(encoding="utf-8"))

    def predict(self, preference: str, items: list[dict], limit: int) -> list[dict]:
        terms = set(preference.lower().split())
        scored = []
        for item in items:
            text = f"{item['nombre']} {item.get('descripcion') or ''}".lower()
            score = sum(term in text for term in terms)
            score += self.artifact.get("prioridades", {}).get(item["tipo"], 0)
            scored.append((score, item))
        scored.sort(key=lambda pair: (-pair[0], pair[1]["nombre"]))
        return [item for _, item in scored[:limit]]