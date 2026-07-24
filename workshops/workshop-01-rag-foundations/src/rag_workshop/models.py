from dataclasses import dataclass, field


@dataclass(frozen=True)
class Document:
    id: str
    title: str
    text: str
    source: str
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class Chunk:
    id: str
    document_id: str
    text: str
    source: str
    start_word: int
    end_word: int


@dataclass(frozen=True)
class SearchResult:
    chunk: Chunk
    score: float
