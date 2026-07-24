"use client";

import { useEffect, useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";

const LANGUAGE_NAMES = {
  bash: "Shell / notebook",
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  output: "Expected output",
  python: "Python",
  sql: "SQL",
  text: "Plain text",
};

function highlighted(code, language) {
  const grammar = Prism.languages[language] || Prism.languages.markup || Prism.languages.plain;
  return Prism.highlight(code, grammar, language);
}

function CodePanel({ block }) {
  const [copied, setCopied] = useState(false);
  const lineCount = block.code.split("\n").length;
  const historical = /(?:pip install|gpt-4o|llama-index|openai==|chromadb==)/i.test(block.code);

  return (
    <section className="catalog-code-panel">
      <header>
        <div>
          <b>{block.id}</b>
          <span>{LANGUAGE_NAMES[block.language] || block.language}</span>
          <span className={`block-kind ${block.type}`}>{block.type === "output" ? "RESULT" : "CODE"}</span>
          {historical && <span className="historical-badge">ARCHIVED VERSION</span>}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(block.code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "✓ Copied" : "Copy code"}
        </button>
      </header>
      <div className="catalog-code-scroll">
        <pre className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
        </pre>
        {block.type === "output" ? (
          <pre className="catalog-source output"><code>{block.code}</code></pre>
        ) : (
          <pre className={`catalog-source language-${block.language}`}>
            <code dangerouslySetInnerHTML={{ __html: highlighted(block.code, block.language) }} />
          </pre>
        )}
      </div>
    </section>
  );
}

function BlockExplanation({ block }) {
  return (
    <section className="code-explanation">
      <header><span>SECTION</span><h4>{block.section}</h4><p>{block.purpose}</p></header>
      <div>
        <article><span>LIKE I’M YOUNG</span><p>{block.simple}</p></article>
        <article><span>ENGINEERING VIEW</span><p>{block.engineering}</p></article>
        <article className="warning"><span>WATCH OUT</span><p>{block.watchOut}</p></article>
      </div>
      <footer>
        <span>CONCEPTS</span>
        {block.concepts.map((concept) => <b key={concept}>{concept}</b>)}
      </footer>
    </section>
  );
}

function explainLine(line, type) {
  const trimmed = line.trim();
  if (type === "output") return "A value or message produced by the preceding code.";
  if (/^#/.test(trimmed)) return "A comment for the reader; Python does not execute it.";
  if (/^!?\s*(pip|conda)\s+install/.test(trimmed)) return "Installs named packages in the active notebook or Python environment.";
  if (/^!?(\s)*(curl|wget)\b/.test(trimmed)) return "Downloads a remote resource over HTTP.";
  if (/^(from\s+\S+\s+import|import\s+)/.test(trimmed)) return "Imports reusable names from an installed Python module.";
  if (/^(@|%)/.test(trimmed)) return "A decorator or notebook command that changes how the following code runs.";
  if (/^(async\s+)?def\s+/.test(trimmed)) return "Starts a reusable function and declares the inputs between parentheses.";
  if (/^class\s+/.test(trimmed)) return "Defines a class: a reusable blueprint that groups state and behavior.";
  if (/^return\b/.test(trimmed)) return "Ends the current function and sends this value back to its caller.";
  if (/^(if|elif)\b/.test(trimmed)) return "Runs the indented branch only when this condition is true.";
  if (/^else\s*:/.test(trimmed)) return "Runs the fallback branch when earlier conditions were false.";
  if (/^(for|while)\b/.test(trimmed)) return "Repeats the indented operation for each item or while a condition remains true.";
  if (/^with\b/.test(trimmed)) return "Opens a managed resource and guarantees that it is cleaned up afterward.";
  if (/^try\s*:/.test(trimmed)) return "Starts an operation that may fail so the failure can be handled deliberately.";
  if (/^except\b/.test(trimmed)) return "Handles the matching error instead of crashing without context.";
  if (/^await\b/.test(trimmed)) return "Pauses this async function until the operation completes without blocking other work.";
  if (/^print\s*\(/.test(trimmed)) return "Displays a value so the learner can inspect the current state.";
  if (/^[A-Za-z_][\w.\[\]'"]*\s*=(?!=)/.test(trimmed)) {
    const name = trimmed.split("=", 1)[0].trim();
    return `Creates or replaces \`${name}\` with the value calculated on the right.`;
  }
  if (/(\.create|\.post|\.get|\.query|\.retrieve|\.search)\s*\(/.test(trimmed)) return "Calls an API or component and stores or uses the returned result.";
  if (/^[)\]}},]+$/.test(trimmed)) return "Closes the structure or function call opened on an earlier line.";
  return "Continues the current expression or calls previously prepared logic.";
}

function LineWalkthrough({ block }) {
  const lines = block.code
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.trim());
  return (
    <details className="line-walkthrough" open={lines.length <= 14}>
      <summary><span>LINE-BY-LINE WALKTHROUGH</span><b>{lines.length} active lines</b><i>⌄</i></summary>
      <div>
        {lines.map(({ line, number }) => (
          <article key={number}>
            <i>{number}</i>
            <code>{line.trim()}</code>
            <p>{explainLine(line, block.type)}</p>
          </article>
        ))}
      </div>
    </details>
  );
}

export default function WorkshopCodeExplorer() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [lessonNumber, setLessonNumber] = useState(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/workshops/workshop-01-code-catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setLessonNumber(data.lessons[0]?.number ?? null);
      })
      .catch((reason) => active && setError(reason.message));
    return () => {
      active = false;
    };
  }, []);

  const filteredLessons = useMemo(() => {
    if (!catalog) return [];
    const normalized = query.trim().toLowerCase();
    return catalog.lessons.filter((lesson) => {
      const matchesKind =
        kind === "all" ||
        lesson.blocks.some((block) => block.type === kind);
      const matchesQuery =
        !normalized ||
        lesson.title.toLowerCase().includes(normalized) ||
        lesson.blocks.some((block) =>
          `${block.section} ${block.code} ${block.concepts.join(" ")}`
            .toLowerCase()
            .includes(normalized),
        );
      return matchesKind && matchesQuery;
    });
  }, [catalog, kind, query]);

  const lesson =
    catalog?.lessons.find((item) => item.number === lessonNumber) ||
    filteredLessons[0] ||
    null;
  const visibleBlocks = useMemo(() => {
    if (!lesson) return [];
    const normalized = query.trim().toLowerCase();
    return lesson.blocks.filter((block) => {
      const matchesKind = kind === "all" || block.type === kind;
      const matchesQuery =
        !normalized ||
        `${block.section} ${block.code} ${block.concepts.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return matchesKind && matchesQuery;
    });
  }, [kind, lesson, query]);
  const safeIndex = Math.min(blockIndex, Math.max(0, visibleBlocks.length - 1));
  const block = visibleBlocks[safeIndex];

  function selectLesson(number) {
    setLessonNumber(number);
    setBlockIndex(0);
  }

  if (error) {
    return <div className="catalog-state error"><b>Code catalog could not load.</b><span>{error}</span></div>;
  }
  if (!catalog) {
    return <div className="catalog-state"><i /><b>Loading 796 explained blocks…</b></div>;
  }

  return (
    <div className="code-catalog">
      <header className="catalog-summary">
        <div><span>COMPLETE CODE COMPANION</span><h3>Every code cell, explained</h3><p>Browse the recreated code and its captured results in lesson order. Search by function, library, concept, or exact code.</p></div>
        <aside>
          <div><b>{catalog.stats.codeLessons}</b><span>code lessons</span></div>
          <div><b>{catalog.stats.codeBlocks}</b><span>code blocks</span></div>
          <div><b>{catalog.stats.outputBlocks}</b><span>result blocks</span></div>
          <div><b>{catalog.stats.totalBlocks}</b><span>explained total</span></div>
        </aside>
      </header>

      <div className="catalog-filters">
        <label><span>SEARCH EVERYTHING</span><input value={query} onChange={(event) => { setQuery(event.target.value); setBlockIndex(0); }} placeholder="cosine similarity, Chroma, prompt…" /></label>
        <div>
          {["all", "code", "output"].map((value) => (
            <button className={kind === value ? "active" : ""} onClick={() => { setKind(value); setBlockIndex(0); }} key={value}>
              {value === "all" ? "All blocks" : value === "code" ? "Code only" : "Results only"}
            </button>
          ))}
        </div>
        <span>{filteredLessons.length} lessons match</span>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-lessons">
          {filteredLessons.map((item) => (
            <button className={lesson?.number === item.number ? "active" : ""} onClick={() => selectLesson(item.number)} key={item.number}>
              <i>{String(item.number).padStart(2, "0")}</i>
              <span><b>{item.title}</b><small>{item.codeCount} code · {item.outputCount} results</small></span>
            </button>
          ))}
          {!filteredLessons.length && <p>No lesson contains that search.</p>}
        </aside>

        <main className="catalog-main">
          {lesson && (
            <header className="catalog-lesson-title">
              <span>LESSON {String(lesson.number).padStart(2, "0")}</span>
              <h3>{lesson.title}</h3>
              <p>{visibleBlocks.length} matching blocks · Choose a block below to inspect every line.</p>
            </header>
          )}

          {block ? (
            <>
              <nav className="block-strip" aria-label="Lesson code blocks">
                {visibleBlocks.map((item, index) => (
                  <button className={`${index === safeIndex ? "active" : ""} ${item.type}`} onClick={() => setBlockIndex(index)} key={item.id}>
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <span>{item.section}</span>
                    <b>{item.type === "output" ? "OUT" : item.language.toUpperCase()}</b>
                  </button>
                ))}
              </nav>
              <div className="catalog-block-heading">
                <div><span>BLOCK {safeIndex + 1} OF {visibleBlocks.length}</span><h4>{block.purpose}</h4></div>
                <div><button disabled={safeIndex === 0} onClick={() => setBlockIndex((value) => value - 1)}>←</button><button disabled={safeIndex === visibleBlocks.length - 1} onClick={() => setBlockIndex((value) => value + 1)}>→</button></div>
              </div>
              <CodePanel block={block} />
              <BlockExplanation block={block} />
              <LineWalkthrough block={block} />
            </>
          ) : (
            <div className="catalog-empty">No blocks in this lesson match the current filters.</div>
          )}
        </main>
      </div>
    </div>
  );
}
