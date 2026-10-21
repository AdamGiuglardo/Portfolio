import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundleDir = resolve(root, "react-build");
const outputDir = resolve(root, "assets/react");
const bundlePath = resolve(bundleDir, "portfolio-react.js");
const cssPath = resolve(bundleDir, "portfolio-react.css");
const bundle = await readFile(bundlePath);
const version = createHash("sha256").update(bundle).digest("hex").slice(0, 10);

await mkdir(outputDir, { recursive: true });
await copyFile(bundlePath, resolve(outputDir, "portfolio-react.js"));
await copyFile(cssPath, resolve(outputDir, "portfolio-react.css"));

const sourcePath = resolve(root, "src/index.html");
const sourceHtml = await readFile(sourcePath, "utf8");
const devEntry = '<script type="module" src="./main.jsx"></script>';
if (!sourceHtml.includes(devEntry)) {
  throw new Error(`Expected React development entry was not found in ${sourcePath}`);
}
const productionEntry = [
  `<link rel="stylesheet" href="./assets/react/portfolio-react.css?v=${version}" />`,
  `<script type="module" src="./assets/react/portfolio-react.js?v=${version}"></script>`,
].join("\n    ");
await writeFile(resolve(root, "index.html"), sourceHtml.replace(devEntry, productionEntry));
console.log(`GitHub Pages files ready (React bundle ${version}).`);
