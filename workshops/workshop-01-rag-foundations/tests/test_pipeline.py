from rag_workshop.documents import load_json_documents
from rag_workshop.pipeline import RAGPipeline


def test_pipeline_retrieves_remote_work_policy() -> None:
    documents = load_json_documents("data/knowledge_base.json")
    pipeline = RAGPipeline()
    pipeline.index(documents, chunk_size=32, overlap=8)

    prompt, results = pipeline.prepare("How many remote days per week are allowed?", top_k=1)

    assert results[0].chunk.document_id == "remote-work"
    assert "three days" in prompt
    assert "Source: policies/remote-work.md" in prompt
    assert "If the evidence is insufficient" in prompt
