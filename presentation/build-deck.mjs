/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Enterprise Comprehensive Deck Builder
 * Reads presentation/module-manifest.json and builds:
 * 1. presentation/Nexa-ERP-Kapsamli-Sistem-Sunumu.pdf (Playwright 16:9)
 * 2. presentation/Nexa-ERP-Kapsamli-Sistem-Sunumu.pptx (Editable PPTX)
 */

import { chromium } from "playwright";
import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, "module-manifest.json");
const HTML_FILE = path.join(__dirname, "deck.html");
const PDF_OUTPUT = path.join(__dirname, "Nexa-ERP-Kapsamli-Sistem-Sunumu.pdf");
const PPTX_OUTPUT = path.join(__dirname, "Nexa-ERP-Kapsamli-Sistem-Sunumu.pptx");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// Regenerate HTML to be 100% in sync with manifest
console.log("🔄 Regenerating presentation/deck.html from manifest...");
execSync(`node "${path.join(__dirname, "generate-deck-html.mjs")}"`, { stdio: "inherit" });

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

async function exportPdf() {
  console.log("\n📄 Rendering Comprehensive 16:9 PDF Presentation via Playwright...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });

    const fileUrl = `file://${HTML_FILE.replace(/\\/g, "/")}`;
    console.log(`🌐 Loading HTML deck: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60000 });

    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    await page.waitForTimeout(2000);

    const imageReport = await page.evaluate(() => {
      let total = 0;
      let broken = 0;
      const brokenList = [];
      document.querySelectorAll("img").forEach((img) => {
        total++;
        if (!img.complete || img.naturalWidth === 0) {
          broken++;
          brokenList.push(img.src);
        }
      });
      return { total, broken, brokenList };
    });

    console.log(`🖼️ Image Check: ${imageReport.total} total images, ${imageReport.broken} broken.`);
    if (imageReport.broken > 0) {
      console.warn("⚠️ Warning: Broken images found:", imageReport.brokenList);
    } else {
      console.log("✅ Zero broken images! (100% naturalWidth > 0)");
    }

    console.log("🖨️ Exporting PDF (1920x1080)...");
    await page.pdf({
      path: PDF_OUTPUT,
      width: "1920px",
      height: "1080px",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const stats = fs.statSync(PDF_OUTPUT);
    console.log(`✅ PDF Generated: ${PDF_OUTPUT} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  } finally {
    await browser.close();
  }
}

async function exportPptx() {
  console.log("\n📊 Generating Editable 16:9 PPTX Presentation from Manifest...");
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "NXA Software - Umut Erdoğan";
  pptx.company = "NXA Software";
  pptx.revision = "4.2";
  pptx.subject = "Nexa ERP Kapsamlı Sistem Mimarisi ve Ürün Katalogu";
  pptx.title = "Nexa ERP Kurumsal Sistem Mimarisi";

  const BG_COLOR = "04060D";
  const CARD_BG = "0D1527";
  const TEXT_WHITE = "FFFFFF";
  const TEXT_MUTED = "94A3B8";
  const ACCENT_BLUE = "38BDF8";

  function getImgPath(fileName) {
    const fullPath = path.join(SCREENSHOT_DIR, fileName);
    if (fs.existsSync(fullPath)) return fullPath;
    const fallback = path.join(SCREENSHOT_DIR, "01-executive-dashboard.png");
    return fs.existsSync(fallback) ? fallback : null;
  }

  function addSlideHeader(slide, category, title, counterText, catColor = ACCENT_BLUE) {
    slide.background = { color: BG_COLOR };

    // Brand Pill
    slide.addText("NX", {
      x: 0.6,
      y: 0.4,
      w: 0.5,
      h: 0.35,
      fill: { color: "1E40AF" },
      color: TEXT_WHITE,
      bold: true,
      fontSize: 13,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    // Category & Title
    slide.addText(
      [
        { text: category.toUpperCase() + "\n", options: { fontSize: 8.5, bold: true, color: catColor } },
        { text: title, options: { fontSize: 17, bold: true, color: TEXT_WHITE } },
      ],
      { x: 1.3, y: 0.35, w: 10.0, h: 0.75, valign: "top" }
    );

    // Counter
    slide.addText(counterText, {
      x: 11.7,
      y: 0.4,
      w: 1.0,
      h: 0.35,
      fill: { color: "162033" },
      color: "64748B",
      fontSize: 9.5,
      bold: true,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    // Divider Line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.6,
      y: 1.15,
      w: 12.1,
      h: 0.02,
      fill: { color: "1E293B" },
    });

    // Footer
    slide.addText("© 2026 NXA Software • Nexa ERP Enterprise • nxerp.com.tr", {
      x: 0.6,
      y: 7.05,
      w: 6.0,
      h: 0.3,
      fontSize: 8.5,
      color: "64748B",
    });
    slide.addText("GİZLİ & KURUMSAL SİSTEM KATALOGU", {
      x: 9.0,
      y: 7.05,
      w: 3.7,
      h: 0.3,
      fontSize: 8.5,
      color: "EF4444",
      align: "right",
      bold: true,
    });
  }

  // Calculate total slides for counter
  let totalSlides = 4;
  manifest.groups.forEach((g) => {
    totalSlides += 1 + g.modules.length;
  });
  totalSlides += 3;

  let currentSlide = 1;

  // 1. COVER SLIDE
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    slide.addText("NX", {
      x: 0.8,
      y: 1.0,
      w: 0.9,
      h: 0.7,
      fill: { color: "2563EB" },
      color: TEXT_WHITE,
      bold: true,
      fontSize: 24,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    slide.addText("NEXA ERP ENTERPRISE v4.2", {
      x: 1.9,
      y: 1.05,
      w: 6.0,
      h: 0.6,
      color: ACCENT_BLUE,
      fontSize: 16,
      bold: true,
      valign: "middle",
    });

    slide.addText("Kurumsal Sistem Mimarisi ve\nKapsamlı Ürün Katalogu", {
      x: 0.8,
      y: 2.0,
      w: 11.5,
      h: 1.8,
      color: TEXT_WHITE,
      fontSize: 36,
      bold: true,
      lineSpacing: 44,
    });

    slide.addText(
      `Şantiyeden Hakedişe, 2D Paftadan 3D BIM ve Yapay Zeka Dijital İkizine: Kod Tabanından Doğrulanmış ${manifest.statistics.totalModules} Modül, ${manifest.statistics.totalPrismaModels} Veritabanı Modeli ve ${manifest.statistics.totalUserRoles} Yetkilendirilmiş Kullanıcı Rolü.`,
      {
        x: 0.8,
        y: 3.9,
        w: 11.0,
        h: 1.0,
        color: TEXT_MUTED,
        fontSize: 14.5,
        lineSpacing: 22,
      }
    );

    const stats = [
      { l: "TOPLAM MODÜL", v: `${manifest.statistics.totalModules} Çekirdek Modül` },
      { l: "VERİTABANI", v: `${manifest.statistics.totalPrismaModels} Prisma Modeli` },
      { l: "YETKİLENDİRME", v: `${manifest.statistics.totalUserRoles} Kullanıcı Rolü` },
      { l: "MİMARİ", v: "Next.js 16 & Three.js" },
    ];

    stats.forEach((s, idx) => {
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8 + idx * 2.95,
        y: 5.3,
        w: 2.75,
        h: 1.1,
        fill: { color: CARD_BG },
        line: { color: "1E3A8A", width: 1 },
      });
      slide.addText(
        [
          { text: s.l + "\n", options: { fontSize: 8.5, color: "64748B", bold: true } },
          { text: s.v, options: { fontSize: 13, color: ACCENT_BLUE, bold: true } },
        ],
        { x: 0.9 + idx * 2.95, y: 5.4, w: 2.55, h: 0.9, valign: "middle" }
      );
    });
    currentSlide++;
  }

  // 2. TABLE OF CONTENTS
  {
    const slide = pptx.addSlide();
    addSlideHeader(slide, "Ekosistem Haritası", "10 Kurumsal Kategori ve Modül Dağılımı", `${currentSlide} / ${totalSlides}`);

    manifest.groups.forEach((g, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.6 + col * 6.1;
      const y = 1.35 + row * 1.08;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 5.9,
        h: 0.98,
        fill: { color: CARD_BG },
        line: { color: g.color.replace("#", ""), width: 1.5 },
      });

      slide.addText(
        [
          { text: `BÖLÜM ${String(idx + 1).padStart(2, "0")}: ${g.title} (${g.modules.length} Modül)\n`, options: { fontSize: 11, bold: true, color: TEXT_WHITE } },
          { text: g.description, options: { fontSize: 9.5, color: TEXT_MUTED } },
        ],
        { x: x + 0.2, y: y + 0.1, w: 5.5, h: 0.78, valign: "middle" }
      );
    });
    currentSlide++;
  }

  // 3. WORKFLOW OVERVIEW
  {
    const slide = pptx.addSlide();
    addSlideHeader(slide, "Olay Örgüsü", "Nexa ERP Uçtan Uca Entegre Veri Akışı", `${currentSlide} / ${totalSlides}`);

    const steps = [
      { n: "01", t: "2D Pafta & AI", d: "PDF/DWG -> Gemini 2.0 -> Otomatik Metraj / BoQ" },
      { n: "02", t: "3D BIM & X-Ray", d: "IFC + DWG -> Federated 3D -> Duvar İçi Görüş" },
      { n: "03", t: "Saha & IoT", d: "Geofence Harita -> BLE Takip -> Mobil AR" },
      { n: "04", t: "Yapı Denetim", d: "e-YİBF -> Beton Kırım/Karot -> Demir Vizesi" },
      { n: "05", t: "Taşeron & Hakediş", d: "Fotoğraflı Kanıt -> Otomatik Kesintiler -> E-Fatura" },
    ];

    steps.forEach((s, idx) => {
      const x = 0.6 + idx * 2.45;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 1.6,
        w: 2.3,
        h: 4.6,
        fill: { color: CARD_BG },
        line: { color: "38BDF8", width: 1.5 },
      });
      slide.addText(
        [
          { text: s.n + "\n\n", options: { fontSize: 24, bold: true, color: ACCENT_BLUE } },
          { text: s.t + "\n\n", options: { fontSize: 14, bold: true, color: TEXT_WHITE } },
          { text: s.d, options: { fontSize: 11, color: TEXT_MUTED } },
        ],
        { x: x + 0.15, y: 1.9, w: 2.0, h: 4.0, align: "center", valign: "top" }
      );
    });
    currentSlide++;
  }

  // 4. ROLES MATRIX
  {
    const slide = pptx.addSlide();
    addSlideHeader(slide, "Yetkilendirme", "28 Kullanıcı Rolü & Çok Kiracılı Güvenlik", `${currentSlide} / ${totalSlides}`);

    const rolesList = [
      { g: "YÖNETİM KADROSU", r: "SUPER_ADMIN, ADMIN, PROJECT_MANAGER, INVESTOR, CLIENT", c: "3B82F6" },
      { g: "SAHA TEKNİK EKİP", r: "SITE_MANAGER, ENGINEER, ISG_EXPERT, EQUIPMENT_MANAGER", c: "06B6D4" },
      { g: "YAPI DENETİM & YASAL", r: "INSPECTION_ADMIN, INSPECTOR, AUDITOR, LAB_TECH", c: "10B981" },
      { g: "TAŞERON, İK & FİNANS", r: "SUBCONTRACTOR, FINANCE_MANAGER, MUHASEBE, PROCUREMENT_MANAGER, WORKER, DRIVER", c: "A855F7" },
    ];

    rolesList.forEach((rl, idx) => {
      const y = 1.6 + idx * 1.25;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.6,
        y,
        w: 6.8,
        h: 1.1,
        fill: { color: CARD_BG },
        line: { color: rl.c, width: 1.5 },
      });
      slide.addText(
        [
          { text: rl.g + "\n", options: { fontSize: 12, bold: true, color: rl.c } },
          { text: rl.r, options: { fontSize: 10.5, color: TEXT_WHITE } },
        ],
        { x: 0.8, y: y + 0.1, w: 6.4, h: 0.9, valign: "middle" }
      );
    });

    // Multi-Tenancy Card on right
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 7.7,
      y: 1.6,
      w: 5.0,
      h: 5.0,
      fill: { color: CARD_BG },
      line: { color: "38BDF8", width: 1.5 },
    });

    slide.addText(
      [
        { text: "SAAS ÇOK KİRACILIK & WHITE-LABEL\n\n", options: { fontSize: 14, bold: true, color: ACCENT_BLUE } },
        { text: "• Özel Domain Desteği: erp.sirketiniz.com üzerinden güvenli erişim.\n\n", options: { fontSize: 11.5, color: TEXT_WHITE } },
        { text: "• Dinamik Marka Teması: Firma logosu ve kurumsal renk paleti.\n\n", options: { fontSize: 11.5, color: TEXT_WHITE } },
        { text: "• %100 Veri İzolasyonu: TenantId bazında tam veritabanı bariyeri.\n\n", options: { fontSize: 11.5, color: TEXT_WHITE } },
        { text: "• Modüler Lisanslama: BIM, AI Vision veya Drone özelliklerini firma bazlı açıp kapatabilme.", options: { fontSize: 11.5, color: TEXT_WHITE } },
      ],
      { x: 8.0, y: 1.9, w: 4.4, h: 4.4, valign: "top", lineSpacing: 18 }
    );
    currentSlide++;
  }

  // DYNAMIC MODULES ITERATION
  manifest.groups.forEach((group, gIdx) => {
    const cleanGroupColor = group.color.replace("#", "");

    // Group Divider Slide
    const divSlide = pptx.addSlide();
    addSlideHeader(divSlide, `Bölüm ${String(gIdx + 1).padStart(2, "0")} Girişi`, group.title, `${currentSlide} / ${totalSlides}`, cleanGroupColor);

    divSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.0,
      y: 1.6,
      w: 11.3,
      h: 5.0,
      fill: { color: CARD_BG },
      line: { color: cleanGroupColor, width: 2 },
    });

    divSlide.addText(
      [
        { text: group.title + "\n\n", options: { fontSize: 24, bold: true, color: TEXT_WHITE } },
        { text: group.description + "\n\n", options: { fontSize: 14, color: TEXT_MUTED } },
        { text: `BU BÖLÜMDE İNCELENEN ${group.modules.length} ÇEKİRDEK MODÜL:\n`, options: { fontSize: 12, bold: true, color: cleanGroupColor } },
      ],
      { x: 1.4, y: 1.9, w: 10.5, h: 1.8, valign: "top" }
    );

    // Grid of sub-modules
    group.modules.forEach((m, mIdx) => {
      const col = mIdx % 3;
      const row = Math.floor(mIdx / 3);
      const x = 1.4 + col * 3.6;
      const y = 3.8 + row * 0.9;

      divSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.4,
        h: 0.75,
        fill: { color: "111827" },
        line: { color: "1E293B", width: 1 },
      });
      divSlide.addText(
        [
          { text: `0${mIdx + 1}. ${m.name}\n`, options: { fontSize: 10.5, bold: true, color: TEXT_WHITE } },
          { text: m.route, options: { fontSize: 9, color: "64748B" } },
        ],
        { x: x + 0.15, y: y + 0.08, w: 3.1, h: 0.6, valign: "middle" }
      );
    });
    currentSlide++;

    // Detail Slide for Each Module
    group.modules.forEach((mod) => {
      const modSlide = pptx.addSlide();
      addSlideHeader(modSlide, group.title, mod.name, `${currentSlide} / ${totalSlides}`, cleanGroupColor);

      // Left: Browser mockup frame & screenshot
      modSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.6,
        y: 1.4,
        w: 6.9,
        h: 5.3,
        fill: { color: "0B1120" },
        line: { color: "1E293B", width: 1.5 },
      });

      // Browser Header simulation
      modSlide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.6,
        y: 1.4,
        w: 6.9,
        h: 0.35,
        fill: { color: "0E1628" },
      });
      modSlide.addText(`🔒 https://nxerp.com.tr${mod.route}`, {
        x: 1.5,
        y: 1.42,
        w: 5.0,
        h: 0.3,
        fontSize: 8.5,
        color: "94A3B8",
      });

      // Screenshot Image
      const imgPath = getImgPath(`${mod.screenshotId}.png`);
      if (imgPath) {
        modSlide.addImage({
          path: imgPath,
          x: 0.65,
          y: 1.8,
          w: 6.8,
          h: 4.8,
          sizing: { type: "contain", w: 6.8, h: 4.8 },
        });
      }

      // Right: Information Card
      modSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 7.8,
        y: 1.4,
        w: 4.9,
        h: 5.3,
        fill: { color: CARD_BG },
        line: { color: cleanGroupColor, width: 1.5 },
      });

      // Content text array
      const textArr = [
        { text: "ÖNE ÇIKAN SEKMELER & GÖRÜNÜMLER:\n", options: { fontSize: 10, bold: true, color: cleanGroupColor } },
        { text: mod.tabsOrViews.join(" • ") + "\n\n", options: { fontSize: 10, color: TEXT_WHITE } },
        { text: "YÜRÜTÜLEN KRİTİK İŞLEMLER:\n", options: { fontSize: 10, bold: true, color: cleanGroupColor } },
        ...mod.keyActions.map((a) => ({ text: `• ${a}\n`, options: { fontSize: 9.5, color: TEXT_MUTED } })),
        { text: "\nOLAY ÖRGÜSÜ AKIŞI (WORKFLOW):\n", options: { fontSize: 10, bold: true, color: cleanGroupColor } },
        { text: mod.workflow + "\n\n", options: { fontSize: 9.5, color: "CBD5E1" } },
        { text: "VERİTABANI MODELLERİ:\n", options: { fontSize: 9, bold: true, color: "64748B" } },
        { text: mod.prismaModels.join(", ") + "\n\n", options: { fontSize: 8.5, color: "60A5FA" } },
        { text: "ERİŞEBİLEN ROLLER:\n", options: { fontSize: 9, bold: true, color: "64748B" } },
        { text: mod.roles.join(", "), options: { fontSize: 8.5, color: "94A3B8" } },
      ];

      modSlide.addText(textArr, {
        x: 8.0,
        y: 1.6,
        w: 4.5,
        h: 4.9,
        valign: "top",
        lineSpacing: 14,
      });

      currentSlide++;
    });
  });

  // CLOSING SLIDES
  // Tech stack
  {
    const slide = pptx.addSlide();
    addSlideHeader(slide, "Teknoloji Omurgası", "Üretim Ortamında Doğrulanmış Teknoloji Yığını", `${currentSlide} / ${totalSlides}`);

    const stacks = [
      { n: "Next.js 16 & React 19", d: "RSC Server Actions & SSR", c: "38BDF8" },
      { n: "PostgreSQL & Prisma v6", d: "153 Model, ACID Transactions", c: "34D399" },
      { n: "Google Gemini 2.0 API", d: "Multimodal AI & OCR Motoru", c: "A855F7" },
      { n: "Three.js & Web-IFC", d: "GPU Render & LibreDWG WASM", c: "06B6D4" },
      { n: "Turf.js & Leaflet GIS", d: "Geofencing & Drone Ortofoto", c: "10B981" },
      { n: "Banka Seviyesi Güvenlik", d: "AES-256 S3 & Audit Logs", c: "EF4444" },
    ];

    stacks.forEach((st, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.6 + col * 4.1;
      const y = 1.6 + row * 2.5;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.8,
        h: 2.2,
        fill: { color: CARD_BG },
        line: { color: st.c, width: 1.5 },
      });
      slide.addText(
        [
          { text: st.n + "\n\n", options: { fontSize: 14, bold: true, color: st.c } },
          { text: st.d, options: { fontSize: 11, color: TEXT_MUTED } },
        ],
        { x: x + 0.25, y: y + 0.3, w: 3.3, h: 1.6, valign: "top" }
      );
    });
    currentSlide++;
  }

  // Final Closing Slide
  {
    const slide = pptx.addSlide();
    addSlideHeader(slide, "Canlı Erişim", "Nexa ERP Kurumsal İletişim", `${currentSlide} / ${totalSlides}`);

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.5,
      y: 1.6,
      w: 10.3,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: "38BDF8", width: 2 },
    });

    slide.addText("NX", {
      x: 6.1,
      y: 2.0,
      w: 1.1,
      h: 0.7,
      fill: { color: "2563EB" },
      color: TEXT_WHITE,
      bold: true,
      fontSize: 24,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    slide.addText("Nexa ERP Canlı Demo & Kurumsal İletişim", {
      x: 2.0,
      y: 2.9,
      w: 9.3,
      h: 0.5,
      color: TEXT_WHITE,
      fontSize: 22,
      bold: true,
      align: "center",
    });

    slide.addText("Türkiye'nin lider inşaat, taahhüt ve yapı denetim şirketleri arasına katılın.", {
      x: 2.0,
      y: 3.5,
      w: 9.3,
      h: 0.4,
      color: TEXT_MUTED,
      fontSize: 13,
      align: "center",
    });

    const infoCards = [
      { top: "CANLI PLATFORM", mid: "nxerp.com.tr", bot: "Web & Bulut Portalı", col: "38BDF8" },
      { top: "KURUMSAL İLETİŞİM", mid: "info@nxerp.com.tr", bot: "NXA Software Teknolojileri", col: TEXT_WHITE },
      { top: "MOBİL AR ERİŞİMİ", mid: "iOS & Android", bot: "Kamera X-Ray Görüşü", col: "10B981" },
    ];

    infoCards.forEach((c, idx) => {
      const x = 2.0 + idx * 3.2;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 4.2,
        w: 2.9,
        h: 1.4,
        fill: { color: "111827" },
        line: { color: "1E293B", width: 1 },
      });

      slide.addText(
        [
          { text: c.top + "\n", options: { fontSize: 8.5, color: "64748B", bold: true } },
          { text: c.mid + "\n", options: { fontSize: 13, bold: true, color: c.col } },
          { text: c.bot, options: { fontSize: 9.5, color: TEXT_MUTED } },
        ],
        { x: x + 0.1, y: 4.35, w: 2.7, h: 1.1, align: "center", valign: "middle" }
      );
    });
  }

  console.log("💾 Writing comprehensive PPTX presentation to disk...");
  await pptx.writeFile({ fileName: PPTX_OUTPUT });
  const stats = fs.statSync(PPTX_OUTPUT);
  console.log(`✅ PPTX Generated: ${PPTX_OUTPUT} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

async function main() {
  console.log("🚀 Starting Comprehensive Presentation Build Pipeline (PDF + PPTX)...");
  await exportPdf();
  await exportPptx();
  console.log("\n🎉 ALL COMPREHENSIVE PRESENTATION ASSETS GENERATED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("FATAL BUILD ERROR:", err);
  process.exit(1);
});
