"use client";

import { useEffect, useMemo, useState } from "react";
import WorkshopCodeExplorer from "./WorkshopCodeExplorer";

const MODULES = [
  {
    id: "01",
    title: "Build the mental model",
    duration: "20 min",
    output: "A hand-drawn RAG request flow",
    simple: "RAG is a two-person team. A librarian finds useful pages; a writer reads those pages and explains the answer.",
    deep: "Separate retrieval from generation. The retriever ranks existing evidence. The language model receives that evidence inside its prompt and produces new text. Keeping those responsibilities separate makes failures easier to diagnose.",
    checks: ["Name the retrieval and generation phases", "Explain why RAG is not model training", "Identify where citations come from"],
  },
  {
    id: "02",
    title: "Prepare the Python workspace",
    duration: "25 min",
    output: "A reproducible `.venv` and notebook kernel",
    simple: "A virtual environment is a private toolbox for this project. It stops tools from different projects getting mixed together.",
    deep: "Create the environment with the same Python interpreter that will run the code. Install the package in editable mode so notebook imports resolve to `src/`, then select that environment as the VS Code interpreter and Jupyter kernel.",
    checks: ["Create and activate `.venv`", "Install editable dev and notebook extras", "Run the CLI and tests"],
  },
  {
    id: "03",
    title: "Load clean documents",
    duration: "30 min",
    output: "Validated `Document` objects with sources",
    simple: "PDFs, pages, and notes wear different clothes. We turn them into the same simple uniform: an ID, a title, words, and a source.",
    deep: "Ingestion should preserve traceability. The text is used for retrieval and generation; source and metadata travel with it so authorization, filtering, debugging, and citations remain possible later.",
    checks: ["Reject malformed records", "Keep stable document IDs", "Never discard source metadata"],
  },
  {
    id: "04",
    title: "Chunk with overlap",
    duration: "40 min",
    output: "Small passages with visible boundaries",
    simple: "We cut a long story into cards. A few words repeat between cards so a fact does not fall through the crack.",
    deep: "Chunk size trades precision against context. Very large chunks retrieve extra noise; very small chunks can lose meaning. Overlap reduces boundary loss but increases storage and duplicate evidence.",
    checks: ["Visualize start and end positions", "Test overlap at a boundary", "Compare two chunk sizes"],
  },
  {
    id: "05",
    title: "Create embeddings",
    duration: "45 min",
    output: "One normalized vector per chunk",
    simple: "An embedding gives an idea a numerical address. Ideas that resemble each other should receive nearby addresses.",
    deep: "The included hashing embedder is deterministic and dependency-free, which makes every number inspectable and every test stable. It is a learning baseline, not a semantic production model. The optional adapter shows how to swap providers behind the same interface.",
    checks: ["Inspect vector dimensions", "Explain normalization", "State the baseline’s semantic limitation"],
  },
  {
    id: "06",
    title: "Rank with cosine similarity",
    duration: "40 min",
    output: "A sorted table of query/chunk scores",
    simple: "Imagine arrows pointing toward ideas. Cosine similarity asks which arrows point in almost the same direction.",
    deep: "Compute the dot product divided by both vector magnitudes. Score every stored chunk, sort descending, and keep top-k. The workshop uses exact linear search for clarity; large systems use specialized indexes.",
    checks: ["Calculate a two-dimensional example", "Handle a zero vector", "Verify highest score is first"],
  },
  {
    id: "07",
    title: "Build a grounded prompt",
    duration: "35 min",
    output: "Instructions + numbered evidence + question",
    simple: "We give the writer rules, the best pages, and the question in clearly labeled boxes.",
    deep: "Prompt boundaries reduce ambiguity but do not guarantee truth. Require an explicit insufficient-evidence response and numbered citations. Treat retrieved text as untrusted data because documents can contain instructions or malicious content.",
    checks: ["Separate instructions from evidence", "Define fallback behavior", "Keep citation numbers stable"],
  },
  {
    id: "08",
    title: "Evaluate the complete pipeline",
    duration: "50 min",
    output: "Retrieval checks and grounded-answer cases",
    simple: "We make a quiz with known answers. Then we check whether the librarian found the right page and whether the writer used it correctly.",
    deep: "Measure retrieval and generation separately. Retrieval tests should assert relevant source coverage and ranking. Answer tests should check support, citation correctness, refusal when evidence is missing, latency, and cost.",
    checks: ["Create answerable and unanswerable cases", "Test retrieval independently", "Record failures before tuning"],
  },
];

const SETUP = {
  venv: `cd workshops/workshop-01-rag-foundations
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,notebook]"`,
  run: `rag-lab "How many remote days are allowed?"
pytest
jupyter lab notebooks/01_rag_from_scratch.ipynb`,
  pipeline: `pipeline = RAGPipeline()
pipeline.index(documents, chunk_size=45, overlap=10)

prompt, results = pipeline.prepare(
    "How many remote days are allowed?",
    top_k=2,
)

for result in results:
    print(result.score, result.chunk.source)`,
};

function CopyCode({ children }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="workshop-code">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(children);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre><code>{children}</code></pre>
    </div>
  );
}

export default function WorkshopHub({ initialView } = {}) {
  const [activeModule, setActiveModule] = useState(0);
  const [view, setView] = useState(initialView ?? "curriculum");
  const progress = useMemo(() => Math.round(((activeModule + 1) / MODULES.length) * 100), [activeModule]);
  const module = MODULES[activeModule];

  useEffect(() => {
    if (window.location.hash === "#workshop-01-code") setView("code");
  }, []);

  function selectView(nextView) {
    setView(nextView);
    const hash = nextView === "code" ? "#workshop-01-code" : "#workshop-01";
    window.history.replaceState(null, "", hash);
  }

  return (
    <section className="workshop-hub">
      <header className="workshop-hero">
        <div>
          <span>ONLINE AI MASTERCLASS · JULY 29, 2026 · WORKSHOP 01</span>
          <h2>RAG Foundations: Build Every Transformation</h2>
          <p>Move from a folder of text to ranked evidence and a grounded prompt. Every stage is small enough to inspect, test, and explain.</p>
          <div className="workshop-byline"><b>Created by Moslem Ajra</b><span>For our Saudi audience</span></div>
        </div>
        <aside>
          <b>4h 45m</b><span>guided work</span>
          <b>8</b><span>learning modules</span>
          <b>0</b><span>required API keys</span>
        </aside>
      </header>

      <nav className="workshop-tabs" aria-label="Workshop sections">
        <button className={view === "curriculum" ? "active" : ""} onClick={() => selectView("curriculum")}>Curriculum</button>
        <button className={view === "setup" ? "active" : ""} onClick={() => selectView("setup")}>Developer setup</button>
        <button className={view === "project" ? "active" : ""} onClick={() => selectView("project")}>Python project</button>
        <button className={view === "code" ? "active" : ""} onClick={() => selectView("code")}>All code · 796 blocks</button>
        <a href="/workshops/workshop-01-rag-foundations/README.md" target="_blank" rel="noreferrer">Open lab guide ↗</a>
      </nav>

      {view === "curriculum" && (
        <div className="curriculum-layout">
          <aside className="module-rail">
            <div className="module-progress"><i style={{ width: `${progress}%` }} /><span>{progress}% previewed</span></div>
            {MODULES.map((item, index) => (
              <button className={index === activeModule ? "active" : ""} onClick={() => setActiveModule(index)} key={item.id}>
                <i>{item.id}</i>
                <span><b>{item.title}</b><small>{item.duration}</small></span>
              </button>
            ))}
          </aside>
          <article className="module-detail">
            <header><span>MODULE {module.id} · {module.duration}</span><h3>{module.title}</h3><p>Deliverable: {module.output}</p></header>
            <div className="explain-levels">
              <section><span>EXPLAIN IT TO A YOUNG LEARNER</span><p>{module.simple}</p></section>
              <section><span>ENGINEERING MODEL</span><p>{module.deep}</p></section>
            </div>
            <section className="module-checks">
              <span>YOU CAN MOVE ON WHEN YOU CAN…</span>
              {module.checks.map((check) => <p key={check}><i>✓</i>{check}</p>)}
            </section>
            <div className="module-navigation">
              <button disabled={activeModule === 0} onClick={() => setActiveModule((value) => value - 1)}>← Previous</button>
              <button disabled={activeModule === MODULES.length - 1} onClick={() => setActiveModule((value) => value + 1)}>Next module →</button>
            </div>
          </article>
        </div>
      )}

      {view === "setup" && (
        <div className="setup-view">
          <article>
            <span>PATH A · VS CODE + JUPYTER</span>
            <h3>One environment, one interpreter, one kernel</h3>
            <ol>
              <li>Install Python 3.11+ and the VS Code Python and Jupyter extensions.</li>
              <li>Create `.venv` inside the workshop directory.</li>
              <li>Select `.venv` with <b>Python: Select Interpreter</b>.</li>
              <li>Open the notebook and choose that same environment as its kernel.</li>
            </ol>
            <CopyCode>{SETUP.venv}</CopyCode>
          </article>
          <article>
            <span>VERIFY BEFORE LEARNING</span>
            <h3>Catch setup mistakes immediately</h3>
            <p>The CLI shows ranked evidence and the exact final prompt. The test suite proves chunk overlap, vector ranking, and retrieval behavior before a hosted model enters the system.</p>
            <CopyCode>{SETUP.run}</CopyCode>
          </article>
        </div>
      )}

      {view === "project" && (
        <div className="project-view">
          <div className="project-tree">
            <span>PROJECT MAP</span>
            <pre>{`workshop-01-rag-foundations/
├── data/knowledge_base.json
├── notebooks/01_rag_from_scratch.ipynb
├── src/rag_workshop/
│   ├── chunking.py
│   ├── embeddings.py
│   ├── vector_store.py
│   └── pipeline.py
├── tests/
├── .env.example
├── pyproject.toml
└── README.md`}</pre>
          </div>
          <article>
            <span>SMALLEST COMPLETE FLOW</span>
            <h3>Index once, retrieve per question</h3>
            <p>The orchestration layer depends on a tiny embedder interface. Replace the local implementation with a hosted adapter without rewriting chunking, storage, prompt construction, or tests.</p>
            <CopyCode>{SETUP.pipeline}</CopyCode>
            <div className="project-decisions">
              <p><b>Local first</b> — no network or paid key blocks the workshop.</p>
              <p><b>Exact search</b> — slow at scale, excellent for seeing every score.</p>
              <p><b>Provider boundary</b> — optional OpenAI embeddings stay replaceable.</p>
            </div>
          </article>
        </div>
      )}

      {view === "code" && <WorkshopCodeExplorer />}

      {view !== "code" && <footer className="workshop-roadmap">
        <div><span>NOW</span><b>Workshop 01 · Foundations</b><small>Runnable</small></div>
        <i />
        <div className="future"><span>NEXT</span><b>Workshop 02 · Production retrieval</b><small>Reserved</small></div>
        <i />
        <div className="future"><span>LATER</span><b>Workshop 03 · Evaluation & observability</b><small>Reserved</small></div>
      </footer>}
    </section>
  );
}
