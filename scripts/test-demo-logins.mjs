/**
 * © 2026 NXA Software. All rights reserved.
 * ADIM 4: 11 Demo Hesabı İçin Otomatik Web (Playwright) & Mobil Auth Doğrulama Scripti
 * Çalıştırma: npx tsx scripts/test-demo-logins.mjs
 */

import assert from "node:assert/strict"
import { spawn, execSync } from "node:child_process"
import { chromium } from "playwright"
import { DEMO_ACCOUNTS } from "../lib/demo-accounts.ts"
import {
  getAllowedModules,
  getLocationTrackingMode,
} from "../lib/rbac/permissions.ts"

const PORT = 3000
const BASE_URL = process.env.AUDIT_BASE_URL || `http://localhost:${PORT}`

function normalizePathWithoutLocale(rawPathname) {
  const cleaned = rawPathname.replace(/^\/(tr|en|de|ru|ar)(?=\/|$)/i, "")
  return cleaned === "" ? "/" : cleaned
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
  throw new Error(`Next.js sunucusu ${timeoutMs}ms içinde hazır olmadı (${url}).`)
}

function attachErrorCollectors(page) {
  const errors = []
  page.on("pageerror", (err) => {
    errors.push(`PAGEERROR: ${err.message}`)
  })
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      if (/hydration|did not match|uncaught|internal server error/i.test(text)) {
        errors.push(`CONSOLE_ERROR: ${text}`)
      }
    }
  })
  page.on("response", (res) => {
    const url = res.url()
    if (!url.startsWith(BASE_URL)) return
    if (
      url.includes("favicon") ||
      url.includes("icon.svg") ||
      url.includes("/_vercel/insights") ||
      url.includes("/_vercel/speed-insights")
    ) {
      return
    }
    const status = res.status()
    if (status === 404 || status >= 500) {
      errors.push(`HTTP_${status}: ${res.request().method()} ${url}`)
    }
  })
  return errors
}

async function testMobileLogin(acc) {
  const res = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: acc.email, password: acc.password }),
  })
  const json = await res.json().catch(() => null)

  assert.equal(res.status, 200, `[MOBİL] ${acc.email} login status=${res.status} body=${JSON.stringify(json)}`)
  assert.equal(json?.success, true, `[MOBİL] ${acc.email} success !== true`)
  assert.ok(json?.accessToken, `[MOBİL] ${acc.email} accessToken boş`)
  assert.equal(json?.user?.role, acc.role, `[MOBİL] ${acc.email} rol uyuşmazlığı`)
  assert.equal(json?.tenant?.type, acc.tenantType, `[MOBİL] ${acc.email} tenantType uyuşmazlığı`)
  assert.equal(
    json?.locationTrackingMode,
    getLocationTrackingMode(acc.role),
    `[MOBİL] ${acc.email} locationTrackingMode uyuşmazlığı`
  )

  const expectedModules = getAllowedModules(acc.role, acc.tenantType)
  assert.equal(
    JSON.stringify(json?.allowedModules),
    JSON.stringify(expectedModules),
    `[MOBİL] ${acc.email} allowedModules uyuşmazlığı`
  )
  assert.ok(
    Array.isArray(json?.assignedProjects) && json.assignedProjects.length >= 1,
    `[MOBİL] ${acc.email} assignedProjects boş`
  )

  const meRes = await fetch(`${BASE_URL}/api/mobile/auth/me`, {
    headers: { Authorization: `Bearer ${json.accessToken}` },
  })
  const meJson = await meRes.json().catch(() => null)
  assert.equal(meRes.status, 200, `[MOBİL /me] ${acc.email} status=${meRes.status}`)
  assert.equal(meJson?.user?.role, acc.role, `[MOBİL /me] ${acc.email} rol uyuşmazlığı`)

  return {
    moduleCount: json.allowedModules.length,
    projectCount: json.assignedProjects.length,
    tracking: json.locationTrackingMode,
  }
}

async function testWebDemoClick(browser, acc) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = attachErrorCollectors(page)

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })

    const tabBtn = page.locator(`[data-testid="demo-tab-${acc.tenantType}"]`)
    await tabBtn.waitFor({ state: "visible", timeout: 15000 })
    await tabBtn.click()

    const roleBtn = page.locator(`[data-testid="demo-login-${acc.key}"]`)
    await roleBtn.waitFor({ state: "visible", timeout: 10000 })
    await roleBtn.click()

    await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 25000 })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})

    const finalUrl = new URL(page.url())
    const finalPath = normalizePathWithoutLocale(finalUrl.pathname)

    assert.ok(
      !["/login", "/expired", "/unauthorized"].includes(finalPath),
      `[WEB] ${acc.email} geçersiz rotaya düştü: ${finalPath}`
    )
    assert.equal(
      finalPath,
      acc.defaultWebRoute,
      `[WEB] ${acc.email} açılış rotası beklentisi ${acc.defaultWebRoute}, gelen: ${finalPath}`
    )

    // Yenilemede 200 OK ve redirect döngüsü olmamalı
    const reloadRes = await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    assert.ok(reloadRes, `[WEB] ${acc.email} reload response null`)
    assert.equal(reloadRes.status(), 200, `[WEB] ${acc.email} reload HTTP ${reloadRes.status()}`)

    const reloadedPath = normalizePathWithoutLocale(new URL(page.url()).pathname)
    assert.equal(
      reloadedPath,
      acc.defaultWebRoute,
      `[WEB] ${acc.email} reload sonrası beklenmeyen yönlendirme: ${reloadedPath}`
    )

    assert.equal(
      errors.length,
      0,
      `[WEB] ${acc.email} (${acc.defaultWebRoute}) sayfa hataları: ${errors.join(" | ")}`
    )

    return {
      finalPath: reloadedPath,
      reloadStatus: reloadRes.status(),
    }
  } finally {
    await context.close()
  }
}

async function main() {
  const nextBin =
    process.platform === "win32" ? "node_modules\\.bin\\next.cmd" : "node_modules/.bin/next"
  const serverEnv = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(PORT),
    NEXTAUTH_URL: BASE_URL,
    AUTH_URL: BASE_URL,
    AUTH_TRUST_HOST: "true",
  }

  console.log(`🚀 Next.js test sunucusu başlatılıyor (${BASE_URL})...`)
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

  let browser
  const results = []
  const failures = []

  try {
    await waitForServer(BASE_URL, 60000)
    console.log(`✅ Sunucu hazır: ${BASE_URL}\n`)

    browser = await chromium.launch({ headless: true })

    for (const acc of DEMO_ACCOUNTS) {
      let mobileRes = null
      let webRes = null

      try {
        mobileRes = await testMobileLogin(acc)
        console.log(
          `  ✅ [MOBİL] ${acc.tenantType.padEnd(10)} | ${acc.role.padEnd(16)} | ${acc.email} (${mobileRes.moduleCount} modül, ${mobileRes.projectCount} proje)`
        )
      } catch (err) {
        const msg = err?.message || String(err)
        console.error(`  ❌ [MOBİL] ${acc.role} (${acc.email}): ${msg}`)
        failures.push(msg)
      }

      try {
        webRes = await testWebDemoClick(browser, acc)
        console.log(
          `  ✅ [WEB]   ${acc.tenantType.padEnd(10)} | ${acc.role.padEnd(16)} | ${acc.email} -> ${webRes.finalPath} (HTTP ${webRes.reloadStatus})`
        )
      } catch (err) {
        const msg = err?.message || String(err)
        console.error(`  ❌ [WEB]   ${acc.role} (${acc.email}): ${msg}`)
        failures.push(msg)
      }

      results.push({
        tenantType: acc.tenantType,
        role: acc.role,
        email: acc.email,
        password: acc.password,
        route: webRes?.finalPath || acc.defaultWebRoute,
        mobileOk: Boolean(mobileRes),
        webOk: Boolean(webRes),
        modules: mobileRes?.moduleCount ?? 0,
        projects: mobileRes?.projectCount ?? 0,
      })
    }

    console.log("\n=== DEMO HIZLI GİRİŞ DOĞRULAMA ÖZETİ ===")
    console.table(results)

    if (failures.length > 0) {
      throw new Error(`${failures.length} kontrol başarısız oldu:\n - ${failures.join("\n - ")}`)
    }

    console.log(`\n🎉 TÜM ${DEMO_ACCOUNTS.length} DEMO HESABI (WEB E2E + MOBİL AUTH) %100 PASS!`)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
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
  }
}

main().catch((err) => {
  console.error("\n💥 DEMO DOĞRULAMA HATASI:", err?.message || err)
  process.exit(1)
})

