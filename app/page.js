"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import DiagramLab from "./DiagramLab";
import WorkshopHub from "./WorkshopHub";

const DOCUMENTS = [
  { type: "PDF", title: "Remote Work Policy", body: "Employees may work from home up to three days per week...", pages: "1–5", color: "red" },
  { type: "DOCX", title: "Employee Handbook", body: "Employees are entitled to 25 days of paid vacation per year...", pages: "1–12", color: "blue" },
  { type: "TXT", title: "IT Support Guide", body: "To install Python, download the installer from the official website...", pages: "1–8", color: "green" },
];

const VECTORS = [
  { id: "C-001", vector: [0.9, 0.8, 0.1], source: "Remote Work Policy", page: 1, text: "Employees may work from home up to three days per week." },
  { id: "C-002", vector: [0.85, 0.75, 0.15], source: "Remote Work Policy", page: 1, text: "Three days per week with manager approval." },
  { id: "C-003", vector: [0.7, 0.6, 0.2], source: "Remote Work Policy", page: 2, text: "Remote workers remain available during core hours." },
  { id: "C-004", vector: [0.2, 0.2, 0.3], source: "Employee Handbook", page: 3, text: "Full-time employees receive paid vacation." },
  { id: "C-005", vector: [0.15, 0.85, 0.25], source: "Employee Handbook", page: 4, text: "Benefits are reviewed during onboarding." },
  { id: "C-006", vector: [0.1, 0.2, 0.95], source: "IT Support Guide", page: 2, text: "Contact the help desk for account support." },
];

const QUERY = {
  text: "How many days per week can employees work remotely?",
  vector: [0.95, 0.75, 0.05],
};

const STEP_INFO = [
  ["Document Ingestion", "Raw documents enter the system."],
  ["Chunking", "Documents are split into overlapping chunks."],
  ["Creating Embeddings", "Each chunk becomes a numerical vector."],
  ["Storing in Vector Database", "Vectors, text, and metadata are indexed."],
  ["User Question", "The user asks a natural-language question."],
  ["Similarity Calculation", "The query is compared with every stored vector."],
  ["Top-K Retrieval", "The strongest matching chunks are selected."],
  ["Prompt Construction", "Evidence and question are assembled together."],
  ["LLM Generates Answer", "The grounded prompt is sent to the model."],
  ["Final Answer with Source", "The answer is returned with a citation."],
  ["2D Embedding Space", "A projection shows semantic neighborhoods."],
  ["Full Pipeline Overview", "The complete retrieval and generation loop."],
];

const STEP_DETAILS = [
  { input: "PDF · DOCX · TXT", operation: "load + parse + attach metadata", output: "clean document objects", model: "Ingestion makes different file formats look the same to the rest of the pipeline." },
  { input: "long document text", operation: "split with controlled overlap", output: "small, meaningful chunks", model: "Retrieval works on chunks—not whole documents. Overlap prevents meaning from being cut at a boundary." },
  { input: "one text chunk", operation: "tokenize + encode semantic patterns", output: "dense numerical vector", model: "An embedding is a position in meaning-space. Similar ideas point in similar directions." },
  { input: "vectors + source metadata", operation: "insert and index rows", output: "searchable vector collection", model: "The database keeps the vector for search and the original text for the LLM to read later." },
  { input: "natural-language question", operation: "embed with the same model", output: "query vector", model: "Documents and questions must share one coordinate system before their meanings can be compared." },
  { input: "query vector + all chunk vectors", operation: "calculate cosine similarity", output: "one score per chunk", model: "Cosine similarity compares direction, not wording. A score near 1 means the meanings align closely." },
  { input: "ranked similarity scores", operation: "sort descending + select k", output: "small evidence set", model: "Retrieval is evidence selection. It reduces thousands of candidates to the few chunks worth reading." },
  { input: "instruction + evidence + question", operation: "assemble with clear boundaries", output: "grounded final prompt", model: "The prompt is a contract: what to do, what facts may be used, and which question must be answered." },
  { input: "grounded prompt", operation: "predict answer tokens sequentially", output: "generated response", model: "The LLM still generates probabilistically, but retrieved context constrains the answer toward supplied facts." },
  { input: "generated answer + metadata", operation: "attach source citation", output: "verifiable response", model: "A citation lets the user inspect the evidence. Grounded does not mean automatically correct." },
  { input: "high-dimensional embeddings", operation: "project into two visible dimensions", output: "semantic neighborhood map", model: "The plot is a projection for intuition; the real similarity calculation still uses every embedding dimension." },
  { input: "documents + user question", operation: "retrieve, augment, generate", output: "grounded answer", model: "RAG is two connected systems: a search system chooses evidence, then a language model writes from it." },
];

const STEP_EXPLANATIONS = [
  {
    what: "We may receive a PDF, a Word file, or plain text. A parser opens each file, removes format-specific clutter, reads the words, and records helpful labels such as the filename and page number.",
    why: "Later steps should not care how the information arrived. They need one clean, predictable document shape so the same pipeline can handle every source.",
    analogy: "Think of pouring juice from different bottles into identical cups. The bottles look different, but after pouring, every cup is easy to handle.",
  },
  {
    what: "A long document is cut into small passages called chunks. Neighboring chunks repeat a few words at their edges, so a sentence near a cut is not torn away from its meaning.",
    why: "Searching an entire book for one answer is slow and vague. Small passages let us retrieve the exact part that talks about the user’s question.",
    analogy: "Imagine cutting a long comic into cards. You copy the last picture onto the next card so the story still makes sense when cards are viewed alone.",
  },
  {
    what: "The embedding model reads a chunk and returns a list of numbers. Each number is one coordinate in a very large meaning-map; our animation uses only three so we can see it.",
    why: "Computers compare numbers more reliably than raw sentences. Texts with similar ideas receive vectors that point in similar directions, even when they use different words.",
    analogy: "It is like giving every idea a home address. Ideas about remote work live close together; ideas about computer repair live in another neighborhood.",
  },
  {
    what: "Each chunk becomes one database row containing its vector, original words, filename, and page. A special vector index is built so nearby vectors can be found quickly.",
    why: "We need both halves: the vector helps us find meaning, while the original text gives the LLM real words to read and the metadata gives us a source to cite.",
    analogy: "Think of a library card catalog. The card helps the librarian locate a book, but the card is not the book; we still keep the real pages on the shelf.",
  },
  {
    what: "The user writes an ordinary question. We send that question through the same embedding model used for the documents, producing a query vector in the same meaning-map.",
    why: "We can only compare positions when they use the same map. A vector from a different model would be like mixing street coordinates from two different cities.",
    analogy: "The documents and question must speak to the same translator. That translator turns both into matching map coordinates.",
  },
  {
    what: "The system compares the query vector with every candidate chunk vector. Cosine similarity measures how closely their arrows point in the same direction and gives each pair a score.",
    why: "The score lets us rank meaning, not exact spelling. “Work from home” can match “remote work” because their semantic directions are close.",
    analogy: "Imagine several children pointing toward different playgrounds. The child pointing almost exactly where you point is probably thinking of the same playground.",
  },
  {
    what: "All chunks are sorted from highest similarity to lowest. Top‑K means we keep only the first K winners—in this example, the best two passages—and leave the rest behind.",
    why: "Too little context may miss the answer; too much context adds noise and cost. K is a small evidence budget that we tune for the task.",
    analogy: "It is like choosing the two best clues for a detective instead of dumping the entire evidence room onto the desk.",
  },
  {
    what: "We build one structured message containing the rules, the retrieved passages, and the user’s question. Clear labels tell the LLM which text is instruction and which text is evidence.",
    why: "The LLM needs boundaries. Without them, it may confuse a sentence from a document with an instruction or answer from its general memory instead of the supplied facts.",
    analogy: "It is like handing a student an exam sheet: first the rules, then the reading passage, and finally the question to answer.",
  },
  {
    what: "The LLM reads the complete prompt and predicts the answer one token at a time. Every new token depends on the prompt and all tokens already produced.",
    why: "Retrieval does not write the answer; it supplies evidence. Generation turns those passages into a clear response, but it can still make mistakes, so grounding matters.",
    analogy: "The retriever is a librarian who finds the right pages. The LLM is a writer who reads those pages and explains them in a friendly sentence.",
  },
  {
    what: "The response is paired with the metadata that travelled with the winning chunk. We show the document name, page, and chunk so a person can inspect the original evidence.",
    why: "A confident sentence is not proof. Citations make the answer auditable and help users catch stale, incomplete, or misunderstood source material.",
    analogy: "It is like showing your work in math class. The answer matters, but pointing to the exact page lets someone check how you got it.",
  },
  {
    what: "Real embeddings have hundreds or thousands of dimensions. We carefully project them onto a flat 2D picture, where close dots suggest similar meaning and distant dots suggest different topics.",
    why: "The picture helps our brains see clusters, but it is only a simplified shadow. Retrieval still calculates similarity with every original dimension, not only the two shown.",
    analogy: "A photograph of a globe is flat, but Earth is not. The picture is useful for seeing countries, as long as we remember some shape is lost.",
  },
  {
    what: "First, documents are prepared and stored. At question time, the system embeds the question, searches for evidence, places that evidence in a prompt, and asks the LLM to answer.",
    why: "This separation makes knowledge easier to update. We can change the documents without retraining the LLM, and we can inspect which evidence influenced each answer.",
    analogy: "RAG is a team: a fast librarian finds the right pages, then a careful storyteller explains only what those pages say.",
  },
];

function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function magnitude(vector) {
  return Math.sqrt(dot(vector, vector));
}

function cosine(a, b) {
  return dot(a, b) / (magnitude(a) * magnitude(b));
}

function formatVector(vector) {
  return `[ ${vector.map((value) => value.toFixed(2)).join(", ")} ]`;
}

function FlowArrow({ vertical = false }) {
  return (
    <span className={`flow-arrow ${vertical ? "vertical" : ""}`} aria-hidden="true">
      <i /><i /><i /><b>›</b>
    </span>
  );
}

function BrainIcon({ label = "Embedding Model" }) {
  return (
    <div className="brain-box">
      <svg viewBox="0 0 100 78" role="img" aria-label={label}>
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M49 12 31 22 22 39l9 20 18 8 20-8 9-20-10-17Z" />
          <path d="m31 22 18 16 19-16M22 39h27m29 0H49m0-27v55M31 59l18-20 20 20" />
          <circle cx="49" cy="12" r="4" /><circle cx="31" cy="22" r="4" />
          <circle cx="68" cy="22" r="4" /><circle cx="22" cy="39" r="4" />
          <circle cx="49" cy="39" r="4" /><circle cx="78" cy="39" r="4" />
          <circle cx="31" cy="59" r="4" /><circle cx="49" cy="67" r="4" />
          <circle cx="69" cy="59" r="4" />
        </g>
      </svg>
      <span>{label}</span>
    </div>
  );
}

function VectorAxes({ vector, color = "#8f5cff", compact = false }) {
  const origin = compact ? { x: 28, y: 100 } : { x: 35, y: 128 };
  const scale = compact ? 82 : 104;
  const end = {
    x: origin.x + vector[0] * scale,
    y: origin.y - vector[1] * scale,
  };
  return (
    <svg className="vector-axes" viewBox={compact ? "0 0 150 120" : "0 0 190 150"} role="img" aria-label={`Vector ${formatVector(vector)}`}>
      <defs>
        <marker id={`arrow-${color.replace("#", "")}-${compact}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0 7 3.5 0 7Z" fill={color} />
        </marker>
      </defs>
      <g stroke="#8a9ab0" strokeWidth="1">
        <path d={`M${origin.x} ${origin.y} H${compact ? 142 : 182}`} />
        <path d={`M${origin.x} ${origin.y} V${compact ? 8 : 10}`} />
        <path d={`M${origin.x} ${origin.y} L8 ${compact ? 114 : 144}`} />
      </g>
      <g fill="#aebbc9" fontSize="9">
        <text x={compact ? 143 : 180} y={origin.y - 5}>X</text>
        <text x={origin.x - 7} y="9">Z</text>
        <text x="4" y={compact ? 118 : 147}>Y</text>
      </g>
      <path className="draw-vector" d={`M${origin.x} ${origin.y} L${end.x} ${end.y}`} stroke={color} strokeWidth="3" fill="none" markerEnd={`url(#arrow-${color.replace("#", "")}-${compact})`} />
    </svg>
  );
}

function StepCard({ index, activeStep, children, onSelect }) {
  const [title, subtitle] = STEP_INFO[index];
  return (
    <article
      className={`step-card ${activeStep === index ? "active" : ""} ${activeStep > index ? "visited" : ""}`}
      onClick={() => onSelect(index)}
      data-step={index}
    >
      <header className="card-heading">
        <span className="step-badge">{index + 1}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="card-content">{children}</div>
    </article>
  );
}

function IngestionPanel() {
  return (
    <div className="document-flow">
      <div className="source-files">
        {DOCUMENTS.map((doc) => (
          <div className="document-card" key={doc.title}>
            <span className={`doc-icon ${doc.color}`}>{doc.type.slice(0, 1)}</span>
            <b>{doc.type}</b>
            <strong>{doc.title}</strong>
          </div>
        ))}
      </div>
      <FlowArrow />
      <div className="parser-engine">
        <span className="parser-scan" />
        <b>DOCUMENT PARSER</b>
        <div className="parse-stage"><i>01</i><span>decode file</span></div>
        <div className="parse-stage"><i>02</i><span>extract text</span></div>
        <div className="parse-stage"><i>03</i><span>normalize</span></div>
        <div className="parse-stage"><i>04</i><span>attach metadata</span></div>
      </div>
      <FlowArrow />
      <div className="parsed-object">
        <span>NORMALIZED DOCUMENT</span>
        <code><b>{"{"}</b><br />
          &nbsp;text: <em>“Employees may…”</em>,<br />
          &nbsp;source: <em>“policy.pdf”</em>,<br />
          &nbsp;page: <em>1</em>,<br />
          &nbsp;type: <em>“policy”</em><br />
          <b>{"}"}</b>
        </code>
      </div>
    </div>
  );
}

function ChunkingPanel() {
  return (
    <div className="chunk-layout">
      <div className="source-page">
        <b>Remote Work Policy</b>
        {Array.from({ length: 8 }, (_, index) => <i style={{ "--line": `${92 - (index % 3) * 12}%` }} key={index} />)}
      </div>
      <div className="bracket">{"}"}</div>
      <div className="chunk-stack">
        {[
          "Employees may work from home up to three days...",
          "Three days per week with manager approval...",
          "This policy applies to all full-time employees...",
        ].map((text, index) => (
          <div className={`chunk-box tone-${index}`} key={text}>
            <span>Chunk {index + 1} (p.{index < 2 ? "1" : "2"})</span>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="chunk-settings">
        <p>Chunk size: <b>120 tokens</b></p>
        <p>Overlap: <b>20 tokens</b></p>
        <div className="overlap-bar"><i /><i /><i /><span>Overlap</span></div>
      </div>
    </div>
  );
}

function EmbeddingPanel() {
  return (
    <div className="embedding-flow">
      <div className="text-sample">
        <span>Chunk 1 Text</span>
        <p>Employees may work from home up to three days per week...</p>
      </div>
      <FlowArrow />
      <BrainIcon />
      <FlowArrow />
      <div className="vector-result">
        <span>Vector (3D)</span>
        <code>{formatVector(VECTORS[0].vector)}</code>
        <VectorAxes vector={VECTORS[0].vector} compact />
      </div>
    </div>
  );
}

function DatabasePanel() {
  return (
    <div className="database-layout">
      <div className="vector-table">
        <div className="table-row table-head"><b>ID</b><b>Vector (3D)</b><b>Source</b><b>Page</b></div>
        {VECTORS.map((item) => (
          <div className="table-row" key={item.id}>
            <span>{item.id}</span><code>{formatVector(item.vector)}</code><span>{item.source}</span><span>{item.page}</span>
          </div>
        ))}
      </div>
      <div className="database-symbol">
        <i /><i /><i />
        <span>Stores:</span>
        <ul><li>Vector</li><li>Original text</li><li>Metadata</li></ul>
      </div>
    </div>
  );
}

function QuestionPanel() {
  return (
    <div className="question-layout">
      <div className="question-row">
        <span className="avatar">●</span>
        <div className="speech-bubble">{QUERY.text}</div>
      </div>
      <p>The question is embedded too.</p>
      <div className="query-vector"><span>Query Vector (3D)</span><code>{formatVector(QUERY.vector)}</code></div>
      <VectorAxes vector={QUERY.vector} color="#2badff" compact />
    </div>
  );
}

function SimilarityPanel({ ranked }) {
  return (
    <div className="similarity-layout">
      <div className="formula-box">
        <strong>Q · D</strong>
        <i />
        <strong>|Q| × |D|</strong>
        <p>cos(θ) =</p>
        <small>Q = query vector<br />D = document vector<br />θ = angle between vectors</small>
      </div>
      <div className="similarity-table">
        <h3>Top Similarities</h3>
        <div className="sim-row sim-head"><span>ID</span><span>Cosine</span><span>Score</span></div>
        {ranked.map((item) => (
          <div className="sim-row" key={item.id}>
            <span>{item.id}</span><code>{item.score.toFixed(3)}</code>
            <i><b style={{ "--score": `${item.score * 100}%` }} /></i>
          </div>
        ))}
        <small>Higher score = more similar</small>
      </div>
    </div>
  );
}

function RetrievalPanel({ ranked }) {
  return (
    <div className="retrieval-layout">
      <div className="selected-table">
        <h3>Top 2 (k=2)</h3>
        {ranked.slice(0, 2).map((item, index) => (
          <div key={item.id}><b>{index + 1}</b><span>{item.id}</span><code>{item.score.toFixed(3)}</code><p>{item.text}</p></div>
        ))}
      </div>
      <FlowArrow />
      <div className="dropped-table">
        <h3>Not Selected</h3>
        {ranked.slice(2, 6).map((item, index) => (
          <div key={item.id}><span>{index + 3}</span><span>{item.id}</span><code>{item.score.toFixed(3)}</code></div>
        ))}
      </div>
    </div>
  );
}

function PromptPanel({ ranked }) {
  return (
    <div className="prompt-layout">
      <div className="prompt-parts">
        <div className="system-part"><b>System Instruction</b><p>Answer using only the given context. If you don’t know, say “I don’t know.”</p></div>
        <div className="context-part"><b>Retrieved Context</b>{ranked.slice(0, 2).map((item, index) => <p key={item.id}>[{index + 1}] {item.text}</p>)}</div>
        <div className="question-part"><b>User Question</b><p>{QUERY.text}</p></div>
      </div>
      <div className="prompt-arrows"><span>↗</span><span>→</span><span>↘</span></div>
      <div className="final-prompt">
        <h3>Final Prompt</h3>
        <b>System Instruction:</b><p>Answer only from context.</p>
        <b>Context:</b><p>[1] {ranked[0].text}<br />[2] {ranked[1].text}</p>
        <b>Question:</b><p>{QUERY.text}</p>
      </div>
    </div>
  );
}

function GenerationPanel() {
  return (
    <div className="generation-layout">
      <BrainIcon label="LLM" />
      <FlowArrow />
      <div className="generation-box">
        <span>Generating<span className="typing-dots">...</span></span>
        <i />
        <p>Employees may work</p><p>Employees may work from home</p>
        <p>Employees may work from home up to</p>
        <strong>Employees may work from home up to three days per week.</strong>
      </div>
    </div>
  );
}

function AnswerPanel() {
  return (
    <div className="answer-layout">
      <div className="answer-box">
        <span>Answer:</span>
        <strong>Employees may work from home up to three days per week.</strong>
        <span>Source:</span>
        <p>Remote Work Policy, Page 1 (Chunk 1)</p>
      </div>
      <FlowArrow />
      <div className="source-document">
        <b>Source Document</b><i className="source-highlight" />
        {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  );
}

function EmbeddingSpacePanel() {
  const points = [
    { x: 80, y: 31, id: "C-004", type: "handbook", color: "#f09a2d" },
    { x: 190, y: 32, id: "C-005", type: "handbook", color: "#f09a2d" },
    { x: 333, y: 29, id: "Query", type: formatVector(QUERY.vector), color: "#36adff" },
    { x: 366, y: 59, id: "C-001", type: "remote work", color: "#6bc365" },
    { x: 350, y: 88, id: "C-002", type: "remote work", color: "#6bc365" },
    { x: 220, y: 106, id: "C-003", type: "remote work", color: "#6bc365" },
    { x: 98, y: 142, id: "C-006", type: "IT guide", color: "#9b5cff" },
  ];
  return (
    <svg className="embedding-space" viewBox="0 0 460 180" role="img" aria-label="Two-dimensional projection of document and query embeddings">
      <g className="plot-grid" stroke="#23405c" strokeWidth=".7" strokeDasharray="3 4">
        {[60, 130, 200, 270, 340, 410].map((x) => <path d={`M${x} 10V160`} key={x} />)}
        {[20, 60, 100, 140].map((y) => <path d={`M45 ${y}H430`} key={y} />)}
      </g>
      <path d="M45 10V160H430" stroke="#8b9aad" fill="none" />
      <path className="query-link" d="M333 29 366 59M333 29 350 88M333 29 220 106" fill="none" stroke="#85d45a" strokeDasharray="4 3" />
      {points.map((point) => (
        <g className="plot-point" transform={`translate(${point.x} ${point.y})`} key={point.id}>
          <circle r={point.id === "Query" ? 8 : 6} fill={point.color} />
          <text x="10" y="-2" fill={point.color} fontSize="10">{point.id}</text>
          <text x="10" y="10" fill={point.color} fontSize="8">({point.type})</text>
        </g>
      ))}
      <text x="205" y="176" fill="#a8b5c4" fontSize="8">DIMENSION 1</text>
      <text transform="translate(13 105) rotate(-90)" fill="#a8b5c4" fontSize="8">DIMENSION 2</text>
    </svg>
  );
}

function PipelinePanel() {
  const nodes = [
    ["▤", "Documents"], ["▦", "Chunks"], ["✣", "Embeddings"], ["▱", "Vector DB"],
    ["⌕", "Search"], ["▣", "Top-K Context"], ["◉", "LLM"], ["✓", "Answer"],
  ];
  return (
    <div className="pipeline-map">
      {nodes.map(([icon, label], index) => (
        <div className={`pipeline-node node-${index}`} key={label}>
          <span>{icon}</span><b>{label}</b>
          {index < nodes.length - 1 && <FlowArrow vertical={index >= 4} />}
        </div>
      ))}
    </div>
  );
}

function PanelVisual({ index, ranked }) {
  switch (index) {
    case 0: return <IngestionPanel />;
    case 1: return <ChunkingPanel />;
    case 2: return <EmbeddingPanel />;
    case 3: return <DatabasePanel />;
    case 4: return <QuestionPanel />;
    case 5: return <SimilarityPanel ranked={ranked} />;
    case 6: return <RetrievalPanel ranked={ranked} />;
    case 7: return <PromptPanel ranked={ranked} />;
    case 8: return <GenerationPanel />;
    case 9: return <AnswerPanel />;
    case 10: return <EmbeddingSpacePanel />;
    case 11: return <PipelinePanel />;
    default: return null;
  }
}

export default function Home({ initialMode, initialWorkshopView } = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState(initialMode ?? "lesson");
  const gridRef = useRef(null);

  const ranked = useMemo(
    () => VECTORS.map((item) => ({ ...item, score: cosine(QUERY.vector, item.vector) })).sort((a, b) => b.score - a.score),
    [],
  );

  useEffect(() => {
    if (window.location.hash.startsWith("#workshop-01")) {
      setMode("workshop");
      setPlaying(false);
    } else if (window.location.hash === "#diagram-lab") {
      setMode("diagram");
      setPlaying(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (mode !== "lesson") return undefined;
    const card = gridRef.current?.querySelector(`[data-step="${activeStep}"]`);
    if (!card) return undefined;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      timeline.fromTo(card, { scale: 0.985 }, { scale: 1, duration: 0.38 });

      const animations = {
        0: () => timeline
          .fromTo(card.querySelectorAll(".document-card"), { x: -35, opacity: 0 }, { x: 0, opacity: 1, stagger: .32, duration: .55 })
          .fromTo(card.querySelectorAll(".document-flow > .flow-arrow"), { opacity: 0 }, { opacity: 1, stagger: .4, duration: .3 })
          .fromTo(card.querySelectorAll(".parse-stage"), { x: -15, opacity: 0 }, { x: 0, opacity: 1, stagger: .18, duration: .34 })
          .fromTo(card.querySelector(".parsed-object"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .75 }),
        1: () => timeline
          .fromTo(card.querySelectorAll(".source-page i"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: .08, duration: .28 })
          .fromTo(card.querySelectorAll(".chunk-box"), { x: -28, opacity: 0 }, { x: 0, opacity: 1, stagger: .22, duration: .5 })
          .fromTo(card.querySelectorAll(".overlap-bar i"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: .14, duration: .35 }),
        2: () => timeline
          .fromTo(card.querySelector(".text-sample"), { x: -25, opacity: 0 }, { x: 0, opacity: 1, duration: .45 })
          .fromTo(card.querySelectorAll(".embedding-flow .flow-arrow"), { opacity: 0 }, { opacity: 1, stagger: .45, duration: .3 })
          .fromTo(card.querySelectorAll(".brain-box circle"), { scale: 0, transformOrigin: "center" }, { scale: 1, stagger: .055, duration: .22 })
          .fromTo(card.querySelector(".draw-vector"), { strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: .9 }),
        3: () => timeline
          .fromTo(card.querySelectorAll(".table-row:not(.table-head)"), { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: .16, duration: .35 })
          .fromTo(card.querySelectorAll(".database-symbol > i"), { scaleY: 0, transformOrigin: "top" }, { scaleY: 1, stagger: .12, duration: .3 }),
        4: () => timeline
          .fromTo(card.querySelector(".speech-bubble"), { scale: .4, transformOrigin: "left center", opacity: 0 }, { scale: 1, opacity: 1, duration: .55, ease: "back.out(1.5)" })
          .fromTo(card.querySelector(".query-vector"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .45 })
          .fromTo(card.querySelector(".draw-vector"), { strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: .9 }),
        5: () => timeline
          .fromTo(card.querySelectorAll(".sim-row:not(.sim-head)"), { x: 24, opacity: 0 }, { x: 0, opacity: 1, stagger: .13, duration: .3 })
          .fromTo(card.querySelectorAll(".sim-row i b"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: .11, duration: .45 }),
        6: () => timeline
          .fromTo(card.querySelectorAll(".dropped-table > div"), { opacity: 0, x: 20 }, { opacity: 1, x: 0, stagger: .12, duration: .28 })
          .fromTo(card.querySelectorAll(".selected-table > div"), { x: 90, opacity: 0, backgroundColor: "rgba(100,190,94,.45)" }, { x: 0, opacity: 1, backgroundColor: "rgba(0,0,0,0)", stagger: .3, duration: .65 }),
        7: () => timeline
          .fromTo(card.querySelectorAll(".prompt-parts > div"), { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: .25, duration: .4 })
          .fromTo(card.querySelectorAll(".prompt-arrows span"), { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: .15, duration: .3 })
          .fromTo(card.querySelector(".final-prompt"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .8 }),
        8: () => timeline
          .fromTo(card.querySelectorAll(".brain-box circle"), { scale: 0, transformOrigin: "center" }, { scale: 1, stagger: .04, duration: .2 })
          .fromTo(card.querySelectorAll(".generation-box p, .generation-box strong"), { opacity: 0, x: -9 }, { opacity: 1, x: 0, stagger: .3, duration: .38 }),
        9: () => timeline
          .fromTo(card.querySelector(".answer-box strong"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.15 })
          .fromTo(card.querySelectorAll(".source-document span"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, stagger: .09, duration: .25 }),
        10: () => timeline
          .fromTo(card.querySelectorAll(".plot-point"), { scale: 0, transformOrigin: "center" }, { scale: 1, stagger: .12, duration: .38, ease: "back.out(1.8)" })
          .fromTo(card.querySelector(".query-link"), { strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 1 }),
        11: () => timeline
          .fromTo(card.querySelectorAll(".pipeline-node"), { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, stagger: .2, duration: .4, ease: "back.out(1.5)" }),
      };
      animations[activeStep]?.();
    }, gridRef);
    return () => context.revert();
  }, [activeStep, mode]);

  useLayoutEffect(() => {
    if (!playing || mode !== "lesson") return undefined;
    const timer = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % STEP_INFO.length);
    }, 10000 / speed);
    return () => window.clearTimeout(timer);
  }, [activeStep, playing, speed, mode]);

  function selectStep(index) {
    setActiveStep(index);
    setPlaying(false);
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="header-identity">
          <div className="event-branding">
            <span>ONLINE AI MASTERCLASS</span>
            <b>JULY 29, 2026 · SAUDI AUDIENCE</b>
            <i>Created by Moslem Ajra</i>
          </div>
          <h1>RAG SYSTEM SIMULATION <span>— STEP BY STEP</span></h1>
          <p>See how data flows, transforms, and helps the LLM produce accurate answers.</p>
        </div>
        <div className="mode-switch" aria-label="Workshop mode">
          <button className={mode === "lesson" ? "active" : ""} onClick={() => { setMode("lesson"); window.history.replaceState(null, "", window.location.pathname); }}>▶ Guided Lessons</button>
          <button className={mode === "diagram" ? "active" : ""} onClick={() => { setMode("diagram"); setPlaying(false); window.history.replaceState(null, "", "#diagram-lab"); }}>✣ Diagram Lab</button>
          <button className={mode === "workshop" ? "active" : ""} onClick={() => { setMode("workshop"); setPlaying(false); window.history.replaceState(null, "", "#workshop-01"); }}>⌘ Workshop 01</button>
        </div>
        {mode === "lesson" && <div className="playback-controls">
          <button onClick={() => selectStep(Math.max(0, activeStep - 1))}>◀ <span>Previous</span></button>
          <button onClick={() => selectStep(Math.min(STEP_INFO.length - 1, activeStep + 1))}>▶ <span>Next</span></button>
          <button className={playing ? "control-active" : ""} onClick={() => setPlaying((value) => !value)}>{playing ? "Ⅱ" : "▶"} <span>{playing ? "Pause" : "Play"}</span></button>
          <button onClick={() => { setActiveStep(0); setPlaying(true); }}>↻ <span>Restart</span></button>
          <label>Speed:
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option>
            </select>
          </label>
        </div>}
      </header>

      {mode === "lesson" ? (
        <>
      <div className="playback-progress">
        <span style={{ "--progress": `${((activeStep + 1) / STEP_INFO.length) * 100}%` }} />
        <b>STEP {activeStep + 1} OF {STEP_INFO.length}</b>
      </div>

      <section className="lesson-shell">
        <nav className="pipeline-rail" aria-label="RAG pipeline lessons">
          <span className="rail-label">PIPELINE</span>
          {STEP_INFO.map(([title], index) => (
            <button
              className={`${activeStep === index ? "active" : ""} ${activeStep > index ? "complete" : ""}`}
              onClick={() => selectStep(index)}
              key={title}
            >
              <i>{activeStep > index ? "✓" : String(index + 1).padStart(2, "0")}</i>
              <span>{title}</span>
              {index < STEP_INFO.length - 1 && <b />}
            </button>
          ))}
        </nav>

        <div className="lesson-main" ref={gridRef}>
          <article className="step-view" data-step={activeStep} key={activeStep}>
            <header className="lesson-heading">
              <div>
                <span className="lesson-kicker">LIVE TRANSFORMATION · {String(activeStep + 1).padStart(2, "0")}</span>
                <h2>{STEP_INFO[activeStep][0]}</h2>
                <p>{STEP_INFO[activeStep][1]}</p>
              </div>
              <div className="lesson-status"><i /><span>{playing ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}</span></div>
            </header>

            <div className="lesson-visual">
              <div className="card-content">
                <PanelVisual index={activeStep} ranked={ranked} />
              </div>
            </div>

            <div className="transformation-model">
              <div><span>INPUT</span><strong>{STEP_DETAILS[activeStep].input}</strong></div>
              <b>→</b>
              <div><span>OPERATION</span><strong>{STEP_DETAILS[activeStep].operation}</strong></div>
              <b>→</b>
              <div><span>OUTPUT</span><strong>{STEP_DETAILS[activeStep].output}</strong></div>
            </div>

            <section className="explanation-panel">
              <div className="explanation-title">
                <span>EXPLAIN IT SIMPLY</span>
                <p>{STEP_DETAILS[activeStep].model}</p>
              </div>
              <div className="explanation-grid">
                <article><span>01 · WHAT IS HAPPENING?</span><p>{STEP_EXPLANATIONS[activeStep].what}</p></article>
                <article><span>02 · WHY DO WE NEED IT?</span><p>{STEP_EXPLANATIONS[activeStep].why}</p></article>
                <article className="analogy-card"><span>03 · IMAGINE IT LIKE…</span><p>{STEP_EXPLANATIONS[activeStep].analogy}</p></article>
              </div>
            </section>
          </article>

          <div className="lesson-navigation">
            <button disabled={activeStep === 0} onClick={() => selectStep(activeStep - 1)}>← Previous step</button>
            <div><i style={{ "--progress": `${((activeStep + 1) / STEP_INFO.length) * 100}%` }} /><span>{activeStep + 1} / {STEP_INFO.length}</span></div>
            <button disabled={activeStep === STEP_INFO.length - 1} onClick={() => selectStep(activeStep + 1)}>Next step →</button>
          </div>
        </div>
      </section>

      <aside className="presenter-note">
        <span>WORKSHOP NOTE</span>
        The vectors are intentionally simplified to three dimensions. Production embedding models use hundreds or thousands of dimensions, but cosine similarity is calculated the same way.
      </aside>
        </>
      ) : mode === "diagram" ? <DiagramLab /> : <WorkshopHub initialView={initialWorkshopView} />}
      <footer className="site-signature">
        <span>ONLINE AI MASTERCLASS · JULY 29, 2026</span>
        <b>Created by Moslem Ajra</b>
        <i>Prepared for our Saudi audience</i>
      </footer>
    </main>
  );
}
