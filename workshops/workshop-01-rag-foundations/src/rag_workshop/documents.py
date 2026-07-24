import json
from pathlib import Path

from .models import Document


def load_json_documents(path: str | Path) -> list[Document]:
    """Load a JSON array and validate the fields required by the workshop."""
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("The knowledge base must be a JSON array.")

    documents: list[Document] = []
    for index, record in enumerate(records):
        missing = {"id", "title", "text", "source"} - record.keys()
        if missing:
            names = ", ".join(sorted(missing))
            raise ValueError(f"Document {index} is missing: {names}")
        documents.append(
            Document(
                id=str(record["id"]),
                title=str(record["title"]),
                text=str(record["text"]),
                source=str(record["source"]),
                metadata=dict(record.get("metadata", {})),
            )
        )
    return documents
