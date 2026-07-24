"""Create the neutral Workshop 01 code catalog from a SingleFile HTML archive.

Run manually when the supplied archive changes:

    python scripts/import-workshop-html.py "/path/to/HTML"

The generated JSON is committed so production builds do not depend on a private
filesystem path.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag

OUTPUT_PATH = Path("workshops/workshop-01-code-catalog.json")
OWNER_PATTERNS = [
    (re.compile(r"Ala\s*Falaki", re.IGNORECASE), "workshop-maintainers"),
    (re.compile(r"Towards\s*AI", re.IGNORECASE), "Workshop Library"),
    (re.compile(r"towardsai\.net", re.IGNORECASE), "example.com"),
    (
        re.compile(
            r"https://raw\.githubusercontent\.com/[^/\s]+/tutorial_notebooks/main/data/"
            r"mini-llama-articles(?:-with_embeddings)?\.csv",
            re.IGNORECASE,
        ),
        "https://example.com/workshop-data/knowledge-base.csv",
    ),
    (
        re.compile(r"github\.com/[^/\s]+/tutorial_notebooks", re.IGNORECASE),
        "github.com/workshop-labs/rag-foundations",
    ),
]


def neutralize(value: str) -> str:
    for pattern, replacement in OWNER_PATTERNS:
        value = pattern.sub(replacement, value)
    return value.strip()


def language_of(pre: Tag) -> str:
    for class_name in pre.get("class", []):
        if class_name.startswith("language-"):
            language = class_name.removeprefix("language-")
            return {"shell": "bash", "sh": "bash", "plaintext": "text"}.get(language, language)
    return "output"


def concepts_for(code: str, language: str) -> list[str]:
    haystack = code.lower()
    concepts: list[str] = []
    rules = [
        ("installation", ("pip install", "conda install")),
        ("configuration", ("api_key", "load_dotenv", "os.environ")),
        ("HTTP API", ("requests.", "httpx.", "curl ", "wget ")),
        ("data loading", ("read_csv", "json.load", "csv.reader", "open(")),
        ("chunking", ("chunk_size", "text_splitter", "split_into_chunks")),
        ("embeddings", ("embedding", "embed_model")),
        ("similarity", ("cosine", "dot_product", "similarities")),
        ("vector database", ("chromadb", "vectorstore", "vector_store")),
        ("retrieval", ("retriev", "top_k", "similarity_search")),
        ("prompting", ("system_prompt", "messages", "prompt")),
        ("generation", ("chat.completions", "responses.create", "generate_content")),
        ("evaluation", ("evaluate", "faithfulness", "hit_rate", "mrr")),
        ("web scraping", ("beautifulsoup", "firecrawl", "scrape")),
        ("API service", ("fastapi", "@app.", "uvicorn")),
        ("user interface", ("gradio", "interface(", "chatinterface")),
        ("agents and tools", ("agent", "tool_call", "function_call")),
        ("fine-tuning", ("trainer", "fine_tun", "lora", "peft")),
        ("audio", ("audio", "transcri", "speech")),
    ]
    for name, needles in rules:
        if any(needle in haystack for needle in needles):
            concepts.append(name)
    if language == "output":
        concepts.insert(0, "expected output")
    return concepts[:5] or ["Python fundamentals" if language == "python" else language]


def explanation_for(code: str, language: str, section: str) -> dict[str, str]:
    lower = code.lower()
    concepts = concepts_for(code, language)
    if language == "output":
        return {
            "purpose": "Inspect the expected result",
            "simple": "This is what the computer printed after the previous code ran. Compare it with your result to see whether you are on the same path.",
            "engineering": "Treat captured output as an example, not a permanent assertion. Model responses, timestamps, network messages, scores, and package output can change between runs.",
            "watchOut": "Do not paste this block into Python. Re-run the preceding code and compare structure and meaning rather than expecting every character to match.",
        }
    if "pip install" in lower:
        return {
            "purpose": "Install the libraries required by this lesson",
            "simple": "This fills the project’s toolbox with packages that the next cells need.",
            "engineering": "Run installation inside the workshop virtual environment. Historical version pins are preserved for traceability, but a fresh project should verify compatible current versions and lock them after testing.",
            "watchOut": "A leading `!` is Jupyter syntax. In a terminal, remove it. Avoid installing into the global Python environment.",
        }
    if "api_key" in lower or "os.environ" in lower or "load_dotenv" in lower:
        return {
            "purpose": "Configure credentials for external services",
            "simple": "The program needs a private key, like a password, before a service will answer it.",
            "engineering": "Load secrets from `.env`, the shell, or a managed secret store. SDK clients normally read provider-specific environment variables when they are created.",
            "watchOut": "Never paste a real key into a notebook, screenshot, Git commit, browser bundle, or workshop recording.",
        }
    if "requests." in lower or "curl " in lower or "wget " in lower:
        return {
            "purpose": "Send or download data over HTTP",
            "simple": "The code asks another computer for information and waits for the reply.",
            "engineering": "The request has an endpoint, headers or authentication, a payload, and a response. Production code also needs timeouts, status checks, retries with limits, and careful logging.",
            "watchOut": "Workshop data URLs may be neutral placeholders. Prefer the included local dataset when running offline.",
        }
    if any(term in lower for term in ("embedding", "embed_model")):
        return {
            "purpose": "Turn text into vectors that can be compared",
            "simple": "The embedding model gives each piece of text a numerical address in a map of meaning.",
            "engineering": "Use the same embedding model and dimensions for stored chunks and incoming queries. Persist the text, vector, stable ID, and source metadata together.",
            "watchOut": "Changing the embedding model requires re-embedding the stored corpus. Never compare vectors from incompatible models.",
        }
    if any(term in lower for term in ("cosine", "similarit", "top_k", "retriev")):
        return {
            "purpose": "Score and retrieve the most relevant evidence",
            "simple": "The program compares the question with every candidate and keeps the strongest matches.",
            "engineering": "Similarity search ranks candidates; top-k limits the evidence budget. Evaluate retrieval separately from the final generated answer so weak search is not mistaken for an LLM failure.",
            "watchOut": "A high similarity score means semantically close, not automatically correct, current, authorized, or sufficient.",
        }
    if any(term in lower for term in ("prompt", "messages", "chat.completions", "responses.create")):
        return {
            "purpose": "Assemble instructions and ask a language model",
            "simple": "The prompt is the model’s worksheet: rules first, evidence next, and the question last.",
            "engineering": "Keep system instructions separate from untrusted retrieved text. Require an insufficient-evidence response and retain source IDs so citations can be verified.",
            "watchOut": "Model names and SDK endpoints in archived lessons can age. Confirm the current API before using this block in a new application.",
        }
    if any(term in lower for term in ("read_csv", "csv.reader", "json.load", "open(")):
        return {
            "purpose": "Load and shape source data",
            "simple": "The code opens the knowledge box and turns each stored item into a shape the pipeline understands.",
            "engineering": "Validate encoding, required columns, empty records, stable IDs, and provenance at the ingestion boundary. Bad inputs should fail with a precise message.",
            "watchOut": "Relative paths are resolved from the process working directory. Run from the project root or construct paths from the module location.",
        }
    if re.search(r"\bdef\s+\w+\s*\(", code):
        return {
            "purpose": "Package one responsibility into a reusable function",
            "simple": "A function is a named recipe. Give it ingredients, and it returns a result.",
            "engineering": "Read its parameters as inputs, the body as the transformation, and `return` as its output contract. Isolate external calls so the logic remains testable.",
            "watchOut": "Test empty input, malformed data, network failures, and boundary values—not only the happy example.",
        }
    return {
        "purpose": f"Implement the next operation in “{section}”",
        "simple": "Read this block from top to bottom: it prepares values, performs one transformation, and keeps the result for the next stage.",
        "engineering": f"The main ideas in this block are {', '.join(concepts)}. Track which names are created here and which ones depend on an earlier cell.",
        "watchOut": "Notebook cells share hidden state. If a name is missing, restart the kernel and run the lesson in order instead of repeatedly patching the current session.",
    }


def lesson_title(path: Path) -> str:
    return neutralize(re.sub(r"^\d+\.\s*", "", path.stem))


def import_archive(root: Path) -> dict:
    lessons = []
    total_code = 0
    total_output = 0

    paths = sorted(root.glob("*.html"), key=lambda path: int(path.name.split(".", 1)[0]))
    for path in paths:
        number = int(path.name.split(".", 1)[0])
        outer = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        iframe = outer.find("iframe")
        if not iframe or not iframe.get("srcdoc"):
            continue
        page = BeautifulSoup(html.unescape(iframe["srcdoc"]), "html.parser")
        blocks = []
        section = lesson_title(path)

        for element in page.find_all(["h1", "h2", "h3", "h4", "pre"]):
            if element.name != "pre":
                heading = neutralize(element.get_text(" ", strip=True))
                if heading:
                    section = heading
                continue

            code = neutralize(element.get_text().replace("\u00a0", " ").strip())
            if not code:
                continue
            language = language_of(element)
            explanation = explanation_for(code, language, section)
            block_type = "output" if language == "output" else "code"
            total_output += block_type == "output"
            total_code += block_type == "code"
            blocks.append(
                {
                    "id": f"L{number:02d}-B{len(blocks) + 1:02d}",
                    "section": neutralize(section),
                    "language": language,
                    "type": block_type,
                    "code": code,
                    "concepts": concepts_for(code, language),
                    **explanation,
                }
            )

        if blocks:
            lessons.append(
                {
                    "number": number,
                    "title": lesson_title(path),
                    "blocks": blocks,
                    "codeCount": sum(block["type"] == "code" for block in blocks),
                    "outputCount": sum(block["type"] == "output" for block in blocks),
                }
            )

    return {
        "schemaVersion": 1,
        "title": "Workshop 01 Code Companion",
        "description": "Neutral, explained code catalog recreated from the supplied workshop archive.",
        "stats": {
            "sourceLessons": len(paths),
            "codeLessons": len(lessons),
            "codeBlocks": total_code,
            "outputBlocks": total_output,
            "totalBlocks": total_code + total_output,
        },
        "lessons": lessons,
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import-workshop-html.py /path/to/HTML")
    root = Path(sys.argv[1]).expanduser()
    if not root.is_dir():
        raise SystemExit(f"Archive directory not found: {root}")
    catalog = import_archive(root)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Wrote {catalog['stats']['totalBlocks']} blocks from "
        f"{catalog['stats']['codeLessons']} code-bearing lessons to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
