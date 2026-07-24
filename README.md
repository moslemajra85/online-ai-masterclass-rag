# Online AI Masterclass — Inside RAG

Created by **Moslem Ajra** for an online AI masterclass serving a Saudi audience
on **July 29, 2026**.

An interactive teaching site for seeing a retrieval-augmented generation system
transform data step by step.

## Masterclass

- **Creator:** Moslem Ajra
- **Format:** Online, instructor-led
- **Audience:** Saudi Arabia
- **Date:** July 29, 2026
- **Subject:** Practical RAG engineering, from embeddings to grounded answers

## Experiences

- **Guided Lessons** — twelve animated stages from ingestion to cited answer.
- **Diagram Lab** — a draw.io-style whiteboard with generic and RAG-specific shapes,
  inline text editing, styling, multi-selection, clipboard, history, and JSON files.
- **Workshop 01** — an eight-module curriculum linked to a runnable Python/Jupyter
  project in `workshops/workshop-01-rag-foundations`, plus a searchable companion
  containing every code and captured-output block from the supplied HTML archive.

## Web application

```bash
npm install
npm run dev
npm run build
```

The production build uses vinext and generates deployable Cloudflare Worker output
under `dist/`. `scripts/prepare-workshop-assets.mjs` publishes the workshop source as
static learning materials before each development or production build.

## Python workshop

```bash
cd workshops/workshop-01-rag-foundations
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev,notebook]"
rag-lab "How many remote days are allowed?"
pytest
```

The default path is local and deterministic. An external embedding provider is an
optional adapter, so participants can learn and test the full retrieval path without
an account, network connection, or API key.

## Refreshing the supplied code catalog

The generated catalog is committed so deployment never depends on a private mounted
folder. Re-run the neutral importer only when the supplied HTML archive changes:

```bash
python -m pip install -r scripts/requirements-import.txt
python scripts/import-workshop-html.py "/path/to/HTML"
```

The importer extracts executable cells and captured outputs, assigns lesson/section
context, neutralizes attribution and owner-specific links, and writes
`workshops/workshop-01-code-catalog.json`.

## Verification

```bash
npm run build
npm audit
cd workshops/workshop-01-rag-foundations
PYTHONPATH=src python -m pytest -q
```

The local system cannot run Cloudflare's `workerd` binary when its host glibc is too
old. That does not affect the production build; deployed smoke tests cover the Worker
runtime.

## Publishing to GitHub

The repository includes a CI workflow that builds the web application, audits
production dependencies, and runs the Python workshop tests on every pull request.

```bash
git remote add github https://github.com/OWNER/REPOSITORY.git
git push -u github main
```

Replace `OWNER/REPOSITORY` with the final GitHub location. A software license has not
been assumed; select and add the intended license before making the repository public.
