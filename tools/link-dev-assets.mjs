import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "src");

for (const name of ["style.css", "script.js", "secret.js", "assets"]) {
  const link = resolve(source, name);
  if (existsSync(link) || lstatSync(dirname(link)).isSymbolicLink()) continue;
  symlinkSync(`../${name}`, link, name === "assets" ? "dir" : "file");
}
