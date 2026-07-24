import pytest

from rag_workshop.chunking import chunk_document
from rag_workshop.models import Document


def make_document(text: str) -> Document:
    return Document(id="doc", title="Test", text=text, source="test.md")


def test_chunking_preserves_overlap() -> None:
    chunks = chunk_document(make_document("one two three four five six seven"), 4, 2)

    assert [chunk.text for chunk in chunks] == [
        "one two three four",
        "three four five six",
        "five six seven",
    ]


def test_chunking_rejects_overlap_that_cannot_advance() -> None:
    with pytest.raises(ValueError, match="smaller"):
        chunk_document(make_document("one two"), chunk_size=2, overlap=2)
