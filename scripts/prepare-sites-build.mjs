import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const hostingSource = resolve(projectRoot, ".openai", "hosting.json");
const hostingTargetDirectory = resolve(projectRoot, "dist", ".openai");
const hostingTarget = resolve(hostingTargetDirectory, "hosting.json");

await mkdir(hostingTargetDirectory, { recursive: true });
await copyFile(hostingSource, hostingTarget);

console.log("Prepared Sites metadata in dist/.openai/hosting.json");
