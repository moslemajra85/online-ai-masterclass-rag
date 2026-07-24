"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";

const TOOLBOX = [
  {
    title: "General",
    items: [
      ["text", "Text", "T", "text", "#8fa9bd"],
      ["rectangle", "Rectangle", "▭", "rectangle", "#43c7f4"],
      ["rounded", "Rounded box", "▢", "rounded", "#9b7cff"],
      ["circle", "Circle", "○", "circle", "#38bdf8"],
      ["diamond", "Decision", "◇", "diamond", "#f4a32c"],
      ["hexagon", "Process", "⬡", "hexagon", "#35c6df"],
      ["cylinder", "Database", "▱", "cylinder", "#2f98f5"],
      ["cloud", "Cloud", "☁", "cloud", "#8aa5bc"],
      ["note", "Note", "✎", "note", "#ffca58"],
      ["frame", "Container", "□", "frame", "#647b90"],
    ],
  },
  {
    title: "People & systems",
    items: [
      ["user", "User", "●", "rounded", "#38bdf8"],
      ["team", "Team", "●●", "rounded", "#d07aff"],
      ["browser", "Application", "▣", "rounded", "#43c7f4"],
      ["api", "API", "{ }", "hexagon", "#35c6df"],
      ["service", "Service", "⚙", "rounded", "#9b7cff"],
      ["queue", "Queue", "≡", "cylinder", "#f4a32c"],
      ["shield", "Guardrail", "◇", "diamond", "#ffca58"],
    ],
  },
  {
    title: "AI & RAG",
    items: [
      ["document", "Document", "▤", "note", "#f05b68"],
      ["chunk", "Text chunk", "▦", "rectangle", "#f4a32c"],
      ["embedding", "Embedding", "✣", "hexagon", "#9b6cff"],
      ["vector", "Vector", "[ ]", "rectangle", "#b187ff"],
      ["retriever", "Retriever", "⌕", "diamond", "#35c6df"],
      ["prompt", "Prompt", "≣", "note", "#d07aff"],
      ["llm", "GPT / LLM", "◎", "circle", "#3ed3b6"],
      ["answer", "Answer", "✓", "rounded", "#73cf62"],
      ["evaluation", "Evaluation", "★", "hexagon", "#ffca58"],
    ],
  },
].map((group) => ({
  ...group,
  items: group.items.map(([kind, label, icon, shape, color]) => ({
    kind,
    label,
    icon,
    shape,
    color,
  })),
}));

const ALL_ITEMS = TOOLBOX.flatMap((group) => group.items);
const DEFAULT_STYLE = {
  fill: "#0a1d2d",
  stroke: "#43c7f4",
  textColor: "#f2f6f9",
  fontSize: 12,
  fontWeight: 600,
  textAlign: "center",
};

const TEMPLATES = {
  full: {
    nodes: [
      ["user", "User question", 30, 170],
      ["embedding", "Query embedding", 240, 170],
      ["retriever", "Similarity search", 460, 170],
      ["cylinder", "Vector database", 460, 360],
      ["prompt", "Prompt + context", 680, 170],
      ["llm", "GPT / LLM", 900, 170],
      ["answer", "Grounded answer", 1110, 170],
      ["document", "Source documents", 30, 360],
      ["chunk", "Chunk + embed", 240, 360],
    ],
    links: [[0, 1], [1, 2], [2, 4], [3, 2], [4, 5], [5, 6], [7, 8], [8, 3]],
  },
  ingestion: {
    nodes: [
      ["document", "PDF / DOCX / TXT", 60, 220],
      ["service", "Parse + normalize", 300, 220],
      ["chunk", "Overlapping chunks", 550, 220],
      ["embedding", "Chunk embeddings", 800, 220],
      ["cylinder", "Vector database", 1050, 220],
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  retrieval: {
    nodes: [
      ["user", "User question", 70, 180],
      ["embedding", "Query vector", 310, 180],
      ["retriever", "Cosine similarity", 550, 180],
      ["cylinder", "Stored vectors", 550, 390],
      ["chunk", "Top-k evidence", 790, 180],
      ["prompt", "Grounded prompt", 1030, 180],
    ],
    links: [[0, 1], [1, 2], [3, 2], [2, 4], [4, 5]],
  },
  blank: { nodes: [], links: [] },
};

function toolboxItem(kind) {
  return ALL_ITEMS.find((item) => item.kind === kind) ?? ALL_ITEMS[1];
}

function nodeData(item, label = item.label) {
  return {
    kind: item.kind,
    label,
    icon: item.icon,
    shape: item.shape,
    ...DEFAULT_STYLE,
    stroke: item.color,
    textColor: item.kind === "text" ? "#f2f6f9" : DEFAULT_STYLE.textColor,
  };
}

function makeTemplate(name) {
  const template = TEMPLATES[name];
  const seed = Date.now();
  const nodes = template.nodes.map(([kind, label, x, y], index) => {
    const item = toolboxItem(kind);
    return {
      id: `node-${seed}-${index}`,
      type: "diagramNode",
      position: { x, y },
      data: nodeData(item, label),
    };
  });
  const edges = template.links.map(([source, target], index) => ({
    id: `edge-${seed}-${index}`,
    source: nodes[source].id,
    target: nodes[target].id,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#43c7f4" },
    style: { stroke: "#43c7f4", strokeWidth: 2 },
  }));
  return { nodes, edges };
}

function DiagramNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const { updateNodeData } = useReactFlow();
  const isText = data.shape === "text";
  const style = {
    "--node-fill": data.fill,
    "--node-stroke": data.stroke,
    "--node-text": data.textColor,
    "--node-font-size": `${data.fontSize}px`,
    "--node-font-weight": data.fontWeight,
    "--node-text-align": data.textAlign,
  };

  return (
    <div
      className={`diagram-node shape-${data.shape} ${selected ? "selected" : ""}`}
      style={style}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      {!isText && <Handle type="target" position={Position.Left} />}
      <div className="diagram-node-surface">
        {!isText && <span className="diagram-node-icon">{data.icon}</span>}
        {editing ? (
          <textarea
            autoFocus
            className="nodrag"
            value={data.label}
            onChange={(event) => updateNodeData(id, { label: event.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape" || (event.key === "Enter" && !event.shiftKey)) {
                event.preventDefault();
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="diagram-node-label">{data.label}</span>
        )}
      </div>
      {!isText && (
        <>
          <Handle type="source" position={Position.Right} />
          <Handle className="vertical-handle" type="target" position={Position.Top} id="top" />
          <Handle className="vertical-handle" type="source" position={Position.Bottom} id="bottom" />
        </>
      )}
    </div>
  );
}

function DiagramCanvas() {
  const initial = useMemo(() => makeTemplate("full"), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);
  const [edgeMode, setEdgeMode] = useState("animated");
  const [edgeColor, setEdgeColor] = useState("#43c7f4");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("Ready");
  const clipboardRef = useRef(null);
  const importRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const dragSnapshotRef = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id));
  const primaryNode = selectedNodes[0] ?? null;
  const selectedEdges = edges.filter((edge) => selectedEdgeIds.includes(edge.id));

  const snapshot = useCallback(
    () => ({ nodes: structuredClone(nodes), edges: structuredClone(edges) }),
    [edges, nodes],
  );

  const remember = useCallback((state = snapshot()) => {
    historyRef.current = [...historyRef.current.slice(-39), state];
    futureRef.current = [];
  }, [snapshot]);

  const restore = useCallback((state) => {
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    window.setTimeout(() => fitView({ padding: 0.18, duration: 350 }), 20);
  }, [fitView, setEdges, setNodes]);

  const undo = useCallback(() => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    futureRef.current.push(snapshot());
    restore(previous);
    setNotice("Undid last action");
  }, [restore, snapshot]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(snapshot());
    restore(next);
    setNotice("Redid action");
  }, [restore, snapshot]);

  const edgeConfig = useCallback(() => {
    const shared = {
      style: { stroke: edgeColor, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      label: edgeLabel,
      labelStyle: { fill: "#dce8f1", fontSize: 10 },
      labelBgStyle: { fill: "#071725", fillOpacity: 0.92 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 3,
    };
    const configs = {
      animated: { ...shared, type: "smoothstep", animated: true },
      curved: { ...shared, type: "default", animated: false },
      straight: { ...shared, type: "straight", animated: false },
      dashed: {
        ...shared,
        type: "smoothstep",
        animated: false,
        style: { ...shared.style, strokeDasharray: "7 6" },
      },
      bidirectional: {
        ...shared,
        type: "smoothstep",
        animated: true,
        markerStart: { type: MarkerType.ArrowClosed, color: edgeColor },
      },
      plain: { ...shared, type: "smoothstep", animated: false, markerEnd: undefined },
    };
    return configs[edgeMode];
  }, [edgeColor, edgeLabel, edgeMode]);

  const onConnect = useCallback((connection) => {
    remember();
    setEdges((current) =>
      addEdge({ ...connection, id: `edge-${crypto.randomUUID()}`, ...edgeConfig() }, current),
    );
  }, [edgeConfig, remember, setEdges]);

  const loadTemplate = useCallback((name) => {
    remember();
    const template = makeTemplate(name);
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setNotice(name === "blank" ? "Started a blank canvas" : `Loaded ${name} template`);
    window.setTimeout(() => fitView({ padding: 0.18, duration: 500 }), 30);
  }, [fitView, remember, setEdges, setNodes]);

  const updateSelectedNodes = useCallback((patch) => {
    if (!selectedNodeIds.length) return;
    remember();
    setNodes((current) =>
      current.map((node) =>
        selectedNodeIds.includes(node.id)
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
    );
  }, [remember, selectedNodeIds, setNodes]);

  const copySelection = useCallback(() => {
    const copiedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id));
    if (!copiedNodes.length) return;
    const nodeIds = new Set(copiedNodes.map((node) => node.id));
    const copiedEdges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );
    clipboardRef.current = {
      nodes: structuredClone(copiedNodes),
      edges: structuredClone(copiedEdges),
    };
    setNotice(`Copied ${copiedNodes.length} item${copiedNodes.length === 1 ? "" : "s"}`);
  }, [edges, nodes, selectedNodeIds]);

  const pasteSelection = useCallback(() => {
    if (!clipboardRef.current?.nodes.length) return;
    remember();
    const idMap = new Map();
    const copies = clipboardRef.current.nodes.map((node) => {
      const id = `node-${crypto.randomUUID()}`;
      idMap.set(node.id, id);
      return {
        ...node,
        id,
        selected: true,
        position: { x: node.position.x + 35, y: node.position.y + 35 },
        data: { ...node.data },
      };
    });
    const copiedEdges = clipboardRef.current.edges.map((edge) => ({
      ...edge,
      id: `edge-${crypto.randomUUID()}`,
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
      selected: false,
    }));
    const newIds = copies.map((node) => node.id);
    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      ...copies,
    ]);
    setEdges((current) => [...current.map((edge) => ({ ...edge, selected: false })), ...copiedEdges]);
    setSelectedNodeIds(newIds);
    setNotice(`Pasted ${copies.length} item${copies.length === 1 ? "" : "s"}`);
  }, [remember, setEdges, setNodes]);

  const deleteSelection = useCallback(() => {
    if (!selectedNodeIds.length && !selectedEdgeIds.length) return;
    remember();
    const removedNodes = new Set(selectedNodeIds);
    setNodes((current) => current.filter((node) => !removedNodes.has(node.id)));
    setEdges((current) =>
      current.filter(
        (edge) =>
          !selectedEdgeIds.includes(edge.id) &&
          !removedNodes.has(edge.source) &&
          !removedNodes.has(edge.target),
      ),
    );
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setNotice("Deleted selection");
  }, [remember, selectedEdgeIds, selectedNodeIds, setEdges, setNodes]);

  const selectAll = useCallback(() => {
    setNodes((current) => current.map((node) => ({ ...node, selected: true })));
    setSelectedNodeIds(nodes.map((node) => node.id));
    setNotice(`Selected ${nodes.length} items`);
  }, [nodes, setNodes]);

  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelection();
      } else if (command && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteSelection();
      } else if (command && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
      } else if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      } else if (command && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteSelection();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copySelection, deleteSelection, pasteSelection, redo, selectAll, undo]);

  useEffect(() => {
    const saved = window.localStorage.getItem("rag-diagram-lab-v2");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        setNotice("A saved canvas is available");
      }
    } catch {
      window.localStorage.removeItem("rag-diagram-lab-v2");
    }
  }, []);

  function addItem(item, position = { x: 180, y: 140 }) {
    remember();
    const id = `node-${crypto.randomUUID()}`;
    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      { id, type: "diagramNode", position, selected: true, data: nodeData(item) },
    ]);
    setSelectedNodeIds([id]);
    setNotice(`Added ${item.label}`);
  }

  function onDrop(event) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/diagram-node");
    if (!raw) return;
    const item = JSON.parse(raw);
    addItem(item, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }

  function saveLocal() {
    window.localStorage.setItem("rag-diagram-lab-v2", JSON.stringify({ nodes, edges }));
    setNotice("Canvas saved in this browser");
  }

  function loadLocal() {
    const raw = window.localStorage.getItem("rag-diagram-lab-v2");
    if (!raw) {
      setNotice("No saved canvas found");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw new Error();
      remember();
      restore(parsed);
      setNotice("Saved canvas restored");
    } catch {
      setNotice("Saved canvas is invalid");
    }
  }

  function exportDiagram() {
    const blob = new Blob([JSON.stringify({ version: 2, nodes, edges }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rag-diagram.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Diagram exported");
  }

  function importDiagram(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((raw) => {
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw new Error();
        remember();
        restore(parsed);
        setNotice(`Imported ${file.name}`);
      } catch {
        setNotice("That file is not a valid diagram");
      }
    });
    event.target.value = "";
  }

  return (
    <div className="diagram-workbench">
      <aside className="diagram-palette">
        <div className="palette-heading">
          <span>SHAPES & ICONS</span>
          <p>Drag or click an item to add it.</p>
          <input
            aria-label="Search shapes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tools…"
          />
        </div>
        <div className="palette-groups">
          {TOOLBOX.map((group) => {
            const items = group.items.filter((item) =>
              `${item.label} ${item.kind}`.toLowerCase().includes(search.toLowerCase()),
            );
            if (!items.length) return null;
            return (
              <section key={group.title}>
                <h3>{group.title}</h3>
                <div className="palette-items">
                  {items.map((item) => (
                    <button
                      draggable
                      onClick={() => addItem(item)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("application/diagram-node", JSON.stringify(item));
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      key={item.kind}
                      title={`Add ${item.label}`}
                    >
                      <i style={{ "--item-color": item.color }}>{item.icon}</i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <div className="palette-help">
          <span>SHORTCUTS</span>
          <p><kbd>⌘/Ctrl C</kbd> copy · <kbd>V</kbd> paste · <kbd>A</kbd> select all · <kbd>Z</kbd> undo · <kbd>Del</kbd> remove</p>
          <p>Double-click any shape to edit its text.</p>
        </div>
      </aside>

      <section className="diagram-stage">
        <header className="diagram-toolbar">
          <div className="toolbar-row file-tools">
            <button onClick={undo} title="Undo (Ctrl/⌘ Z)">↶ Undo</button>
            <button onClick={redo} title="Redo (Ctrl/⌘ Shift Z)">↷ Redo</button>
            <span className="toolbar-divider" />
            <button onClick={copySelection} disabled={!selectedNodeIds.length}>Copy</button>
            <button onClick={pasteSelection} disabled={!clipboardRef.current}>Paste</button>
            <button onClick={deleteSelection} disabled={!selectedNodeIds.length && !selectedEdgeIds.length}>Delete</button>
            <span className="toolbar-divider" />
            <button onClick={saveLocal}>Save</button>
            <button onClick={loadLocal}>Open</button>
            <button onClick={exportDiagram}>Export</button>
            <button onClick={() => importRef.current?.click()}>Import</button>
            <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importDiagram} />
            <span className="toolbar-notice">{notice}</span>
          </div>

          <div className="toolbar-row style-tools">
            <div className="template-buttons">
              <span>STARTER</span>
              <button onClick={() => loadTemplate("full")}>Full RAG</button>
              <button onClick={() => loadTemplate("ingestion")}>Ingestion</button>
              <button onClick={() => loadTemplate("retrieval")}>Retrieval</button>
              <button onClick={() => loadTemplate("blank")}>Blank</button>
            </div>

            <div className="node-tools">
              <input
                aria-label="Selected shape text"
                disabled={selectedNodes.length !== 1}
                value={selectedNodes.length === 1 ? primaryNode.data.label : ""}
                onChange={(event) => {
                  const label = event.target.value;
                  setNodes((current) =>
                    current.map((node) =>
                      node.id === primaryNode.id ? { ...node, data: { ...node.data, label } } : node,
                    ),
                  );
                }}
                onFocus={() => remember()}
                placeholder={selectedNodes.length > 1 ? `${selectedNodes.length} shapes selected` : "Select a shape"}
              />
              <label title="Fill color">Fill<input type="color" disabled={!selectedNodes.length} value={primaryNode?.data.fill ?? "#0a1d2d"} onChange={(event) => updateSelectedNodes({ fill: event.target.value })} /></label>
              <label title="Border color">Line<input type="color" disabled={!selectedNodes.length} value={primaryNode?.data.stroke ?? "#43c7f4"} onChange={(event) => updateSelectedNodes({ stroke: event.target.value })} /></label>
              <label title="Text color">Text<input type="color" disabled={!selectedNodes.length} value={primaryNode?.data.textColor ?? "#f2f6f9"} onChange={(event) => updateSelectedNodes({ textColor: event.target.value })} /></label>
              <select aria-label="Font size" disabled={!selectedNodes.length} value={primaryNode?.data.fontSize ?? 12} onChange={(event) => updateSelectedNodes({ fontSize: Number(event.target.value) })}>
                {[10, 12, 14, 16, 20, 24, 30].map((size) => <option value={size} key={size}>{size}px</option>)}
              </select>
              <button className={primaryNode?.data.fontWeight === 700 ? "active" : ""} disabled={!selectedNodes.length} onClick={() => updateSelectedNodes({ fontWeight: primaryNode?.data.fontWeight === 700 ? 400 : 700 })}>B</button>
              {["left", "center", "right"].map((alignment) => (
                <button className={primaryNode?.data.textAlign === alignment ? "active" : ""} disabled={!selectedNodes.length} onClick={() => updateSelectedNodes({ textAlign: alignment })} key={alignment}>{alignment === "left" ? "≡←" : alignment === "right" ? "→≡" : "≡"}</button>
              ))}
            </div>

            <div className="edge-tools">
              <label>ARROW
                <select value={edgeMode} onChange={(event) => setEdgeMode(event.target.value)}>
                  <option value="animated">Animated flow</option>
                  <option value="curved">Curved</option>
                  <option value="straight">Straight</option>
                  <option value="dashed">Dashed</option>
                  <option value="bidirectional">Two-way</option>
                  <option value="plain">No arrow</option>
                </select>
              </label>
              <input aria-label="New arrow label" value={edgeLabel} onChange={(event) => setEdgeLabel(event.target.value)} placeholder="Arrow label" />
              <input aria-label="New arrow color" type="color" value={edgeColor} onChange={(event) => setEdgeColor(event.target.value)} />
            </div>
          </div>
        </header>

        <div
          className="react-flow-wrap"
          onDrop={onDrop}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={{ diagramNode: DiagramNode }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={({ nodes: chosenNodes, edges: chosenEdges }) => {
              setSelectedNodeIds(chosenNodes.map((node) => node.id));
              setSelectedEdgeIds(chosenEdges.map((edge) => edge.id));
            }}
            onNodeDragStart={() => {
              dragSnapshotRef.current = snapshot();
            }}
            onNodeDragStop={() => {
              if (dragSnapshotRef.current) remember(dragSnapshotRef.current);
              dragSnapshotRef.current = null;
            }}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            selectionOnDrag
            panOnDrag={[1, 2]}
            multiSelectionKeyCode={["Meta", "Control", "Shift"]}
            deleteKeyCode={null}
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#24445e" />
            <Controls position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => node.data.fill || "#0a1d2d"}
              maskColor="rgba(2, 12, 22, .78)"
              position="bottom-right"
            />
          </ReactFlow>
          <div className="canvas-hint">DRAG TO SELECT · DOUBLE-CLICK TO EDIT · CONNECT WITH HANDLES</div>
        </div>
      </section>
    </div>
  );
}

export default function DiagramLab() {
  return (
    <ReactFlowProvider>
      <section className="diagram-lab">
        <header className="diagram-intro">
          <div><span>WORKSHOP WHITEBOARD</span><h2>Architecture Diagram Lab</h2></div>
          <p>Sketch freely with general shapes, then switch to purpose-built RAG components when the explanation needs technical precision.</p>
          <div className="diagram-capabilities"><b>25 shapes</b><b>Multi-select</b><b>Clipboard</b><b>Undo / redo</b><b>JSON save</b></div>
        </header>
        <DiagramCanvas />
      </section>
    </ReactFlowProvider>
  );
}
