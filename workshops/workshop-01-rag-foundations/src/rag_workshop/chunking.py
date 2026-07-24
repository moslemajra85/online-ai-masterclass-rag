from .models import Chunk, Document


def chunk_document(document: Document, chunk_size: int = 45, overlap: int = 10) -> list[Chunk]:
    """Split a document by words while repeating context at each boundary."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be at least 0 and smaller than chunk_size.")

    words = document.text.split()
    if not words:
        return []

    chunks: list[Chunk] = []
    step = chunk_size - overlap
    for start in range(0, len(words), step):
        end = min(start + chunk_size, len(words))
        chunks.append(
            Chunk(
                id=f"{document.id}:chunk-{len(chunks):03d}",
                document_id=document.id,
                text=" ".join(words[start:end]),
                source=document.source,
                start_word=start,
                end_word=end,
            )
        )
        if end == len(words):
            break
    return chunks


def chunk_documents(
    documents: list[Document], chunk_size: int = 45, overlap: int = 10
) -> list[Chunk]:
    return [
        chunk
        for document in documents
        for chunk in chunk_document(document, chunk_size=chunk_size, overlap=overlap)
    ]
