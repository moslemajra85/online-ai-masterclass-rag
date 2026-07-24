import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("workshops/workshop-01-rag-foundations");
const destination = resolve("public/workshops/workshop-01-rag-foundations");
const catalogSource = resolve("workshops/workshop-01-code-catalog.json");
const catalogDestination = resolve("public/workshops/workshop-01-code-catalog.json");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, {
  recursive: true,
  filter(path) {
    return ![".venv", "__pycache__", ".pytest_cache", ".ruff_cache"].some((name) =>
      path.split(/[\\/]/).includes(name),
    );
  },
});
await cp(catalogSource, catalogDestination);
