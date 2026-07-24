import math

from .models import Chunk, SearchResult


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Vectors must have the same number of dimensions.")
    left_size = math.sqrt(sum(value * value for value in left))
    right_size = math.sqrt(sum(value * value for value in right))
    if left_size == 0 or right_size == 0:
        return 0.0
    dot_product = sum(a * b for a, b in zip(left, right, strict=True))
    return dot_product / (left_size * right_size)


class InMemoryVectorStore:
    """Exact search: clear enough to teach, too slow for a large production index."""

    def __init__(self) -> None:
        self._rows: list[tuple[Chunk, list[float]]] = []
        self._dimensions: int | None = None

    def add(self, chunks: list[Chunk], vectors: list[list[float]]) -> None:
        if len(chunks) != len(vectors):
            raise ValueError("Every chunk must have exactly one vector.")
        for chunk, vector in zip(chunks, vectors, strict=True):
            if self._dimensions is None:
                self._dimensions = len(vector)
            if len(vector) != self._dimensions:
                raise ValueError("All stored vectors must have the same dimensions.")
            self._rows.append((chunk, vector))

    def search(self, query_vector: list[float], top_k: int = 3) -> list[SearchResult]:
        if top_k <= 0:
            raise ValueError("top_k must be positive.")
        ranked = [
            SearchResult(chunk=chunk, score=cosine_similarity(query_vector, vector))
            for chunk, vector in self._rows
        ]
        return sorted(ranked, key=lambda result: result.score, reverse=True)[:top_k]

    def __len__(self) -> int:
        return len(self._rows)
