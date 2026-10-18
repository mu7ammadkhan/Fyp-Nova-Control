import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";

const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const keys = new Set();
function visit(key) {
  if (keys.has(key)) return;
  keys.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
visit("index.html");
const initialJs = [...keys].map((key) => manifest[key].file);
const initialCss = [...new Set([...keys].flatMap((key) => manifest[key].css || []))];
const size = (files, compressed = false) => files.reduce((total, file) => {
  const bytes = readFileSync(`dist/${file}`);
  return total + (compressed ? gzipSync(bytes).length : bytes.length);
}, 0);
assert.ok(size(initialJs) < 400000, "Initial JavaScript exceeded the 400 KB budget");
assert.ok(size(initialCss) < 125000, "Styles exceeded the 125 KB budget");
for (const key of keys) {
  assert.ok(!/database|useHomeData|AppLayout|Navbar|Dashboard|Room|Devices|Profile/.test(key), `Protected code loaded at login: ${key}`);
}
assert.ok(manifest["node_modules/firebase/database/dist/esm/index.esm.js"]?.isDynamicEntry, "Hardware SDK must remain on demand");
console.table({
  "Initial JavaScript": { bytes: size(initialJs), gzip: size(initialJs, true) },
  "Initial CSS": { bytes: size(initialCss), gzip: size(initialCss, true) },
});
console.log("Bundle budgets and lazy-loading checks passed.");
