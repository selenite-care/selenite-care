import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const nextDevCache = resolve(projectRoot, ".next", "dev");

if (!nextDevCache.startsWith(resolve(projectRoot, ".next"))) {
  throw new Error("Refusing to clean a path outside .next.");
}

rmSync(nextDevCache, { recursive: true, force: true });
