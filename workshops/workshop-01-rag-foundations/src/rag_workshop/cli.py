import argparse
from pathlib import Path

from .documents import load_json_documents
from .pipeline import RAGPipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect each stage of a small RAG retriever.")
    parser.add_argument("question", nargs="?", default="How many remote days are allowed?")
    parser.add_argument("--top-k", type=int, default=2)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    documents = load_json_documents(project_root / "data" / "knowledge_base.json")
    pipeline = RAGPipeline()
    chunk_count = pipeline.index(documents, chunk_size=45, overlap=10)
    prompt, results = pipeline.prepare(args.question, top_k=args.top_k)

    print(f"Indexed {chunk_count} chunks from {len(documents)} documents.\n")
    print("RANKED EVIDENCE")
    for rank, result in enumerate(results, start=1):
        print(f"{rank}. score={result.score:.3f} source={result.chunk.source}")
        print(f"   {result.chunk.text}\n")
    print("GROUNDED PROMPT")
    print(prompt)


if __name__ == "__main__":
    main()
