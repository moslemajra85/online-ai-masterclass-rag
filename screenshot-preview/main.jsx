import React from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import "../app/globals.css";
import Home from "../app/page.js";

const hash = window.location.hash;
const initialMode = hash === "#diagram-lab" ? "diagram" : hash.startsWith("#workshop-01") ? "workshop" : "lesson";
const initialWorkshopView = hash === "#workshop-01-code" ? "code" : "curriculum";

createRoot(document.getElementById("root")).render(
  <Home initialMode={initialMode} initialWorkshopView={initialWorkshopView} />,
);
