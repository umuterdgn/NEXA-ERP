/**
 * © 2026 NXA Software. All rights reserved.
 * ADIM 3: Playwright Web Panel, GrantAccessModal & RBAC E2E Doğrulama Testleri
 * Kullanım: node scripts/test-phase1-e2e.mjs
 */

import assert from "node:assert/strict"
import { chromium } from "playwright"
import {
  PREFIX,
  cleanupAuditFixtures,
  prisma,
  seedAuditFixtures,
  verifyCleanDatabase,
} from "./_phase1-audit-fixture.mjs"

const BASE_URL = process.env.AUDIT_BASE_URL || "http://localhost:3000"

let passedCount = 0

async function runCheck(name, fn) {
  try {
    await fn()
    passedCount++
    console.log(`  ✅ PASS: ${name}`)
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} -> ${err?.message || err}`)
    throw err
  }
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

async function loginViaWeb(browser, email, password, expectedPathPart) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = attachErrorCollectors(page)

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector('form input[type="text"]', { timeout: 15000 })
  await page.fill('form input[type="text"]', email)
  await page.fill('form input[type="password"]', password)
  await page.click('form button[type="submit"]')

  await page.waitForURL(
    (u) => !u.pathname.endsWith("/login"),
    { timeout: 20000 }
  )
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})

  if (expectedPathPart) {
    assert.ok(
      page.url().includes(expectedPathPart),
      `Beklenen URL parçası '${expectedPathPart}', gelen URL: ${page.url()}`
    )
  }

  return { context, page, errors }
}

async function readSidebarText(page) {
  // Sidebar renders inside <aside>
  await page.waitForSelector("aside", { timeout: 15000 })
  // Wait briefly for useSession() / sidebar hydration if client-dependent
  await page.waitForTimeout(400)
  return await page.locator("aside").first().innerText()
}

async function main() {
  console.log(`\n🌐 ADIM 3: Playwright E2E Testleri Başlıyor (${BASE_URL})`)
  let browser
  try {
    const fx = await seedAuditFixtures()
    browser = await chromium.launch({ headless: true })

    // 1. GrantAccessModal Testi: CONTRACTOR (/admin/personel)
    await runCheck("GrantAccessModal (CONTRACTOR /admin/personel) yalnızca Müteahhit rollerini sunar", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.ADMIN.email,
        fx.actors.ADMIN.password,
        "/admin"
      )
      try {
        await page.goto(`${BASE_URL}/admin/personel`, { waitUntil: "networkidle" })
        const openBtn = page.locator('[data-testid="open-grant-access-btn"]').first()
        await openBtn.waitFor({ state: "visible", timeout: 15000 })
        await openBtn.click()

        const select = page.locator('[data-testid="grant-access-role-select"]')
        await select.waitFor({ state: "visible", timeout: 10000 })
        const options = await select.locator("option").evaluateAll((els) =>
          els.map((e) => ({ value: e.value, text: e.textContent || "" }))
        )
        const vals = options.map((o) => o.value)
        assert.ok(vals.includes("SITE_MANAGER"), "SITE_MANAGER listede yok")
        assert.ok(vals.includes("ENGINEER"), "ENGINEER listede yok")
        assert.ok(vals.includes("WORKER"), "WORKER listede yok")
        assert.ok(vals.includes("DRIVER"), "DRIVER listede yok")
        assert.ok(!vals.includes("INSPECTION_ADMIN"), "INSPECTION_ADMIN sızdı!")
        assert.ok(!vals.includes("LAB_TECH"), "LAB_TECH sızdı!")
        assert.ok(!vals.includes("FRANCHISEE"), "FRANCHISEE sızdı!")
        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    // 2. GrantAccessModal Testi: INSPECTION (/inspection/personnel)
    await runCheck("GrantAccessModal (INSPECTION /inspection/personnel) yalnızca Yapı Denetim rollerini sunar (Şantiye Şefi YOK)", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.INSPECTION_ADMIN.email,
        fx.actors.INSPECTION_ADMIN.password,
        "/inspection"
      )
      try {
        await page.goto(`${BASE_URL}/inspection/personnel`, { waitUntil: "networkidle" })
        const openBtn = page.locator('[data-testid="open-grant-access-btn"]').first()
        await openBtn.waitFor({ state: "visible", timeout: 15000 })
        await openBtn.click()

        const select = page.locator('[data-testid="grant-access-role-select"]')
        await select.waitFor({ state: "visible", timeout: 10000 })
        const options = await select.locator("option").evaluateAll((els) =>
          els.map((e) => ({ value: e.value, text: e.textContent || "" }))
        )
        const vals = options.map((o) => o.value)
        const texts = options.map((o) => o.text).join(" | ")
        assert.ok(vals.includes("INSPECTOR"), "INSPECTOR listede yok")
        assert.ok(vals.includes("LAB_TECH"), "LAB_TECH listede yok")
        assert.ok(vals.includes("PROJECT_AUDITOR"), "PROJECT_AUDITOR listede yok")
        assert.ok(!vals.includes("SITE_MANAGER"), "SITE_MANAGER Yapı Denetim modalında göründü!")
        assert.ok(!texts.includes("Şantiye Şefi"), "Şantiye Şefi Yapı Denetim modalında göründü!")
        assert.ok(!vals.includes("FRANCHISEE"), "FRANCHISEE Yapı Denetim modalında göründü!")

        // Çift rota redirect doğrulaması (/inspection/personel -> /inspection/personnel)
        await page.goto(`${BASE_URL}/inspection/personel`, { waitUntil: "domcontentloaded" })
        assert.ok(page.url().includes("/inspection/personnel"), `Redirect başarısız: ${page.url()}`)
        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    // 3. GrantAccessModal Testi: FRANCHISE (/franchise/personnel)
    await runCheck("GrantAccessModal (FRANCHISE /franchise/personnel) yalnızca Franchise rollerini sunar", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.FRANCHISE_ADMIN.email,
        fx.actors.FRANCHISE_ADMIN.password,
        "/franchise"
      )
      try {
        await page.goto(`${BASE_URL}/franchise/personnel`, { waitUntil: "networkidle" })
        const openBtn = page.locator('[data-testid="open-grant-access-btn"]').first()
        await openBtn.waitFor({ state: "visible", timeout: 15000 })
        await openBtn.click()

        const select = page.locator('[data-testid="grant-access-role-select"]')
        await select.waitFor({ state: "visible", timeout: 10000 })
        const options = await select.locator("option").evaluateAll((els) =>
          els.map((e) => ({ value: e.value, text: e.textContent || "" }))
        )
        const vals = options.map((o) => o.value)
        const texts = options.map((o) => o.text).join(" | ")
        assert.ok(vals.includes("FRANCHISE_ADMIN"), "FRANCHISE_ADMIN yok")
        assert.ok(vals.includes("REGIONAL_MANAGER"), "REGIONAL_MANAGER yok")
        assert.ok(vals.includes("FRANCHISEE"), "FRANCHISEE yok")
        assert.ok(vals.includes("FITOUT_SUPERVISOR"), "FITOUT_SUPERVISOR yok")
        assert.ok(vals.includes("FITOUT_TECH"), "FITOUT_TECH yok")
        assert.ok(!vals.includes("SITE_MANAGER"), "SITE_MANAGER Franchise modalında göründü!")
        assert.ok(!texts.includes("Şantiye Şefi"), "Şantiye Şefi Franchise modalında göründü!")
        assert.ok(!vals.includes("LAB_TECH"), "LAB_TECH Franchise modalında göründü!")
        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    // 4. INSPECTOR Giriş -> /inspection/field, Menü Filtresi & /admin/finance Engeli
    await runCheck("INSPECTOR E2E -> /inspection/field açılır, taşeron/QR/finans menüleri yok, /admin/finance engellenir", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.INSPECTOR.email,
        fx.actors.INSPECTOR.password,
        "/inspection/field"
      )
      try {
        const sidebarText = await readSidebarText(page)
        assert.ok(!sidebarText.includes("Taşeron İş Kabulleri"), "INSPECTOR menüsünde Taşeron İş Kabulleri var!")
        assert.ok(!sidebarText.includes("Malzeme Tüketimi (QR)"), "INSPECTOR menüsünde Malzeme Tüketimi (QR) var!")
        assert.ok(!sidebarText.includes("Kasa & Finans"), "INSPECTOR menüsünde Kasa & Finans var!")
        assert.ok(!sidebarText.includes("Personeller"), "INSPECTOR menüsünde Personeller var!")
        assert.ok(sidebarText.includes("Saha Terminali"), "INSPECTOR menüsünde Saha Terminali yok!")

        // BIM & 3D Modeller menüsü 1'den fazla tekrar etmemeli
        const bimMatches = sidebarText.match(/BIM & 3D Modeller/g) || []
        assert.ok(bimMatches.length <= 1, `BIM & 3D Modeller ${bimMatches.length} kez tekrar ediyor!`)

        // /admin/finance doğrudan gidilirse engellenmeli
        await page.goto(`${BASE_URL}/admin/finance`, { waitUntil: "domcontentloaded" })
        assert.ok(!page.url().includes("/admin/finance"), `INSPECTOR /admin/finance sayfasına girdi: ${page.url()}`)
        assert.ok(page.url().includes("/inspection"), `Beklenmeyen yönlendirme: ${page.url()}`)

        // /inspection/finance doğrudan gidilirse de engellenmeli
        await page.goto(`${BASE_URL}/inspection/finance`, { waitUntil: "domcontentloaded" })
        assert.ok(!page.url().includes("/inspection/finance"), `INSPECTOR /inspection/finance sayfasına girdi: ${page.url()}`)

        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    // 5. WORKER Giriş -> /personnel, Menü Filtresi & /admin Engeli
    await runCheck("WORKER E2E -> /personnel açılır, jurnal/taşeron/BIM yok, izinli modüller var, /admin engellenir", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.WORKER.email,
        fx.actors.WORKER.password,
        "/personnel"
      )
      try {
        const sidebarText = await readSidebarText(page)
        assert.ok(!sidebarText.includes("Şantiye Günlüğü"), "WORKER menüsünde Şantiye Günlüğü var!")
        assert.ok(!sidebarText.includes("Taşeron İş Kabulleri"), "WORKER menüsünde Taşeron İş Kabulleri var!")
        assert.ok(!sidebarText.includes("3D BIM & AR"), "WORKER menüsünde 3D BIM & AR var!")
        assert.ok(!sidebarText.includes("Denetim Raporları"), "WORKER menüsünde Denetim Raporları var!")

        assert.ok(sidebarText.includes("QR Giriş/Çıkış"), "WORKER menüsünde QR Giriş/Çıkış yok!")
        assert.ok(sidebarText.includes("Görevlerim"), "WORKER menüsünde Görevlerim yok!")
        assert.ok(sidebarText.includes("İzin Yönetimi"), "WORKER menüsünde İzin Yönetimi yok!")
        assert.ok(sidebarText.includes("Zimmetli Ekipmanlar"), "WORKER menüsünde Zimmetli Ekipmanlar yok!")
        assert.ok(sidebarText.includes("İSG Bildirimleri"), "WORKER menüsünde İSG Bildirimleri yok!")

        await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" })
        assert.ok(page.url().includes("/personnel"), `WORKER /admin erişimi engellenmedi: ${page.url()}`)

        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    // 6. FRANCHISEE Giriş -> /franchise/branch, Şube A verisi & /admin + /franchise/finance Engeli
    await runCheck("FRANCHISEE E2E -> /franchise/branch açılır, yalnızca Şube A görünür, /admin ve /franchise/finance engellenir", async () => {
      const { context, page, errors } = await loginViaWeb(
        browser,
        fx.actors.FRANCHISEE.email,
        fx.actors.FRANCHISEE.password,
        "/franchise/branch"
      )
      try {
        const mainText = await page.locator("body").innerText()
        assert.ok(mainText.includes(`${PREFIX}Franchise_BranchA`), "Şube A verisi sayfada görüntülenmedi!")
        assert.ok(!mainText.includes(`${PREFIX}Franchise_BranchB`), "Şube B verisi FRANCHISEE ekranına sızdı!")

        const sidebarText = await readSidebarText(page)
        assert.ok(sidebarText.includes("Şubem"), "FRANCHISEE menüsünde Şubem yok!")
        assert.ok(!sidebarText.includes("Kasa & Finans"), "FRANCHISEE menüsünde Finans var!")
        assert.ok(!sidebarText.includes("Kullanıcılar"), "FRANCHISEE menüsünde Kullanıcılar var!")
        assert.ok(!sidebarText.includes("Personel"), "FRANCHISEE menüsünde Personel var!")

        await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" })
        assert.ok(page.url().includes("/franchise/branch"), `FRANCHISEE /admin engellenmedi: ${page.url()}`)

        await page.goto(`${BASE_URL}/franchise/finance`, { waitUntil: "domcontentloaded" })
        assert.ok(page.url().includes("/franchise/branch"), `FRANCHISEE /franchise/finance engellenmedi: ${page.url()}`)

        assert.equal(errors.length, 0, `Sayfa hataları: ${errors.join(" | ")}`)
      } finally {
        await context.close()
      }
    })

    console.log(`\n✅ ADIM 3 TAMAMLANDI: ${passedCount} Playwright E2E senaryosu %100 PASS (0 404/500/hydration)!`)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
    console.log("\n🧹 ADIM 3 Teardown çalışıyor...")
    await cleanupAuditFixtures()
    const remaining = await verifyCleanDatabase()
    console.log("✅ ADIM 3 DB Teardown doğrulandı (kalan test kayıtları):", JSON.stringify(remaining))
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("\n❌ ADIM 3 BAŞARISIZ:", err)
  process.exit(1)
})

