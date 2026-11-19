/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Automated High-Resolution Presentation Screenshot Capture
 * Playwright Chromium with Retina scale factor 2 (1920x1080 @ 2x)
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "https://nxerp.com.tr";
const DEMO_EMAIL = process.env.DEMO_EMAIL || process.env.ADMIN_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || process.env.ADMIN_PASSWORD;

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  console.error("❌ HATA: Güvenlik gereği kimlik bilgileri process.env üzerinden tanımlanmalıdır.");
  console.error("Lütfen DEMO_EMAIL ve DEMO_PASSWORD ortam değişkenlerini tanımlayarak çalıştırınız.");
  console.error("Örnek: DEMO_EMAIL=... DEMO_PASSWORD=... node presentation/capture.mjs");
  process.exit(1);
}

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function hideTransientOverlays(page) {
  try {
    await page.evaluate(() => {
      // Hide toasts, tooltips, cookie banners or modals
      const selectors = [
        '[role="status"]',
        '[data-sonner-toaster]',
        '.toast',
        '.toaster',
        '#toast-container',
        '[data-hot-toast]',
        'div[style*="z-index: 9999"]',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el).style.display = "none";
        });
      });
    });
  } catch {
    // Ignore overlay cleanup errors
  }
}

async function waitForPageStabilization(page, extraWaitMs = 3000) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    // networkidle might timeout on streaming or long polling, proceed anyway
  }
  await page.waitForTimeout(extraWaitMs);
  await hideTransientOverlays(page);
}

async function main() {
  console.log("🚀 Starting Playwright Chromium for Nexa ERP Presentation Capture...");
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`👤 Login User: ${DEMO_EMAIL}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--allow-running-insecure-content",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina resolution
    colorScheme: "dark",
    locale: "tr-TR",
  });

  const page = await context.newPage();

  try {
    // 1. LOGIN FLOW
    console.log(`\n🔑 Navigating to login page: ${BASE_URL}/tr/login ...`);
    await page.goto(`${BASE_URL}/tr/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if redirected or already on login
    console.log("📝 Filling credentials...");
    const emailInput = page.locator('input[type="text"], input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await page.waitForTimeout(500);

    console.log("🖱️ Submitting login form...");
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for navigation after login
    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      console.log(`✅ Login successful! Redirected to: ${page.url()}`);
    } catch {
      console.log(`⚠️ URL wait timed out, current URL: ${page.url()}. Checking authentication...`);
    }

    await waitForPageStabilization(page, 2000);

    // Find any real project ID if available
    let dynamicProjectId = "";
    try {
      console.log("🔍 Checking projects list for active project ID...");
      await page.goto(`${BASE_URL}/admin/projects`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await waitForPageStabilization(page, 2000);

      // Extract href with /admin/projects/[id]
      const projectLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/admin/projects/"]'));
        for (const l of links) {
          const href = l.getAttribute("href") || "";
          const match = href.match(/\/admin\/projects\/([a-zA-Z0-9_-]+)/);
          if (match && match[1] && !["new", "create"].includes(match[1])) {
            return match[1];
          }
        }
        return "";
      });

      if (projectLink) {
        dynamicProjectId = projectLink;
        console.log(`🎯 Found active project ID: ${dynamicProjectId}`);
      } else {
        console.log("ℹ️ No dynamic project ID found from DOM, will fallback to /admin/bim and /admin/projects");
      }
    } catch (e) {
      console.log(`⚠️ Project check error: ${e.message}`);
    }

    // LIST OF TARGET SCREENS TO CAPTURE
    const screens = [
      {
        id: "01-dashboard",
        name: "Yönetici Ana Kontrol Paneli (Executive Dashboard)",
        url: `${BASE_URL}/admin`,
        waitMs: 3500,
      },
      {
        id: "02-site-map",
        name: "Saha, Geofence & BLE IoT Şantiye Haritası",
        url: `${BASE_URL}/admin/map`,
        waitMs: 4000,
      },
      {
        id: "03-projects",
        name: "Proje Portföyü & İlerleme Takibi",
        url: `${BASE_URL}/admin/projects`,
        waitMs: 3000,
      },
      {
        id: "04-bim-3d",
        name: "3D Federated BIM & X-Ray Duvar İçi Görüş Motoru",
        url: dynamicProjectId
          ? `${BASE_URL}/admin/projects/${dynamicProjectId}?tab=bim`
          : `${BASE_URL}/admin/bim`,
        fallbackUrl: `${BASE_URL}/admin/bim`,
        waitMs: 5000, // Extra wait for WebGL canvas and 3D models
      },
      {
        id: "05-ai-vision",
        name: "AI Blueprint Vision & Otomatik Metraj / BoQ",
        url: `${BASE_URL}/admin/ai-vision`,
        fallbackUrl: `${BASE_URL}/admin/boq`,
        waitMs: 3500,
      },
      {
        id: "06-finance",
        name: "Finans, Nakit Akışı & Otomatik Hakediş Yönetimi",
        url: `${BASE_URL}/admin/finance`,
        fallbackUrl: `${BASE_URL}/admin/progress-payments`,
        waitMs: 3500,
      },
      {
        id: "07-subcontractor",
        name: "Taşeron Yönetimi & İmalat Kanıtı (Work Proof)",
        url: `${BASE_URL}/admin/subcontractors`,
        fallbackUrl: `${BASE_URL}/admin/subcontractor-inspections`,
        waitMs: 3000,
      },
      {
        id: "08-inspection",
        name: "Akıllı Yapı Denetim, YİBF & Beton/Karot Testleri",
        url: `${BASE_URL}/admin/inspections`,
        fallbackUrl: `${BASE_URL}/admin/inspection`,
        waitMs: 3500,
      },
      {
        id: "09-ohs-isg",
        name: "İş Sağlığı ve Güvenliği (İSG) & Risk Bölgeleri",
        url: `${BASE_URL}/admin/isg`,
        fallbackUrl: `${BASE_URL}/admin/ohs`,
        waitMs: 3500,
      },
      {
        id: "10-logistics",
        name: "Depo, Lojistik, İrsaliye & Malzeme Kabul",
        url: `${BASE_URL}/admin/logistics`,
        fallbackUrl: `${BASE_URL}/admin/procurement`,
        waitMs: 3000,
      },
      {
        id: "11-personnel",
        name: "İK, QR/GPS Puantaj & Şantiye Günlüğü",
        url: `${BASE_URL}/admin/personel`,
        fallbackUrl: `${BASE_URL}/admin/attendance`,
        waitMs: 3000,
      },
      {
        id: "12-executive-center",
        name: "Proje Kontrol Merkezi & Canlı İmalat Metrikleri",
        url: `${BASE_URL}/admin/project-control-center`,
        fallbackUrl: `${BASE_URL}/admin/executive-dashboard`,
        waitMs: 3500,
      },
    ];

    const captureResults = [];

    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const targetFile = path.join(SCREENSHOT_DIR, `${screen.id}.png`);
      console.log(`\n📸 [${i + 1}/${screens.length}] Capturing: ${screen.name} ...`);
      console.log(`🔗 URL: ${screen.url}`);

      try {
        let response = await page.goto(screen.url, {
          waitUntil: "domcontentloaded",
          timeout: 25000,
        });

        // Check if 404 or bad status and fallback is available
        if ((!response || response.status() >= 400) && screen.fallbackUrl) {
          console.log(`⚠️ Primary URL returned ${response?.status()}, trying fallback: ${screen.fallbackUrl}`);
          await page.goto(screen.fallbackUrl, {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });
        }

        await waitForPageStabilization(page, screen.waitMs);

        // If WebGL canvas exists, ensure it is rendered
        await page.evaluate(() => {
          const canvases = document.querySelectorAll("canvas");
          canvases.forEach((c) => {
            // trigger repaint if needed
            c.dispatchEvent(new Event("resize"));
          });
        });

        await page.screenshot({
          path: targetFile,
          fullPage: false, // Standard viewport 1920x1080
        });

        const stats = fs.statSync(targetFile);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`💾 Saved: ${screen.id}.png (${sizeKB} KB)`);

        captureResults.push({
          id: screen.id,
          name: screen.name,
          path: targetFile,
          sizeKB,
          success: stats.size > 20000,
        });
      } catch (err) {
        console.error(`❌ Error capturing ${screen.id}:`, err.message);
        if (screen.fallbackUrl) {
          try {
            console.log(`🔄 Retrying with fallback: ${screen.fallbackUrl}`);
            await page.goto(screen.fallbackUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
            await waitForPageStabilization(page, screen.waitMs);
            await page.screenshot({ path: targetFile });
            const stats = fs.statSync(targetFile);
            captureResults.push({
              id: screen.id,
              name: screen.name,
              path: targetFile,
              sizeKB: (stats.size / 1024).toFixed(1),
              success: stats.size > 20000,
            });
            console.log(`💾 Saved via fallback: ${screen.id}.png`);
          } catch (e2) {
            console.error(`❌ Fallback also failed for ${screen.id}:`, e2.message);
          }
        }
      }
    }

    console.log("\n=======================================================");
    console.log("📊 CAPTURE SUMMARY:");
    captureResults.forEach((r) => {
      console.log(`- ${r.id}: ${r.sizeKB} KB [${r.success ? "OK" : "WARNING: LOW SIZE"}]`);
    });
    console.log("=======================================================\n");

    return captureResults;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("FATAL CAPTURE ERROR:", err);
  process.exit(1);
});
