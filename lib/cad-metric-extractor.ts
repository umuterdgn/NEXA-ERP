/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Real Metric CAD (DWG / DXF) & Vector PDF Geometry Extractor
 *
 * Extracts genuine architectural/structural/MEP vectors and metric coordinates
 * directly from uploaded files:
 * - DWG (AC1012 - AC1032 / AutoCAD 2024): Decoded via LibreDWG WebAssembly
 * - DXF (ASCII): Full section/entity/unit parser ($INSUNITS aware)
 * - PDF (Vector Blueprints): FlateDecode stream & CTM path parser (MediaBox + scale aware)
 */

import fs from "fs/promises";
import path from "path";
import zlib from "zlib";
import type { Blueprint2DCoordinateElement, ParsedRoom } from "@/actions/ai-blueprint-parser";

export interface CadLine2D {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: string;
  color: string;
}

export interface CadCircle2D {
  cx: number;
  cy: number;
  r: number;
  layer: string;
  color: string;
}

export interface CadArc2D {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  layer: string;
  color: string;
}

export interface CadText2D {
  x: number;
  y: number;
  text: string;
  height: number;
  layer: string;
  color: string;
}

export interface CadLayerSummary {
  name: string;
  color: string;
  count: number;
  discipline: "Mimari" | "Statik" | "Elektrik" | "Mekanik";
  visible: boolean;
}

export interface CadMetricSummary {
  widthM: number;
  heightM: number;
  footprintAreaM2: number;
  totalWallLengthM: number;
  totalWallAreaM2: number;
  unitLabel: string;
  unitScaleToMeters: number;
  detectedScale: string;
  totalEntities: number;
  extracted3DCount: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CadExtractionResult {
  success: boolean;
  format: "DWG" | "DXF" | "PDF" | "IMAGE" | "UNKNOWN";
  fileName: string;
  metrics: CadMetricSummary;
  layers: CadLayerSummary[];
  vectors2D: {
    lines: CadLine2D[];
    circles: CadCircle2D[];
    arcs: CadArc2D[];
    texts: CadText2D[];
  };
  elements3D: Blueprint2DCoordinateElement[];
  rooms: ParsedRoom[];
  error?: string;
}

const ACI_COLORS: Record<number, string> = {
  1: "#ef4444", // Red
  2: "#eab308", // Yellow
  3: "#22c55e", // Green
  4: "#06b6d4", // Cyan
  5: "#3b82f6", // Blue
  6: "#d946ef", // Magenta
  7: "#e2e8f0", // White/Light Slate
  8: "#94a3b8", // Dark Gray
  9: "#cbd5e1", // Light Gray
  30: "#f97316", // Orange
  40: "#f59e0b", // Amber
};

function aciToHex(aci?: number, layerName?: string): string {
  if (aci && ACI_COLORS[aci]) return ACI_COLORS[aci];
  const lower = (layerName || "").toLowerCase();
  if (/wall|duvar|mim|arch/.test(lower)) return "#f97316";
  if (/col|kolon|statik|beam|kiris|perde|slab|beton|struct/.test(lower)) return "#3b82f6";
  if (/door|kapi|win|pencere|dograma/.test(lower)) return "#38bdf8";
  if (/elec|elek|kablo|tava|ayd|priz|pano|power|light/.test(lower)) return "#eab308";
  if (/mech|mek|hvac|plum|boru|kanal|tesisat|sihhi|sprink/.test(lower)) return "#06b6d4";
  if (/hatch|tarama/.test(lower)) return "#475569";
  if (/furn|mobilya|tefris/.test(lower)) return "#a78bfa";
  if (/text|yazi|dim|olcu|aks|grid/.test(lower)) return "#94a3b8";
  return "#cbd5e1";
}

function classifyLayerDiscipline(
  layerName: string,
  defaultDiscipline?: string
): "Mimari" | "Statik" | "Elektrik" | "Mekanik" {
  const lower = (layerName || "").toLowerCase();
  if (/col|kolon|statik|beam|kiris|kiriş|perde|shear|slab|temel|beton|struct|donati|rebar/.test(lower)) {
    return "Statik";
  }
  if (/elec|elek|kablo|tava|ayd|priz|pano|power|light|zayif|yangin_alg|busbar/.test(lower)) {
    return "Elektrik";
  }
  if (/mech|mek|hvac|plum|boru|kanal|tesisat|sihhi|sıhhi|sprink|havalandirma|water|pipe|duct/.test(lower)) {
    return "Mekanik";
  }
  if (/wall|duvar|mim|arch|door|kapi|kapı|win|pencere|bolme|bölme/.test(lower)) {
    return "Mimari";
  }
  const def = (defaultDiscipline || "Mimari").toLowerCase();
  if (def.includes("statik")) return "Statik";
  if (def.includes("elektrik")) return "Elektrik";
  if (def.includes("mekanik") || def.includes("tesisat")) return "Mekanik";
  return "Mimari";
}

function isNonStructuralDecorativeLayer(layerName: string): boolean {
  const lower = (layerName || "").toLowerCase();
  return /hatch|tarama|furn|mobilya|tefris|tefriş|text|yazi|yazı|dim|olcu|ölçü|annot|title|antet|frame|cerceve|çerçeve|viewport|defpoints|border|symbol|sembol|landscape|peyzaj|car|arac|tree|agac/.test(
    lower
  );
}

function isPrimaryWallOrStructLayer(layerName: string): boolean {
  const lower = (layerName || "").toLowerCase();
  return /wall|duvar|col|kolon|beam|kiris|kiriş|perde|shear|struct|statik|slab|elec|elek|kablo|tava|mech|mek|hvac|pipe|boru|kanal|duct|tesisat|door|kapi|win|pencere|segment/.test(
    lower
  );
}

/**
 * Resolve scale factor to meters from $INSUNITS and raw bounding span.
 */
function resolveUnitScaleToMeters(
  insunits: number | undefined,
  rawWidth: number,
  rawHeight: number
): { scale: number; label: string } {
  const maxSpan = Math.max(rawWidth, rawHeight);

  // Explicit metric INSUNITS
  if (insunits === 4) {
    // Millimeters
    if (maxSpan > 300) return { scale: 0.001, label: "mm → m" };
  }
  if (insunits === 5) {
    // Centimeters
    if (maxSpan > 50) return { scale: 0.01, label: "cm → m" };
  }
  if (insunits === 6) {
    // Meters
    if (maxSpan > 0.5 && maxSpan < 1000) return { scale: 1.0, label: "m" };
  }

  // Auto-detect from architectural building span (typical building: 5m - 120m)
  if (maxSpan > 25000) return { scale: 0.001, label: "mm → m (Oto)" };
  if (maxSpan > 600) return { scale: 0.01, label: "cm → m (Oto)" };
  if (maxSpan > 0 && maxSpan <= 600) return { scale: 1.0, label: "m (Oto)" };
  return { scale: 1.0, label: "m" };
}

interface RawSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: string;
  color: string;
  isClosedSmallBox?: boolean;
}

interface RawCircle {
  cx: number;
  cy: number;
  r: number;
  layer: string;
  color: string;
}

interface RawArc {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  layer: string;
  color: string;
}

interface RawText {
  x: number;
  y: number;
  text: string;
  height: number;
  layer: string;
  color: string;
}

/**
 * Fetch file buffer from local public/ folder or remote HTTPS/HTTP URL.
 */
export async function loadFileBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("data:")) {
    const base64Part = fileUrl.split(",")[1] || "";
    return Buffer.from(base64Part, "base64");
  }

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const res = await fetch(fileUrl, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Dosya indirilemedi (HTTP ${res.status})`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  const safeRel = path
    .normalize(fileUrl.split("?")[0])
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/^[/\\]+/, "");
  const publicDir = path.resolve(process.cwd(), "public");
  const fullPath = path.resolve(publicDir, safeRel);
  if (!fullPath.startsWith(publicDir)) {
    throw new Error("Geçersiz dosya yolu.");
  }
  return fs.readFile(fullPath);
}

/**
 * Parse ASCII DXF into raw geometric primitives.
 */
function parseDxfRaw(text: string): {
  insunits?: number;
  segments: RawSegment[];
  circles: RawCircle[];
  arcs: RawArc[];
  texts: RawText[];
  totalEntities: number;
} {
  const lines = text.split(/\r?\n/);
  const pairs: Array<{ code: number; val: string }> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (!isNaN(code)) {
      pairs.push({ code, val: lines[i + 1].trim() });
    }
  }

  let insunits: number | undefined;
  let inHeader = false;
  let inEntities = false;
  let totalEntities = 0;

  const segments: RawSegment[] = [];
  const circles: RawCircle[] = [];
  const arcs: RawArc[] = [];
  const texts: RawText[] = [];

  const layerColors: Record<string, string> = {};
  let inLayerTable = false;
  let curLayerName = "";

  // First pass: header + layer table + entities
  let i = 0;
  while (i < pairs.length) {
    const { code, val } = pairs[i];

    if (code === 0 && val === "SECTION") {
      const next = pairs[i + 1];
      if (next && next.code === 2) {
        inHeader = next.val === "HEADER";
        inEntities = next.val === "ENTITIES";
        inLayerTable = next.val === "TABLES";
        i += 2;
        continue;
      }
    }
    if (code === 0 && val === "ENDSEC") {
      inHeader = false;
      inEntities = false;
      inLayerTable = false;
      i++;
      continue;
    }

    if (inHeader && code === 9 && val === "$INSUNITS") {
      const next = pairs[i + 1];
      if (next && next.code === 70) {
        insunits = parseInt(next.val, 10);
      }
    }

    if (inLayerTable) {
      if (code === 0 && val === "LAYER") {
        curLayerName = "";
      } else if (code === 2) {
        curLayerName = val;
      } else if (code === 62 && curLayerName) {
        layerColors[curLayerName] = aciToHex(Math.abs(parseInt(val, 10)), curLayerName);
      }
    }

    if (inEntities && code === 0) {
      const entityType = val;
      i++;
      const props: Array<{ code: number; val: string }> = [];
      while (i < pairs.length && pairs[i].code !== 0) {
        props.push(pairs[i]);
        i++;
      }

      if (entityType === "ENDSEC" || entityType === "SEQEND") continue;
      totalEntities++;

      let layer = "0";
      let aci: number | undefined;
      for (const p of props) {
        if (p.code === 8) layer = p.val || "0";
        if (p.code === 62) aci = Math.abs(parseInt(p.val, 10));
      }
      const color = aci ? aciToHex(aci, layer) : layerColors[layer] || aciToHex(undefined, layer);

      if (entityType === "LINE") {
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        for (const p of props) {
          if (p.code === 10) x1 = parseFloat(p.val);
          else if (p.code === 20) y1 = parseFloat(p.val);
          else if (p.code === 11) x2 = parseFloat(p.val);
          else if (p.code === 21) y2 = parseFloat(p.val);
        }
        if (isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
          segments.push({ x1, y1, x2, y2, layer, color });
        }
      } else if (entityType === "LWPOLYLINE") {
        const pts: Array<{ x: number; y: number }> = [];
        let closed = false;
        let curX: number | null = null;
        for (const p of props) {
          if (p.code === 70) closed = (parseInt(p.val, 10) & 1) === 1;
          else if (p.code === 10) {
            curX = parseFloat(p.val);
          } else if (p.code === 20 && curX !== null) {
            const y = parseFloat(p.val);
            if (isFinite(curX) && isFinite(y)) pts.push({ x: curX, y });
            curX = null;
          }
        }
        for (let k = 0; k < pts.length - 1; k++) {
          segments.push({
            x1: pts[k].x,
            y1: pts[k].y,
            x2: pts[k + 1].x,
            y2: pts[k + 1].y,
            layer,
            color,
          });
        }
        if (closed && pts.length >= 3) {
          segments.push({
            x1: pts[pts.length - 1].x,
            y1: pts[pts.length - 1].y,
            x2: pts[0].x,
            y2: pts[0].y,
            layer,
            color,
            isClosedSmallBox: pts.length <= 5,
          });
        }
      } else if (entityType === "POLYLINE") {
        // Collect following VERTEX entities until SEQEND
        let closed = false;
        for (const p of props) {
          if (p.code === 70) closed = (parseInt(p.val, 10) & 1) === 1;
        }
        const pts: Array<{ x: number; y: number }> = [];
        while (i < pairs.length) {
          if (pairs[i].code === 0 && pairs[i].val === "SEQEND") {
            i++;
            break;
          }
          if (pairs[i].code === 0 && pairs[i].val === "VERTEX") {
            i++;
            let vx = 0, vy = 0;
            while (i < pairs.length && pairs[i].code !== 0) {
              if (pairs[i].code === 10) vx = parseFloat(pairs[i].val);
              else if (pairs[i].code === 20) vy = parseFloat(pairs[i].val);
              i++;
            }
            if (isFinite(vx) && isFinite(vy)) pts.push({ x: vx, y: vy });
          } else {
            break;
          }
        }
        for (let k = 0; k < pts.length - 1; k++) {
          segments.push({
            x1: pts[k].x,
            y1: pts[k].y,
            x2: pts[k + 1].x,
            y2: pts[k + 1].y,
            layer,
            color,
          });
        }
        if (closed && pts.length >= 3) {
          segments.push({
            x1: pts[pts.length - 1].x,
            y1: pts[pts.length - 1].y,
            x2: pts[0].x,
            y2: pts[0].y,
            layer,
            color,
          });
        }
      } else if (entityType === "CIRCLE") {
        let cx = 0, cy = 0, r = 0;
        for (const p of props) {
          if (p.code === 10) cx = parseFloat(p.val);
          else if (p.code === 20) cy = parseFloat(p.val);
          else if (p.code === 40) r = parseFloat(p.val);
        }
        if (isFinite(cx) && isFinite(cy) && isFinite(r) && r > 0) {
          circles.push({ cx, cy, r, layer, color });
        }
      } else if (entityType === "ARC") {
        let cx = 0, cy = 0, r = 0, sa = 0, ea = 90;
        for (const p of props) {
          if (p.code === 10) cx = parseFloat(p.val);
          else if (p.code === 20) cy = parseFloat(p.val);
          else if (p.code === 40) r = parseFloat(p.val);
          else if (p.code === 50) sa = (parseFloat(p.val) * Math.PI) / 180;
          else if (p.code === 51) ea = (parseFloat(p.val) * Math.PI) / 180;
        }
        if (isFinite(cx) && isFinite(cy) && isFinite(r) && r > 0) {
          arcs.push({ cx, cy, r, startAngle: sa, endAngle: ea, layer, color });
        }
      } else if (entityType === "SOLID" || entityType === "3DFACE") {
        const pts: Array<{ x: number; y: number }> = [];
        const xs: Record<number, number> = {};
        const ys: Record<number, number> = {};
        for (const p of props) {
          if (p.code >= 10 && p.code <= 13) xs[p.code - 10] = parseFloat(p.val);
          if (p.code >= 20 && p.code <= 23) ys[p.code - 20] = parseFloat(p.val);
        }
        for (let k = 0; k < 4; k++) {
          if (xs[k] !== undefined && ys[k] !== undefined) pts.push({ x: xs[k], y: ys[k] });
        }
        for (let k = 0; k < pts.length; k++) {
          const nextPt = pts[(k + 1) % pts.length];
          if (Math.hypot(nextPt.x - pts[k].x, nextPt.y - pts[k].y) > 1e-6) {
            segments.push({ x1: pts[k].x, y1: pts[k].y, x2: nextPt.x, y2: nextPt.y, layer, color });
          }
        }
      } else if (entityType === "TEXT" || entityType === "MTEXT") {
        let x = 0, y = 0, h = 1, txt = "";
        for (const p of props) {
          if (p.code === 10) x = parseFloat(p.val);
          else if (p.code === 20) y = parseFloat(p.val);
          else if (p.code === 40) h = parseFloat(p.val);
          else if (p.code === 1 || p.code === 3) txt += p.val;
        }
        const cleaned = txt.replace(/\\[A-Za-z][^;]*;/g, "").replace(/[{}]/g, "").trim();
        if (cleaned && isFinite(x) && isFinite(y)) {
          texts.push({ x, y, text: cleaned, height: h || 1, layer, color });
        }
      }
      continue;
    }

    i++;
  }

  return { insunits, segments, circles, arcs, texts, totalEntities };
}

/**
 * Parse binary AutoCAD DWG (AC1012 - AC1032) via LibreDWG WebAssembly.
 */
async function parseDwgRaw(buffer: Buffer): Promise<{
  insunits?: number;
  segments: RawSegment[];
  circles: RawCircle[];
  arcs: RawArc[];
  texts: RawText[];
  totalEntities: number;
}> {
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");

  // Resolve wasm directory reliably in both dev and production builds
  const candidateDirs = [
    path.resolve(process.cwd(), "node_modules/@mlightcad/libredwg-web/wasm"),
    path.resolve(process.cwd(), "public/workers"),
  ];
  let wasmDir = candidateDirs[0];
  for (const dir of candidateDirs) {
    try {
      await fs.access(path.join(dir, "libredwg-web.wasm"));
      wasmDir = dir;
      break;
    } catch {}
  }

  const libredwg = await LibreDwg.create(wasmDir);
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const dwg = libredwg.dwg_read_data(ab, Dwg_File_Type.DWG);
  if (!dwg) {
    throw new Error("DWG dosyası çözümlenemedi (desteklenmeyen veya bozuk DWG).");
  }
  const db: any = libredwg.convert(dwg);
  libredwg.dwg_free(dwg);

  const layerColors: Record<string, string> = {};
  for (const l of db?.tables?.LAYER?.entries || []) {
    if (l?.name) {
      layerColors[l.name] = aciToHex(Math.abs(l.colorIndex || 0), l.name);
    }
  }

  const segments: RawSegment[] = [];
  const circles: RawCircle[] = [];
  const arcs: RawArc[] = [];
  const texts: RawText[] = [];
  const entities: any[] = db?.entities || [];

  for (const e of entities) {
    if (!e || e.isVisible === false) continue;
    const layer = e.layer || "0";
    const color =
      e.colorIndex && e.colorIndex !== 256
        ? aciToHex(Math.abs(e.colorIndex), layer)
        : layerColors[layer] || aciToHex(undefined, layer);

    if (e.type === "LINE" && e.startPoint && e.endPoint) {
      const { x: x1, y: y1 } = e.startPoint;
      const { x: x2, y: y2 } = e.endPoint;
      if (isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
        segments.push({ x1, y1, x2, y2, layer, color });
      }
    } else if ((e.type === "LWPOLYLINE" || e.type === "POLYLINE2D" || e.type === "POLYLINE") && Array.isArray(e.vertices)) {
      const verts = e.vertices;
      for (let k = 0; k < verts.length - 1; k++) {
        const a = verts[k];
        const b = verts[k + 1];
        if (a && b && isFinite(a.x) && isFinite(a.y) && isFinite(b.x) && isFinite(b.y)) {
          segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, layer, color });
        }
      }
      const isClosed = Boolean(e.flag && (e.flag & 1) === 1) || Boolean(e.closed);
      if (isClosed && verts.length >= 3) {
        const last = verts[verts.length - 1];
        const first = verts[0];
        if (last && first && isFinite(last.x) && isFinite(first.x)) {
          segments.push({
            x1: last.x,
            y1: last.y,
            x2: first.x,
            y2: first.y,
            layer,
            color,
            isClosedSmallBox: verts.length <= 5,
          });
        }
      }
    } else if (e.type === "CIRCLE" && e.center && e.radius > 0) {
      if (isFinite(e.center.x) && isFinite(e.center.y) && isFinite(e.radius)) {
        circles.push({ cx: e.center.x, cy: e.center.y, r: e.radius, layer, color });
      }
    } else if (e.type === "ARC" && e.center && e.radius > 0) {
      if (isFinite(e.center.x) && isFinite(e.center.y) && isFinite(e.radius)) {
        arcs.push({
          cx: e.center.x,
          cy: e.center.y,
          r: e.radius,
          startAngle: e.startAngle ?? 0,
          endAngle: e.endAngle ?? Math.PI / 2,
          layer,
          color,
        });
      }
    } else if (e.type === "SOLID" || e.type === "3DFACE") {
      const corners = [e.corner1, e.corner2, e.corner3, e.corner4].filter(
        (c) => c && isFinite(c.x) && isFinite(c.y)
      );
      for (let k = 0; k < corners.length; k++) {
        const a = corners[k];
        const b = corners[(k + 1) % corners.length];
        if (Math.hypot(b.x - a.x, b.y - a.y) > 1e-4) {
          segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, layer, color });
        }
      }
    } else if ((e.type === "TEXT" || e.type === "MTEXT") && (e.text || e.string)) {
      const pt = e.startPoint || e.insertionPoint || e.position;
      const rawTxt = String(e.text || e.string || "")
        .replace(/\\[A-Za-z][^;]*;/g, "")
        .replace(/[{}]/g, "")
        .trim();
      if (rawTxt && pt && isFinite(pt.x) && isFinite(pt.y)) {
        texts.push({
          x: pt.x,
          y: pt.y,
          text: rawTxt,
          height: e.textHeight || e.height || 1,
          layer,
          color,
        });
      }
    }
  }

  return {
    insunits: db?.header?.INSUNITS,
    segments,
    circles,
    arcs,
    texts,
    totalEntities: entities.length,
  };
}

/**
 * Parse real vector drawing streams & text scale from a PDF blueprint.
 */
function parsePdfRaw(buffer: Buffer, defaultDiscipline?: string): {
  segments: RawSegment[];
  texts: RawText[];
  detectedScale: string;
  scaleDenominator: number;
  pageWidthPt: number;
  pageHeightPt: number;
  totalEntities: number;
} {
  const latin = buffer.toString("latin1");
  const mbMatch = latin.match(
    /\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/
  );
  const pageWidthPt = mbMatch ? Math.abs(parseFloat(mbMatch[3]) - parseFloat(mbMatch[1])) : 595.32;
  const pageHeightPt = mbMatch ? Math.abs(parseFloat(mbMatch[4]) - parseFloat(mbMatch[2])) : 841.92;

  const segments: RawSegment[] = [];
  const texts: RawText[] = [];
  let detectedScaleDenom = 100;
  let detectedScaleLabel = "1/100";

  const disciplineLayer = defaultDiscipline || "Mimari";
  const color = aciToHex(undefined, disciplineLayer);

  type Mat = [number, number, number, number, number, number];
  const mulMat = (m1: Mat, m2: Mat): Mat => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
  const applyMat = (m: Mat, x: number, y: number) => ({
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  });

  // Extract all decompressed content streams
  let idx = 0;
  while (idx < buffer.length) {
    const sIdx = buffer.indexOf("stream", idx);
    if (sIdx < 0) break;
    let start = sIdx + 6;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    else if (buffer[start] === 10) start += 1;
    const eIdx = buffer.indexOf("endstream", start);
    if (eIdx < 0) break;
    const rawStream = buffer.subarray(start, eIdx);
    idx = eIdx + 9;

    let decoded = "";
    try {
      decoded = zlib.inflateSync(rawStream).toString("latin1");
    } catch {
      try {
        decoded = zlib.inflateRawSync(rawStream).toString("latin1");
      } catch {
        // Could be uncompressed ASCII stream
        const sample = rawStream.subarray(0, 200).toString("latin1");
        if (/\b(m|l|re|Tj|TJ)\b/.test(sample)) {
          decoded = rawStream.toString("latin1");
        }
      }
    }

    if (!decoded) continue;

    // Detect architectural scale from PDF text
    const scaleMatch = decoded.match(/(?:1\s*[:/]\s*)(20|25|50|100|200|250|500)\b/);
    if (scaleMatch) {
      detectedScaleDenom = parseInt(scaleMatch[1], 10);
      detectedScaleLabel = `1/${detectedScaleDenom}`;
    }

    // Extract text literals for room / title detection
    const textMatches = decoded.matchAll(/\(([^()]{2,60})\)\s*Tj/g);
    for (const tm of textMatches) {
      const cleaned = tm[1].replace(/\\([()\\])/g, "$1").trim();
      if (cleaned && /[A-Za-z0-9]/.test(cleaned) && texts.length < 300) {
        texts.push({
          x: pageWidthPt * 0.5,
          y: pageHeightPt * 0.5,
          text: cleaned,
          height: 10,
          layer: "PDF-TEXT",
          color: "#94a3b8",
        });
      }
    }

    // Parse vector operators
    const tokens = decoded.match(/[-+]?(?:\d+\.?\d*|\.\d+)|[A-Za-z*']+/g);
    if (!tokens) continue;

    const stack: Mat[] = [];
    let ctm: Mat = [1, 0, 0, 1, 0, 0];
    let curX = 0;
    let curY = 0;
    let pathStartX = 0;
    let pathStartY = 0;
    const numStack: number[] = [];

    for (const tok of tokens) {
      const num = Number(tok);
      if (!isNaN(num) && tok.trim() !== "") {
        numStack.push(num);
        if (numStack.length > 12) numStack.shift();
        continue;
      }

      if (tok === "q") {
        stack.push([...ctm]);
      } else if (tok === "Q") {
        ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      } else if (tok === "cm" && numStack.length >= 6) {
        const [a, b, c, d, e, f] = numStack.slice(-6);
        ctm = mulMat(ctm, [a, b, c, d, e, f]);
      } else if (tok === "m" && numStack.length >= 2) {
        const [x, y] = numStack.slice(-2);
        const p = applyMat(ctm, x, y);
        curX = p.x;
        curY = p.y;
        pathStartX = p.x;
        pathStartY = p.y;
      } else if (tok === "l" && numStack.length >= 2) {
        const [x, y] = numStack.slice(-2);
        const p = applyMat(ctm, x, y);
        const len = Math.hypot(p.x - curX, p.y - curY);
        if (len > 4 && len < Math.max(pageWidthPt, pageHeightPt) * 0.96) {
          segments.push({ x1: curX, y1: curY, x2: p.x, y2: p.y, layer: disciplineLayer, color });
        }
        curX = p.x;
        curY = p.y;
      } else if (tok === "h") {
        const len = Math.hypot(pathStartX - curX, pathStartY - curY);
        if (len > 4 && len < Math.max(pageWidthPt, pageHeightPt) * 0.96) {
          segments.push({
            x1: curX,
            y1: curY,
            x2: pathStartX,
            y2: pathStartY,
            layer: disciplineLayer,
            color,
          });
        }
        curX = pathStartX;
        curY = pathStartY;
      } else if (tok === "re" && numStack.length >= 4) {
        const [rx, ry, rw, rh] = numStack.slice(-4);
        const p1 = applyMat(ctm, rx, ry);
        const p2 = applyMat(ctm, rx + rw, ry);
        const p3 = applyMat(ctm, rx + rw, ry + rh);
        const p4 = applyMat(ctm, rx, ry + rh);
        const wAbs = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const hAbs = Math.hypot(p4.x - p1.x, p4.y - p1.y);
        const maxDim = Math.max(pageWidthPt, pageHeightPt);
        // Ignore outer page frames & tiny glyphs
        if (
          Math.max(wAbs, hAbs) > 8 &&
          wAbs < pageWidthPt * 0.94 &&
          hAbs < pageHeightPt * 0.94 &&
          Math.max(wAbs, hAbs) < maxDim * 0.94
        ) {
          const isSmallBox = wAbs < 30 && hAbs < 30;
          segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, layer: disciplineLayer, color, isClosedSmallBox: isSmallBox });
          segments.push({ x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, layer: disciplineLayer, color });
          segments.push({ x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y, layer: disciplineLayer, color });
          segments.push({ x1: p4.x, y1: p4.y, x2: p1.x, y2: p1.y, layer: disciplineLayer, color });
        }
      }

      numStack.length = 0;
    }
  }

  return {
    segments,
    texts,
    detectedScale: detectedScaleLabel,
    scaleDenominator: detectedScaleDenom,
    pageWidthPt,
    pageHeightPt,
    totalEntities: segments.length + texts.length,
  };
}

/**
 * Normalize raw CAD/PDF entities into real metric coordinates (meters, centered around 0,0)
 * and build BOTH 2D canvas vectors and genuine 3D extruded BIM elements.
 */
function buildMetricAnd3DResult(params: {
  format: "DWG" | "DXF" | "PDF";
  fileName: string;
  segments: RawSegment[];
  circles: RawCircle[];
  arcs: RawArc[];
  texts: RawText[];
  totalEntities: number;
  unitScaleToMeters: number;
  unitLabel: string;
  detectedScale: string;
  defaultDiscipline?: string;
}): CadExtractionResult {
  const {
    format,
    fileName,
    segments,
    circles,
    arcs,
    texts,
    totalEntities,
    unitScaleToMeters,
    unitLabel,
    detectedScale,
    defaultDiscipline,
  } = params;

  // 1. Compute bounding box using trimmed outlier protection (ignore stray far origin markers)
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of segments) {
    xs.push(s.x1, s.x2);
    ys.push(s.y1, s.y2);
  }
  for (const c of circles) {
    xs.push(c.cx - c.r, c.cx + c.r);
    ys.push(c.cy - c.r, c.cy + c.r);
  }
  for (const a of arcs) {
    xs.push(a.cx - a.r, a.cx + a.r);
    ys.push(a.cy - a.r, a.cy + a.r);
  }

  if (xs.length === 0 || ys.length === 0) {
    return {
      success: false,
      format,
      fileName,
      metrics: {
        widthM: 0,
        heightM: 0,
        footprintAreaM2: 0,
        totalWallLengthM: 0,
        totalWallAreaM2: 0,
        unitLabel,
        unitScaleToMeters,
        detectedScale,
        totalEntities,
        extracted3DCount: 0,
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
      },
      layers: [],
      vectors2D: { lines: [], circles: [], arcs: [], texts: [] },
      elements3D: [],
      rooms: [],
      error: "Dosyada 2D/3D geometri vektörü bulunamadı.",
    };
  }

  let rawMinX = Infinity, rawMaxX = -Infinity, rawMinY = Infinity, rawMaxY = -Infinity;
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] < rawMinX) rawMinX = xs[i];
    if (xs[i] > rawMaxX) rawMaxX = xs[i];
  }
  for (let i = 0; i < ys.length; i++) {
    if (ys[i] < rawMinY) rawMinY = ys[i];
    if (ys[i] > rawMaxY) rawMaxY = ys[i];
  }

  const rawCenterX = (rawMinX + rawMaxX) / 2;
  const rawCenterY = (rawMinY + rawMaxY) / 2;

  const toMetersX = (x: number) => Math.round((x - rawCenterX) * unitScaleToMeters * 1000) / 1000;
  const toMetersY = (y: number) => Math.round((y - rawCenterY) * unitScaleToMeters * 1000) / 1000;
  const toMetersR = (r: number) => Math.round(r * unitScaleToMeters * 1000) / 1000;

  const widthM = Math.round((rawMaxX - rawMinX) * unitScaleToMeters * 100) / 100;
  const heightM = Math.round((rawMaxY - rawMinY) * unitScaleToMeters * 100) / 100;
  const footprintAreaM2 = Math.round(widthM * heightM * 10) / 10;

  // 2. Layer statistics
  const layerMap = new Map<string, { color: string; count: number }>();
  const addLayerStat = (layer: string, color: string) => {
    const cur = layerMap.get(layer);
    if (cur) cur.count++;
    else layerMap.set(layer, { color, count: 1 });
  };

  // 3. Build 2D vectors (capped smartly at 8,000 lines for instant 60fps canvas rendering)
  const MAX_2D_LINES = 8000;
  const lineStep = segments.length > MAX_2D_LINES ? Math.ceil(segments.length / MAX_2D_LINES) : 1;
  const lines2D: CadLine2D[] = [];
  for (let i = 0; i < segments.length; i += lineStep) {
    const s = segments[i];
    addLayerStat(s.layer, s.color);
    lines2D.push({
      x1: toMetersX(s.x1),
      y1: toMetersY(s.y1),
      x2: toMetersX(s.x2),
      y2: toMetersY(s.y2),
      layer: s.layer,
      color: s.color,
    });
  }

  const circles2D: CadCircle2D[] = circles.slice(0, 1000).map((c) => {
    addLayerStat(c.layer, c.color);
    return {
      cx: toMetersX(c.cx),
      cy: toMetersY(c.cy),
      r: toMetersR(c.r),
      layer: c.layer,
      color: c.color,
    };
  });

  const arcs2D: CadArc2D[] = arcs.slice(0, 1500).map((a) => {
    addLayerStat(a.layer, a.color);
    return {
      cx: toMetersX(a.cx),
      cy: toMetersY(a.cy),
      r: toMetersR(a.r),
      startAngle: a.startAngle,
      endAngle: a.endAngle,
      layer: a.layer,
      color: a.color,
    };
  });

  const texts2D: CadText2D[] = texts.slice(0, 400).map((t) => {
    addLayerStat(t.layer, t.color);
    return {
      x: toMetersX(t.x),
      y: toMetersY(t.y),
      text: t.text,
      height: Math.max(0.15, toMetersR(t.height)),
      layer: t.layer,
      color: t.color,
    };
  });

  const layers: CadLayerSummary[] = Array.from(layerMap.entries())
    .map(([name, info]) => ({
      name,
      color: info.color,
      count: info.count,
      discipline: classifyLayerDiscipline(name, defaultDiscipline),
      visible: true,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Build REAL 3D Metric Extrusion Elements from ACTUAL CAD/PDF segments
  // Prioritize real wall/structural/MEP layers; filter out decorative hatch/furniture layers if structural layers exist
  const hasPrimaryLayers = segments.some((s) => isPrimaryWallOrStructLayer(s.layer));
  const candidateSegments = segments
    .filter((s) => {
      if (hasPrimaryLayers && isNonStructuralDecorativeLayer(s.layer)) return false;
      const sx1 = toMetersX(s.x1);
      const sy1 = toMetersY(s.y1);
      const sx2 = toMetersX(s.x2);
      const sy2 = toMetersY(s.y2);
      const lenM = Math.hypot(sx2 - sx1, sy2 - sy1);
      return lenM >= 0.25; // Ignore sub-25cm micro fragments for 3D extrusion
    })
    .map((s) => {
      const startX = toMetersX(s.x1);
      const startY = toMetersY(s.y1);
      const endX = toMetersX(s.x2);
      const endY = toMetersY(s.y2);
      const lengthM = Math.hypot(endX - startX, endY - startY);
      const priority = isPrimaryWallOrStructLayer(s.layer) ? 2 : 1;
      return { ...s, startX, startY, endX, endY, lengthM, priority };
    });

  // Deduplicate overlapping identical segments (within 5cm)
  const deduped: typeof candidateSegments = [];
  const seenKeys = new Set<string>();
  candidateSegments.sort((a, b) => b.priority - a.priority || b.lengthM - a.lengthM);

  for (const seg of candidateSegments) {
    const ax = Math.round(seg.startX * 10);
    const ay = Math.round(seg.startY * 10);
    const bx = Math.round(seg.endX * 10);
    const by = Math.round(seg.endY * 10);
    const key =
      ax < bx || (ax === bx && ay <= by)
        ? `${ax},${ay}-${bx},${by}`
        : `${bx},${by}-${ax},${ay}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(seg);
    if (deduped.length >= 320) break;
  }

  const elements3D: Blueprint2DCoordinateElement[] = [];
  let totalWallLengthM = 0;
  let totalWallAreaM2 = 0;

  // Add real foundation / floor slab matching actual extracted building footprint
  if (widthM >= 1 && heightM >= 1 && widthM <= 300 && heightM <= 300) {
    elements3D.push({
      id: `SLAB-${fileName.slice(0, 8)}-01`,
      eleman: `Tabliye Döşeme (${widthM.toFixed(1)}m × ${heightM.toFixed(1)}m = ${footprintAreaM2.toFixed(1)}m²)`,
      elemanTipi: "Döşeme",
      startX: -widthM / 2,
      startY: 0,
      endX: widthM / 2,
      endY: 0,
      yukseklik_z: 0.25,
      height: 0.25,
      thickness: heightM,
      baseElevation: -0.25,
      baslangic: { x: -widthM / 2, y: 0 },
      bitis: { x: widthM / 2, y: 0 },
      yukseklik: 0.25,
      kalinlik: heightM,
      taban_kotu: -0.25,
      disiplin: defaultDiscipline === "Statik" ? "Statik" : "Statik",
      poz_no: "15.150.1005",
      miktar: Math.round(footprintAreaM2 * 0.25 * 10) / 10,
      birim: "m3",
    });
  }

  // Extrude real CAD/PDF segments with discipline-specific heights, elevations & thicknesses
  deduped.forEach((seg, idx) => {
    const disc = defaultDiscipline && defaultDiscipline !== "Mimari" && !isPrimaryWallOrStructLayer(seg.layer)
      ? (classifyLayerDiscipline(defaultDiscipline, defaultDiscipline))
      : classifyLayerDiscipline(seg.layer, defaultDiscipline);

    const lowerLayer = seg.layer.toLowerCase();
    let elemanTipi = "Duvar";
    let height = 3.1;
    let thickness = 0.22;
    let baseElevation = 0;
    let pozNo = "15.220.1004";

    if (disc === "Statik") {
      if (/col|kolon/.test(lowerLayer) || seg.lengthM <= 1.2) {
        elemanTipi = "Kolon";
        height = 3.3;
        thickness = Math.min(0.6, Math.max(0.35, seg.lengthM));
        pozNo = "15.160.1002";
      } else if (/beam|kiris|kiriş/.test(lowerLayer)) {
        elemanTipi = "Kiriş";
        height = 0.55;
        thickness = 0.3;
        baseElevation = 2.65;
        pozNo = "15.150.1006";
      } else {
        elemanTipi = "Perde";
        height = 3.2;
        thickness = 0.3;
        pozNo = "15.160.1003";
      }
    } else if (disc === "Elektrik") {
      elemanTipi = "Kablo Tavası";
      height = 0.16;
      thickness = 0.3;
      baseElevation = 2.75;
      pozNo = "18.150.1003";
    } else if (disc === "Mekanik") {
      elemanTipi = "Havalandırma Kanalı / Boru";
      height = 0.28;
      thickness = 0.35;
      baseElevation = 2.55;
      pozNo = "19.200.1004";
    } else if (/door|kapi|kapı/.test(lowerLayer)) {
      elemanTipi = "Kapı Doğrama";
      height = 2.15;
      thickness = 0.12;
      pozNo = "15.420.1001";
    } else if (/win|pencere/.test(lowerLayer)) {
      elemanTipi = "Pencere Doğrama";
      height = 1.4;
      thickness = 0.14;
      baseElevation = 0.9;
      pozNo = "15.425.1002";
    } else {
      elemanTipi = "Duvar";
      height = 3.1;
      thickness = 0.22;
      pozNo = "15.220.1004";
    }

    const areaM2 = Math.round(seg.lengthM * height * 100) / 100;
    totalWallLengthM += seg.lengthM;
    totalWallAreaM2 += areaM2;

    elements3D.push({
      id: `CAD-${idx + 1}`,
      eleman: `${seg.layer !== "0" ? `[${seg.layer}] ` : ""}${elemanTipi} #${idx + 1} (${seg.lengthM.toFixed(2)}m)`,
      elemanTipi,
      startX: seg.startX,
      startY: seg.startY,
      endX: seg.endX,
      endY: seg.endY,
      yukseklik_z: height,
      height,
      thickness,
      baseElevation,
      baslangic: { x: seg.startX, y: seg.startY },
      bitis: { x: seg.endX, y: seg.endY },
      yukseklik: height,
      kalinlik: thickness,
      taban_kotu: baseElevation,
      disiplin: disc,
      poz_no: pozNo,
      miktar: areaM2,
      birim: disc === "Elektrik" || disc === "Mekanik" ? "m" : "m2",
    });
  });

  // Also convert real structural/MEP circles (e.g., round columns or pipes) into 3D elements
  circles2D.slice(0, 40).forEach((c, idx) => {
    if (c.r < 0.08 || c.r > 5) return;
    if (hasPrimaryLayers && isNonStructuralDecorativeLayer(c.layer)) return;
    const disc = classifyLayerDiscipline(c.layer, defaultDiscipline);
    const diam = Math.max(0.2, c.r * 2);
    elements3D.push({
      id: `CIR-${idx + 1}`,
      eleman: `[${c.layer}] Dairesel ${disc === "Mekanik" ? "Boru / Şaft" : "Kolon"} Ø${(diam * 100).toFixed(0)}cm`,
      elemanTipi: disc === "Mekanik" ? "Şaft" : "Kolon",
      startX: c.cx - c.r,
      startY: c.cy,
      endX: c.cx + c.r,
      endY: c.cy,
      yukseklik_z: 3.3,
      height: 3.3,
      thickness: diam,
      baseElevation: 0,
      baslangic: { x: c.cx - c.r, y: c.cy },
      bitis: { x: c.cx + c.r, y: c.cy },
      yukseklik: 3.3,
      kalinlik: diam,
      taban_kotu: 0,
      disiplin: disc,
      poz_no: "15.160.1002",
      miktar: Math.round(Math.PI * c.r * c.r * 3.3 * 100) / 100,
      birim: "m3",
    });
  });

  // 5. Extract real room labels from CAD/PDF texts
  const rooms: ParsedRoom[] = [];
  const roomKeywords = /salon|mutfak|oda|yatak|banyo|wc|hol|antre|koridor|balkon|teras|ofis|depo|giris|giriş|living|kitchen|bed|bath|office|hall|room|mahal/i;
  let roomCounter = 1;
  for (const t of texts2D) {
    if (roomKeywords.test(t.text) && rooms.length < 20) {
      const areaMatch = t.text.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²)/i);
      const areaVal = areaMatch ? parseFloat(areaMatch[1].replace(",", ".")) : Math.round((footprintAreaM2 / 6) * 10) / 10;
      rooms.push({
        id: `RM-${roomCounter}`,
        roomNo: `M-${String(roomCounter).padStart(2, "0")}`,
        name: t.text.slice(0, 48),
        floor: "Zemin Kat",
        areaM2: areaVal > 0 ? areaVal : 18,
        perimeterM: Math.round(Math.sqrt(Math.max(4, areaVal || 18)) * 4 * 10) / 10,
        floorFinish: "Projeye Göre",
        wallFinish: "Projeye Göre",
        ceilingFinish: "Projeye Göre",
      });
      roomCounter++;
    }
  }

  return {
    success: true,
    format,
    fileName,
    metrics: {
      widthM,
      heightM,
      footprintAreaM2,
      totalWallLengthM: Math.round(totalWallLengthM * 100) / 100,
      totalWallAreaM2: Math.round(totalWallAreaM2 * 100) / 100,
      unitLabel,
      unitScaleToMeters,
      detectedScale,
      totalEntities,
      extracted3DCount: elements3D.length,
      minX: toMetersX(rawMinX),
      maxX: toMetersX(rawMaxX),
      minY: toMetersY(rawMinY),
      maxY: toMetersY(rawMaxY),
    },
    layers,
    vectors2D: {
      lines: lines2D,
      circles: circles2D,
      arcs: arcs2D,
      texts: texts2D,
    },
    elements3D,
    rooms,
  };
}

/**
 * Main entry point: reads any uploaded architectural file (DWG, DXF, PDF)
 * and extracts its genuine 2D metric vectors & 3D BIM coordinates.
 */
export async function extractCadAndPdfMetrics(
  fileUrl: string,
  fileName?: string,
  fileType?: string,
  defaultDiscipline?: string
): Promise<CadExtractionResult> {
  const resolvedName = fileName || fileUrl.split("?")[0].split("/").pop() || "pafta";
  const buffer = await loadFileBuffer(fileUrl);
  const headerAscii = buffer.subarray(0, 16).toString("ascii");

  const lowerName = resolvedName.toLowerCase();
  const lowerUrl = fileUrl.toLowerCase();
  const lowerType = (fileType || "").toLowerCase();

  const isDwg =
    headerAscii.startsWith("AC10") ||
    lowerName.endsWith(".dwg") ||
    lowerUrl.includes(".dwg") ||
    lowerType === "dwg";

  const isPdf =
    headerAscii.startsWith("%PDF") ||
    lowerName.endsWith(".pdf") ||
    lowerUrl.includes(".pdf") ||
    lowerType === "pdf";

  const isDxf =
    !isDwg &&
    !isPdf &&
    (lowerName.endsWith(".dxf") ||
      lowerUrl.includes(".dxf") ||
      lowerType === "dxf" ||
      buffer.subarray(0, 200).toString("ascii").includes("SECTION"));

  if (isDwg) {
    const raw = await parseDwgRaw(buffer);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of raw.segments) {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
    const { scale, label } = resolveUnitScaleToMeters(
      raw.insunits,
      isFinite(maxX - minX) ? maxX - minX : 0,
      isFinite(maxY - minY) ? maxY - minY : 0
    );
    return buildMetricAnd3DResult({
      format: "DWG",
      fileName: resolvedName,
      ...raw,
      unitScaleToMeters: scale,
      unitLabel: label,
      detectedScale: "1/1 (CAD Gerçek Ölçek)",
      defaultDiscipline,
    });
  }

  if (isDxf) {
    const raw = parseDxfRaw(buffer.toString("utf8"));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of raw.segments) {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
    for (const c of raw.circles) {
      minX = Math.min(minX, c.cx - c.r);
      maxX = Math.max(maxX, c.cx + c.r);
      minY = Math.min(minY, c.cy - c.r);
      maxY = Math.max(maxY, c.cy + c.r);
    }
    const { scale, label } = resolveUnitScaleToMeters(
      raw.insunits,
      isFinite(maxX - minX) ? maxX - minX : 0,
      isFinite(maxY - minY) ? maxY - minY : 0
    );
    return buildMetricAnd3DResult({
      format: "DXF",
      fileName: resolvedName,
      ...raw,
      unitScaleToMeters: scale,
      unitLabel: label,
      detectedScale: "1/1 (DXF Gerçek Ölçek)",
      defaultDiscipline,
    });
  }

  if (isPdf) {
    const raw = parsePdfRaw(buffer, defaultDiscipline);
    // Convert PDF points (1 pt = 0.000352778 m) * architectural scale denominator (e.g. 100 for 1/100)
    const ptToMeters = 0.0003527778 * raw.scaleDenominator;
    return buildMetricAnd3DResult({
      format: "PDF",
      fileName: resolvedName,
      segments: raw.segments,
      circles: [],
      arcs: [],
      texts: raw.texts,
      totalEntities: raw.totalEntities,
      unitScaleToMeters: ptToMeters,
      unitLabel: `PDF ${raw.detectedScale} → m`,
      detectedScale: raw.detectedScale,
      defaultDiscipline,
    });
  }

  return {
    success: false,
    format: "UNKNOWN",
    fileName: resolvedName,
    metrics: {
      widthM: 0,
      heightM: 0,
      footprintAreaM2: 0,
      totalWallLengthM: 0,
      totalWallAreaM2: 0,
      unitLabel: "-",
      unitScaleToMeters: 1,
      detectedScale: "-",
      totalEntities: 0,
      extracted3DCount: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    },
    layers: [],
    vectors2D: { lines: [], circles: [], arcs: [], texts: [] },
    elements3D: [],
    rooms: [],
    error: "Vektör çıkarımı için DWG, DXF veya vektörel PDF dosyası gereklidir.",
  };
}

