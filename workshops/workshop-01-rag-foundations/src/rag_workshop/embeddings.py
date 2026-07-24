import hashlib
import math
import re
from collections.abc import Sequence
from typing import Protocol

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in",
    "is", "it", "many", "of", "on", "or", "that", "the", "this", "to", "was", "what",
}


class Embedder(Protocol):
    def embed(self, texts: Sequence[str]) -> list[list[float]]: ...


def _normalize(vector: list[float]) -> list[float]:
    length = math.sqrt(sum(value * value for value in vector))
    return vector if length == 0 else [value / length for value in vector]


class HashingEmbedder:
    """A deterministic, dependency-free baseline for seeing vector mechanics."""

    def __init__(self, dimensions: int = 256):
        if dimensions < 8:
            raise ValueError("dimensions must be at least 8.")
        self.dimensions = dimensions

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            vector = [0.0] * self.dimensions
            for raw_token in re.findall(r"[a-z0-9]+", text.lower()):
                token = _normalize_token(raw_token)
                if not token or token in STOP_WORDS:
                    continue
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                bucket = int.from_bytes(digest[:4], "big") % self.dimensions
                sign = 1.0 if digest[4] % 2 == 0 else -1.0
                vector[bucket] += sign
            vectors.append(_normalize(vector))
        return vectors


def _normalize_token(token: str) -> str:
    """Apply a tiny, visible stemmer—not a replacement for semantic embeddings."""
    if token.endswith("ly") and len(token) > 5:
        token = token[:-2]
    if token.endswith("ed") and len(token) > 5:
        token = token[:-2]
    if token.endswith("s") and len(token) > 4:
        token = token[:-1]
    return token


class OpenAIEmbedder:
    """Optional hosted adapter. Importing the core workshop never requires OpenAI."""

    def __init__(self, model: str = "text-embedding-3-small"):
        try:
            from openai import OpenAI
        except ImportError as error:
            raise RuntimeError('Install the optional dependency with: pip install -e ".[openai]"') from error
        self.model = model
        self.client = OpenAI()

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        cleaned = [text.replace("\n", " ").strip() for text in texts]
        if any(not text for text in cleaned):
            raise ValueError("Embedding inputs cannot be empty.")
        response = self.client.embeddings.create(model=self.model, input=cleaned)
        return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
