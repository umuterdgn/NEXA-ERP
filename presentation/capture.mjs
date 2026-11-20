/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Resilient Dynamic Presentation Screenshot Capture
 * Direct www.nxerp.com.tr targeting with commit-based navigation and fallback recovery.
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, "module-manifest.json");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// Use WWW to avoid 308 Permanent Redirects
const BASE_URL = process.env.BASE_URL || "https://www.nxerp.com.tr";
const DEMO_EMAIL = process.env.DEMO_EMAIL || "admin@nexa.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "nexa2026";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function cleanTransientAndBrokenElements(page) {
  return await page.evaluate(() => {
    // 1. Hide toasts and popups
    const overlaySelectors = [
      '[role="status"]',
      '[data-sonner-toaster]',
      '.toast',
      '.toaster',
      '#toast-container',
      '[data-hot-toast]',
      'div[style*="z-index: 9999"]',
    ];
    overlaySelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.display = "none";
      });
    });

    // 2. Clean broken images
    let brokenCount = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        brokenCount++;
        img.style.opacity = "0.7";
        img.style.backgroundColor = "#0F172A";
        img.style.border = "1px solid #1E293B";
      }
    });

    // 3. Zoom Leaflet map to active project if present
    if (window.L && window.L.Map) {
      try {
        const mapElements = document.querySelectorAll(".leaflet-container");
        mapElements.forEach((el) => {
          const map = (el)._leaflet_map;
          if (map) {
            map.setView([41.0833, 28.8050], 16);
            map.invalidateSize();
          }
        });
      } catch {
        // ignore map errors
      }
    }

    // 4. Force trigger canvas resize
    document.querySelectorAll("canvas").forEach((canvas) => {
      canvas.dispatchEvent(new Event("resize"));
    });

    return { brokenCount };
  });
}

async function main() {
  console.log("🚀 Starting Resilient Dynamic Presentation Capture...");
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const totalModules = manifest.statistics.totalModules;

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
    deviceScaleFactor: 2,
    colorScheme: "dark",
    locale: "tr-TR",
  });

  let page = await context.newPage();

  try {
    // 1. LOGIN
    console.log(`\n🔑 Authenticating at: ${BASE_URL}/tr/login ...`);
    await page.goto(`${BASE_URL}/tr/login`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="text"], input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await page.waitForTimeout(400);

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      console.log(`✅ Login successful! Redirected to: ${page.url()}`);
    } catch {
      console.log(`⚠️ URL check timed out, current: ${page.url()}`);
    }

    await page.waitForTimeout(2000);

    // 2. ITERATE ALL MODULES
    let moduleIdx = 0;
    const report = [];

    for (const group of manifest.groups) {
      console.log(`\n📂 ----------------------------------------------------`);
      console.log(`📂 GROUP: ${group.title} (${group.modules.length} Modules)`);
      console.log(`📂 ----------------------------------------------------`);

      for (const mod of group.modules) {
        moduleIdx++;
        const targetFile = path.join(SCREENSHOT_DIR, `${mod.screenshotId}.png`);

        // Targeted route customization for richest screens
        let targetRoute = mod.route;
        if (mod.screenshotId === "06-federated-bim-3d") {
          targetRoute = "/admin/projects/cmvzn2rfw000d9gugjwp2rf5v?tab=bim";
        } else if (mod.screenshotId === "07-drone-photogrammetry") {
          targetRoute = "/admin/projects/cmvzn2rfw000d9gugjwp2rf5v?tab=drone";
        }

        const fullUrl = targetRoute.startsWith("http") ? targetRoute : `${BASE_URL}${targetRoute}`;

        console.log(`\n📸 [${moduleIdx}/${totalModules}] Capturing: ${mod.name}`);
        console.log(`🔗 Target URL: ${fullUrl}`);

        const itemReport = {
          id: mod.id,
          name: mod.name,
          route: targetRoute,
          screenshotFile: `${mod.screenshotId}.png`,
          status: "PENDING",
          sizeKB: 0,
        };

        try {
          // Use commit-based navigation to prevent long-poll or websocket lock
          await page.goto(fullUrl, { waitUntil: "commit", timeout: 25000 });
          try {
            await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
          } catch {
            // continue even if domcontentloaded took longer
          }

          let extraWait = 2500;

          // 1. 3D BIM (s. 12): click tab & wait for WebGL
          if (mod.screenshotId === "06-federated-bim-3d" || targetRoute.includes("tab=bim")) {
            extraWait = 6500;
            try {
              const bimTabBtn = page.locator('button:has-text("3D BIM"), button:has-text("BIM"), [data-value="bim"]').first();
              if (await bimTabBtn.isVisible()) {
                await bimTabBtn.click().catch(() => {});
              }
            } catch {
              // ignore
            }
          }

          // 2. 4D Drone (s. 13): click tab & wait for photogrammetry
          if (mod.screenshotId === "07-drone-photogrammetry" || targetRoute.includes("tab=drone")) {
            extraWait = 5000;
            try {
              const droneTabBtn = page.locator('button:has-text("Drone"), button:has-text("4D Drone"), [data-value="drone"]').first();
              if (await droneTabBtn.isVisible()) {
                await droneTabBtn.click().catch(() => {});
              }
            } catch {
              // ignore
            }
          }

          // 3. AI Vision (s. 16): upload sample image to trigger AI analysis results
          if (mod.screenshotId === "10-ai-vision-analysis" || targetRoute.includes("ai-vision")) {
            extraWait = 3500;
            try {
              const fileInput = page.locator('input[type="file"]').first();
              const sampleImg = path.join(__dirname, "..", "public", "about-placeholder.png");
              if (fs.existsSync(sampleImg) && await fileInput.count() > 0) {
                await fileInput.setInputFiles(sampleImg).catch(() => {});
                console.log("  ✦ Uploaded sample image to AI Vision for live detection results!");
                await page.waitForTimeout(3000);
              }
            } catch {
              // ignore
            }
          }

          // 4. Smart Documents OCR (s. 18): select project in dropdown
          if (mod.screenshotId === "12-smart-documents-ocr" || targetRoute.includes("smart-documents")) {
            extraWait = 3000;
            try {
              const select = page.locator("select").first();
              if (await select.isVisible()) {
                const options = await select.locator("option").all();
                if (options.length > 1) {
                  const val = await options[1].getAttribute("value");
                  if (val) {
                    await select.selectOption(val);
                    console.log(`  ✦ Selected project ${val} in Smart Documents OCR!`);
                    await page.waitForTimeout(1500);
                  }
                }
              }
            } catch {
              // ignore
            }
          }

          // 5. GIS Map (s. 19): extra wait for tiles and radar pins
          if (mod.screenshotId === "13-site-gis-map" || targetRoute.includes("/map")) {
            extraWait = 4000;
          }

          await page.waitForTimeout(extraWait);
          await cleanTransientAndBrokenElements(page);

          await page.screenshot({
            path: targetFile,
            fullPage: false,
          });

          const stats = fs.statSync(targetFile);
          const sizeKB = (stats.size / 1024).toFixed(1);
          itemReport.sizeKB = Number(sizeKB);
          itemReport.status = stats.size > 20000 ? "SUCCESS" : "WARNING_LOW_SIZE";

          console.log(`💾 Saved: ${mod.screenshotId}.png (${sizeKB} KB) [${itemReport.status}]`);
        } catch (err) {
          console.error(`❌ Capture error for ${mod.name}:`, err.message);
          itemReport.status = `FAILED: ${err.message}`;

          // If navigation failed, recover the page so next one works
          try {
            await page.close();
            page = await context.newPage();
          } catch {
            // ignore
          }

          // Fallback copy if file doesn't exist
          const fallback = path.join(SCREENSHOT_DIR, "01-executive-dashboard.png");
          if (fs.existsSync(fallback) && !fs.existsSync(targetFile)) {
            fs.copyFileSync(fallback, targetFile);
            console.log(`ℹ️ Created fallback copy for ${mod.screenshotId}.png`);
          }
        }

        report.push(itemReport);
      }
    }

    const reportPath = path.join(__dirname, "capture-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`\n🎉 All captures complete! Report saved to: ${reportPath}`);
    return report;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
