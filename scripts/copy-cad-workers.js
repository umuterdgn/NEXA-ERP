const fs = require("fs");
const path = require("path");

const dirs = [
  "public/workers",
  "public/wasm",
  "public/admin/blueprints/assets",
  "public/admin/inspection/reports/assets",
];

for (const dir of dirs) {
  fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
}

const fileCopies = [
  [
    "node_modules/@mlightcad/libredwg-converter/dist/libredwg-parser-worker.js",
    "public/workers/libredwg-parser-worker.js",
  ],
  [
    "node_modules/@mlightcad/libredwg-converter/dist/libredwg-web.wasm",
    "public/workers/libredwg-web.wasm",
  ],
  [
    "node_modules/@mlightcad/cad-simple-viewer/dist/mtext-renderer-worker.js",
    "public/workers/mtext-renderer-worker.js",
  ],
  ["node_modules/web-ifc/web-ifc.wasm", "public/wasm/web-ifc.wasm"],
  ["node_modules/web-ifc/web-ifc-mt.wasm", "public/wasm/web-ifc-mt.wasm"],
];

for (const [src, dst] of fileCopies) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  } catch (e) {
    console.warn(`Skipped copying ${src}:`, e.message);
  }
}

try {
  if (fs.existsSync("node_modules/@mlightcad/mtext-renderer/dist")) {
    fs.cpSync("node_modules/@mlightcad/mtext-renderer/dist", "public/admin/blueprints/assets", {
      recursive: true,
    });
    fs.cpSync(
      "node_modules/@mlightcad/mtext-renderer/dist",
      "public/admin/inspection/reports/assets",
      { recursive: true }
    );
  }
} catch {}

console.log("✅ CAD & Web-IFC worker/WASM assets synced.");

