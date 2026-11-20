/**
 * © 2026 NXA Software. All rights reserved.
 * Faz 1 Canlı 3 Katmanlı Test Orkestratörü
 * - Aynı süreç ağacında production Next.js sunucusunu (localhost:3000) başlatır
 * - Statik Denetim -> Canlı API Testleri -> Playwright E2E Testlerini koşar
 * - finally bloğunda sunucuyu ve geçici test kayıtlarını kesin olarak kapatır/siler
 */

import { spawn, execSync } from "node:child_process"
import { cleanupAuditFixtures, prisma, verifyCleanDatabase } from "./_phase1-audit-fixture.mjs"

const PORT = 3000
const BASE_URL = `http://localhost:${PORT}`

function runNodeScript(scriptPath, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: "inherit",
      env: { ...process.env, AUDIT_BASE_URL: BASE_URL, ...extraEnv },
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${scriptPath} exited with code ${code}`))
    })
    child.on("error", reject)
  })
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/login`, { redirect: "manual" })
      if (res.status >= 200 && res.status < 400) {
        return
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 750))
  }
  throw new Error(`Next.js server ${timeoutMs}ms içinde hazır olmadı (${url}).`)
}

async function main() {
  // Windows'ta shell: false ile doğrudan next CLI çalıştır veya npx.cmd kullan
  const nextBin = process.platform === "win32" ? "node_modules\\.bin\\next.cmd" : "node_modules/.bin/next"
  const serverEnv = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(PORT),
    NEXTAUTH_URL: BASE_URL,
    AUTH_URL: BASE_URL,
    AUTH_TRUST_HOST: "true",
  }

  console.log(`🚀 Next.js sunucusu başlatılıyor (${BASE_URL})...`)
  const server = spawn(nextBin, ["start", "-p", String(PORT)], {
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  })

  server.stdout.on("data", (d) => {
    const line = d.toString()
    if (line.includes("Ready") || line.includes("Error") || line.includes("error")) {
      process.stdout.write(`[next] ${line}`)
    }
  })
  server.stderr.on("data", (d) => {
    process.stderr.write(`[next-err] ${d.toString()}`)
  })

  try {
    await waitForServer(BASE_URL, 60000)
    console.log(`✅ Sunucu hazır: ${BASE_URL}`)

    await runNodeScript("scripts/audit-phase1-static.mjs")
    await runNodeScript("scripts/test-phase1-api.mjs")
    await runNodeScript("scripts/test-phase1-e2e.mjs")

    console.log("\n🎉 TÜM 3 KATMANLI TESTLER %100 PASS!")
  } finally {
    console.log("\n🛑 Next.js test sunucusu kapatılıyor...")
    try {
      if (server.pid) {
        if (process.platform === "win32") {
          execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" })
        } else {
          server.kill("SIGTERM")
        }
      }
    } catch {}

    try {
      await cleanupAuditFixtures()
      const clean = await verifyCleanDatabase()
      console.log("✅ Final Teardown DB Doğrulaması:", JSON.stringify(clean))
    } finally {
      await prisma.$disconnect()
    }
  }
}

main().catch((err) => {
  console.error("\n💥 ORKESTRATÖR HATASI:", err)
  process.exit(1)
})

