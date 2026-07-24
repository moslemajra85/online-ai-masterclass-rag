from collections.abc import Callable

from .chunking import chunk_documents
from .embeddings import Embedder, HashingEmbedder
from .models import Document, SearchResult
from .vector_store import InMemoryVectorStore

AnswerGenerator = Callable[[str], str]


def build_grounded_prompt(question: str, results: list[SearchResult]) -> str:
    evidence = "\n\n".join(
        f"[{index}] Source: {result.chunk.source}\n{result.chunk.text}"
        for index, result in enumerate(results, start=1)
    )
    return (
        "Answer the question using only the evidence below. "
        'If the evidence is insufficient, say "I do not know based on the supplied evidence." '
        "Cite supporting passages with [1], [2], and so on.\n\n"
        f"EVIDENCE\n{evidence}\n\nQUESTION\n{question}\n\nANSWER"
    )


class RAGPipeline:
    def __init__(self, embedder: Embedder | None = None, store: InMemoryVectorStore | None = None):
        self.embedder = embedder or HashingEmbedder()
        self.store = store or InMemoryVectorStore()

    def index(self, documents: list[Document], chunk_size: int = 45, overlap: int = 10) -> int:
        chunks = chunk_documents(documents, chunk_size=chunk_size, overlap=overlap)
        self.store.add(chunks, self.embedder.embed([chunk.text for chunk in chunks]))
        return len(chunks)

    def retrieve(self, question: str, top_k: int = 3) -> list[SearchResult]:
        query_vector = self.embedder.embed([question])[0]
        return self.store.search(query_vector, top_k=top_k)

    def prepare(self, question: str, top_k: int = 3) -> tuple[str, list[SearchResult]]:
        results = self.retrieve(question, top_k=top_k)
        return build_grounded_prompt(question, results), results

    def answer(
        self, question: str, generator: AnswerGenerator, top_k: int = 3
    ) -> tuple[str, list[SearchResult]]:
        prompt, results = self.prepare(question, top_k=top_k)
        return generator(prompt), results
