import pytest

from rag_workshop.models import Chunk
from rag_workshop.vector_store import InMemoryVectorStore, cosine_similarity


def make_chunk(identifier: str) -> Chunk:
    return Chunk(identifier, "doc", identifier, "source.md", 0, 1)


def test_cosine_similarity_compares_direction() -> None:
    assert cosine_similarity([1.0, 0.0], [2.0, 0.0]) == pytest.approx(1.0)
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)


def test_store_returns_highest_score_first() -> None:
    store = InMemoryVectorStore()
    store.add([make_chunk("near"), make_chunk("far")], [[1.0, 0.0], [0.0, 1.0]])

    results = store.search([0.9, 0.1], top_k=2)

    assert [result.chunk.id for result in results] == ["near", "far"]
