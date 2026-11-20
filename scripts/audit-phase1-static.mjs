/**
 * © 2026 NXA Software. All rights reserved.
 * ADIM 1: Faz 1 Statik Rota, Sidebar, Layout Guard ve RBAC Envanter Denetimi
 * Kullanım: node scripts/audit-phase1-static.mjs
 */

import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

function walk(dir, list = []) {
  const full = path.resolve(ROOT, dir)
  if (!fs.existsSync(full)) return list
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, entry.name)
    if (entry.isDirectory()) walk(p, list)
    else list.push(p)
  }
  return list
}

function normalizePageRoute(absPath) {
  const rel = path.relative(path.join(ROOT, "app"), absPath).replace(/\\/g, "/")
  let r = "/" + rel.replace(/\/?page\.tsx?$/, "")
  r = r.replace(/^\/\[locale\]/, "")
  r = r.replace(/\/\([^)]+\)/g, "")
  if (!r || r === "/") return "/"
  return r
}

const pageFiles = walk("app").filter((f) => /[\\/]page\.tsx?$/.test(f))
const validRoutes = new Set(pageFiles.map(normalizePageRoute))

function routeExists(href) {
  const clean = href.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/"
  if (validRoutes.has(clean)) return true
  const segs = clean.split("/")
  for (const r of validRoutes) {
    const rSegs = r.split("/")
    if (rSegs.length !== segs.length) continue
    let ok = true
    for (let i = 0; i < segs.length; i++) {
      if (rSegs[i].startsWith("[") && rSegs[i].endsWith("]")) continue
      if (rSegs[i] !== segs[i]) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}

const failures = []
const report = {
  totalPageFiles: pageFiles.length,
  totalNormalizedRoutes: validRoutes.size,
  defaultRoutesChecked: 0,
  sidebarsChecked: [],
  canonicalChecks: [],
  layoutChecks: [],
  mobileAuthChecks: [],
}

// 1. Check all defaultWebRoute & middleware targets
const permSrc = fs.readFileSync(path.join(ROOT, "lib/rbac/permissions.ts"), "utf8")
const defaultRoutes = new Set([...permSrc.matchAll(/defaultWebRoute:\s*"([^"]+)"/g)].map((m) => m[1]))
// Also include tenant overrides from getDefaultWebRoute and middleware targets
for (const extra of [
  "/admin",
  "/inspection",
  "/inspection/dashboard",
  "/inspection/field",
  "/inspection/samples",
  "/inspection/documents",
  "/inspection/finance",
  "/inspection/personnel",
  "/franchise",
  "/franchise/dashboard",
  "/franchise/branch",
  "/franchise/personnel",
  "/personnel",
  "/subcontractor",
  "/investor/dashboard",
  "/login",
  "/unauthorized",
]) {
  defaultRoutes.add(extra)
}

for (const r of [...defaultRoutes].sort()) {
  report.defaultRoutesChecked++
  if (!routeExists(r)) {
    failures.push(`HAYALET ROTA (404): defaultWebRoute/middleware hedefi '${r}' app/ altında bulunamadı.`)
  }
}

// 2. Check all 5 active Sidebars
const activeSidebars = [
  "components/admin/Sidebar.tsx",
  "components/inspection/InspectionSidebar.tsx",
  "components/franchise/Sidebar.tsx",
  "components/PersonnelSidebar.tsx",
  "components/subcontractor/SubcontractorSidebar.tsx",
]

for (const sb of activeSidebars) {
  const fullPath = path.join(ROOT, sb)
  const content = fs.readFileSync(fullPath, "utf8")
  const hrefs = [...content.matchAll(/href:\s*["'`]([^"'`${}]+)["'`]/g)].map((m) => m[1])
  const labels = [...content.matchAll(/label(?:Key)?:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1])

  const missingHrefs = hrefs.filter((h) => h.startsWith("/") && !routeExists(h))
  const hrefCounts = {}
  for (const h of hrefs) hrefCounts[h] = (hrefCounts[h] || 0) + 1
  const dupHrefs = Object.entries(hrefCounts).filter(([, n]) => n > 1).map(([h, n]) => `${h} (${n}x)`)

  const usesRbac = /getAllowedModules/.test(content)
  const startsWithUseClient = content.trimStart().startsWith('"use client"') || content.trimStart().startsWith("'use client'")

  if (missingHrefs.length) {
    failures.push(`[${sb}] 404 href(ler) tespit edildi: ${missingHrefs.join(", ")}`)
  }
  if (dupHrefs.length) {
    failures.push(`[${sb}] Çift (duplicate) href tespit edildi: ${dupHrefs.join(", ")}`)
  }
  if (!usesRbac) {
    failures.push(`[${sb}] getAllowedModules() ile dinamik RBAC filtrelemesi bağlı değil!`)
  }
  if (!startsWithUseClient) {
    failures.push(`[${sb}] "use client" direktifi dosya başında değil!`)
  }

  if (sb.includes("InspectionSidebar")) {
    const bimLabelCount = labels.filter((l) => l === "BIM & 3D Modeller").length
    if (bimLabelCount > 1) {
      failures.push(`[${sb}] 'BIM & 3D Modeller' menü öğesi ${bimLabelCount} kez tekrar ediyor!`)
    }
  }

  report.sidebarsChecked.push({
    file: sb,
    hrefCount: hrefs.length,
    missingCount: missingHrefs.length,
    dupCount: dupHrefs.length,
    usesRbac,
    startsWithUseClient,
  })
}

// 3. Canonical check: inspection/personel vs inspection/personnel & mock check
const inspPersonel = fs.readFileSync(path.join(ROOT, "app/[locale]/inspection/personel/page.tsx"), "utf8")
const inspPersonelIsRedirect = /redirect\s*\(\s*["']\/inspection\/personnel["']\s*\)/.test(inspPersonel) && inspPersonel.length < 300
if (!inspPersonelIsRedirect) {
  failures.push("app/[locale]/inspection/personel/page.tsx kanonik redirect değil, çift sayfa kopyası barındırıyor!")
}
report.canonicalChecks.push({ check: "inspection/personel -> redirect", ok: inspPersonelIsRedirect })

const frPersonel = fs.readFileSync(path.join(ROOT, "app/[locale]/(franchise)/franchise/personnel/page.tsx"), "utf8")
const hasSampleTeam = /sampleTeam|Emre Kaya|Selin Öztürk/.test(frPersonel)
if (hasSampleTeam) {
  failures.push("app/[locale]/(franchise)/franchise/personnel/page.tsx içinde sahte sampleTeam fallback verisi tespit edildi!")
}
report.canonicalChecks.push({ check: "franchise/personnel zero-mock", ok: !hasSampleTeam })

// 4. Layout & Middleware Server-Side Guards
const layouts = [
  { file: "app/[locale]/admin/layout.tsx", requirePatterns: [/auth\s*\(/, /redirect\s*\(/, /INSPECTOR|forbiddenAdminRoles|getDefaultWebRoute/] },
  { file: "app/[locale]/inspection/layout.tsx", requirePatterns: [/auth\s*\(/, /redirect\s*\(/, /INSPECTOR/, /PROJECT_AUDITOR/, /LAB_TECH/] },
  { file: "app/[locale]/(franchise)/layout.tsx", requirePatterns: [/auth\s*\(/, /redirect\s*\(/, /FRANCHISEE/, /FRANCHISE_ADMIN/] },
  { file: "app/[locale]/personnel/layout.tsx", requirePatterns: [/auth\s*\(/, /redirect\s*\(/, /WORKER/, /DRIVER/, /FITOUT_SUPERVISOR/] },
  { file: "app/[locale]/subcontractor/layout.tsx", requirePatterns: [/auth\s*\(/, /redirect\s*\(/, /SUBCONTRACTOR/] },
]

for (const l of layouts) {
  const c = fs.readFileSync(path.join(ROOT, l.file), "utf8")
  const ok = l.requirePatterns.every((rx) => rx.test(c))
  if (!ok) {
    failures.push(`[${l.file}] eksik server-side auth/role guard tespit edildi!`)
  }
  report.layoutChecks.push({ file: l.file, ok })
}

const mw = fs.readFileSync(path.join(ROOT, "middleware.ts"), "utf8")
const mwOk =
  /getDefaultWebRoute/.test(mw) &&
  /INSPECTION/.test(mw) &&
  /FRANCHISEE/.test(mw) &&
  /SUBCONTRACTOR/.test(mw) &&
  /WORKER/.test(mw) &&
  /\/franchise\/branch/.test(mw)
if (!mwOk) {
  failures.push("middleware.ts içinde eksik panel izolasyon kuralı tespit edildi!")
}
report.layoutChecks.push({ file: "middleware.ts", ok: mwOk })

// 5. All /api/mobile/* routes auth guard check (except auth/login)
const mobileRoutes = walk("app/api/mobile").filter((f) => f.endsWith("route.ts"))
for (const mr of mobileRoutes) {
  const rel = path.relative(ROOT, mr).replace(/\\/g, "/")
  if (rel.endsWith("auth/login/route.ts")) continue
  const c = fs.readFileSync(mr, "utf8")
  const hasAuth = /getMobileAuth|resolveApiAuth/.test(c) && /401/.test(c)
  if (!hasAuth) {
    failures.push(`[${rel}] kimlik doğrulama / 401 guard eksik!`)
  }
  report.mobileAuthChecks.push({ file: rel, ok: hasAuth })
}

// Check legacy auto-seed patterns in journal & tasks
const journalSrc = fs.readFileSync(path.join(ROOT, "app/api/mobile/journal/route.ts"), "utf8")
const tasksSrc = fs.readFileSync(path.join(ROOT, "app/api/mobile/tasks/route.ts"), "utf8")
if (/Merkez Rezidans|createMany/.test(journalSrc) || /dailyJournal\.create\(\{\s*data:\s*\{[\s\S]*C35\/45/.test(journalSrc)) {
  failures.push("app/api/mobile/journal/route.ts içinde otomatik demo veri üretimi kaldı!")
}
if (/createMany/.test(tasksSrc)) {
  failures.push("app/api/mobile/tasks/route.ts içinde otomatik demo veri üretimi (createMany) kaldı!")
}

console.log("=== FAZ 1 STATİK DENETİM ÖZETİ ===")
console.log(JSON.stringify(report, null, 2))

if (failures.length > 0) {
  console.error("\n❌ TESPİT EDİLEN HATALAR:")
  for (const f of failures) console.error(" -", f)
  process.exit(1)
} else {
  console.log("\n✅ ADIM 1 STATİK DENETİM %100 PASS!")
}

