/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Automated Presentation Build Script
 * Generates both:
 * 1. Nexa-ERP-Tanitim-Sunumu.pdf (via Playwright Chromium with 16:9 custom page size)
 * 2. Nexa-ERP-Tanitim-Sunumu.pptx (via pptxgenjs editable presentation)
 */

import { chromium } from "playwright";
import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.join(__dirname, "deck.html");
const PDF_OUTPUT = path.join(__dirname, "Nexa-ERP-Tanitim-Sunumu.pdf");
const PPTX_OUTPUT = path.join(__dirname, "Nexa-ERP-Tanitim-Sunumu.pptx");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

async function exportPdf() {
  console.log("📄 Generating 16:9 Corporate PDF Presentation...");
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
    await page.goto(fileUrl, { waitUntil: "networkidle" });

    // Wait for custom web fonts (Outfit, Plus Jakarta Sans) to be completely ready
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    await page.waitForTimeout(1500);

    console.log("🖨️ Rendering to PDF (1920x1080 per slide)...");
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
  console.log("\n📊 Generating Editable 16:9 PPTX Presentation...");
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "NXA Software - Umut Erdoğan";
  pptx.company = "NXA Software";
  pptx.revision = "4.2";
  pptx.subject = "Nexa ERP Kurumsal Ürün Tanıtım ve Sistem Mimarisi Sunumu";
  pptx.title = "Nexa ERP Tanıtım Sunumu";

  const BG_COLOR = "050811";
  const CARD_BG = "0D1527";
  const TEXT_WHITE = "FFFFFF";
  const TEXT_MUTED = "94A3B8";
  const ACCENT_BLUE = "38BDF8";
  const ACCENT_CYAN = "06B6D4";
  const ACCENT_PURPLE = "A855F7";
  const ACCENT_GREEN = "10B981";
  const ACCENT_AMBER = "F59E0B";

  // Helper function to add standard slide header
  function addHeader(slide, category, title, counterText) {
    slide.background = { color: BG_COLOR };

    // Brand Pill
    slide.addText("NX", {
      x: 0.8,
      y: 0.5,
      w: 0.6,
      h: 0.4,
      fill: { color: "1E40AF" },
      color: TEXT_WHITE,
      bold: true,
      fontSize: 14,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    // Category & Title
    slide.addText(
      [
        { text: category.toUpperCase() + "\n", options: { fontSize: 9, bold: true, color: ACCENT_BLUE } },
        { text: title, options: { fontSize: 20, bold: true, color: TEXT_WHITE } },
      ],
      { x: 1.6, y: 0.45, w: 9.5, h: 0.8, valign: "top" }
    );

    // Counter
    slide.addText(counterText, {
      x: 11.5,
      y: 0.5,
      w: 1.0,
      h: 0.4,
      fill: { color: "162033" },
      color: "64748B",
      fontSize: 10,
      bold: true,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    // Top Divider Line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 11.7,
      h: 0.02,
      fill: { color: "1E293B" },
    });

    // Footer
    slide.addText("© 2026 NXA Software • Nexa ERP Enterprise • nxerp.com.tr", {
      x: 0.8,
      y: 7.0,
      w: 6.0,
      h: 0.3,
      fontSize: 9,
      color: "64748B",
    });
    slide.addText("GİZLİ & KURUMSAL SUNUM", {
      x: 9.0,
      y: 7.0,
      w: 3.5,
      h: 0.3,
      fontSize: 9,
      color: "EF4444",
      align: "right",
      bold: true,
    });
  }

  // Helper for image exists check
  function getImgPath(fileName) {
    const fullPath = path.join(SCREENSHOT_DIR, fileName);
    if (fs.existsSync(fullPath)) return fullPath;
    const fallback = path.join(SCREENSHOT_DIR, "01-dashboard.png");
    return fs.existsSync(fallback) ? fallback : null;
  }

  // ==========================================
  // SLIDE 1: COVER
  // ==========================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    slide.addText("NX", {
      x: 1.0,
      y: 1.2,
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
      x: 2.1,
      y: 1.25,
      w: 6.0,
      h: 0.6,
      color: ACCENT_BLUE,
      fontSize: 16,
      bold: true,
      valign: "middle",
    });

    slide.addText("Şantiyeden Hakedişe,\n2D Paftadan 3D Yapay Zeka Motoruna", {
      x: 1.0,
      y: 2.2,
      w: 11.0,
      h: 1.8,
      color: TEXT_WHITE,
      fontSize: 36,
      bold: true,
      lineSpacing: 44,
    });

    slide.addText(
      "Modern ConTech & Dijital İkiz Ekosistemi: AI Vision ile Paftadan Otomatik Metraj, 3D Federated BIM, IoT Şantiye Haritası, e-YİBF Yapı Denetim ve Otomatik Hakediş Yönetimi.",
      {
        x: 1.0,
        y: 4.1,
        w: 10.5,
        h: 1.0,
        color: TEXT_MUTED,
        fontSize: 15,
        lineSpacing: 22,
      }
    );

    // 4 Key Pills
    const metrics = [
      { label: "MİMARİ VE METRAJ", val: "Gemini 2.0 AI Vision" },
      { label: "3D DİJİTAL İKİZ", val: "Web-IFC & X-Ray BIM" },
      { label: "SAHA VE LOJİSTİK", val: "BLE & Geofence IoT" },
      { label: "YASAL DENETİM", val: "e-YİBF & Karot Testi" },
    ];

    metrics.forEach((m, idx) => {
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 1.0 + idx * 2.9,
        y: 5.4,
        w: 2.7,
        h: 1.0,
        fill: { color: CARD_BG },
        line: { color: "1E3A8A", width: 1 },
      });
      slide.addText(
        [
          { text: m.label + "\n", options: { fontSize: 8.5, color: "64748B", bold: true } },
          { text: m.val, options: { fontSize: 13, color: ACCENT_BLUE, bold: true } },
        ],
        {
          x: 1.1 + idx * 2.9,
          y: 5.5,
          w: 2.5,
          h: 0.8,
          valign: "middle",
        }
      );
    });

    slide.addText("© 2026 NXA Software • nxerp.com.tr", {
      x: 1.0,
      y: 6.8,
      w: 5.0,
      h: 0.3,
      fontSize: 10,
      color: "64748B",
    });
  }

  // ==========================================
  // SLIDE 2: THE PROBLEM
  // ==========================================
  {
    const slide = pptx.addSlide();
    addHeader(slide, "Sektörel Zorluklar", "İnşaat Sektöründeki Parçalı Yapı ve Kritik Veri Kayıpları", "02 / 14");

    const problems = [
      {
        title: "2D Pafta & Manuel Metraj Sapması",
        stat: "%18 Maliyet Aşımı",
        desc: "Cetvelle yapılan elle metraj hesapları %20'lere varan demir/beton israfına ve keşif sapmalarına yol açar.",
        color: "EF4444",
      },
      {
        title: "Görünmeyen Tesisat Çakışmaları",
        stat: "3x Kırım Hasarı",
        desc: "Statik kiriş ve havalandırma kanalı çakışmaları sıva yapıldıktan sonra fark edilir; duvar kırma maliyeti doğurur.",
        color: "06B6D4",
      },
      {
        title: "Taşeron & Hakediş İhtilafları",
        stat: "45+ Gün Gecikme",
        desc: "Sahadan fotoğraflı kanıt olmadan düzenlenen hakedişler çift ödeme ve hukuki ihtilaf riskleri üretir.",
        color: "F59E0B",
      },
      {
        title: "YİBF & Yasal Ceza Baskısı",
        stat: "Ruhsat İptali Riski",
        desc: "Gününde sisteme girilmeyen çipli beton kırım ve karot testleri şantiyelerin mühürlenmesine sebep olur.",
        color: "10B981",
      },
    ];

    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 1.6 + row * 2.6;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 5.6,
        h: 2.3,
        fill: { color: CARD_BG },
        line: { color: p.color, width: 1.5 },
      });

      slide.addText(
        [
          { text: p.stat + "\n", options: { fontSize: 18, bold: true, color: p.color } },
          { text: p.title + "\n", options: { fontSize: 15, bold: true, color: TEXT_WHITE } },
          { text: p.desc, options: { fontSize: 11, color: TEXT_MUTED } },
        ],
        { x: x + 0.3, y: y + 0.2, w: 5.0, h: 1.9, valign: "top", lineSpacing: 18 }
      );
    });
  }

  // ==========================================
  // SLIDE 3: ALL-IN-ONE SOLUTION WORKFLOW
  // ==========================================
  {
    const slide = pptx.addSlide();
    addHeader(slide, "Sistem Mimarisi", "Nexa ERP All-in-One Entegre Süreç Olay Örgüsü", "03 / 14");

    const steps = [
      { num: "01", title: "Pafta & AI", sub: "PDF/DWG -> Gemini 2.0 -> Otomatik Metraj / BoQ", color: "3B82F6" },
      { num: "02", title: "3D BIM", sub: "IFC + DWG -> Federated 3D -> X-Ray Duvar Görüşü", color: "06B6D4" },
      { num: "03", title: "Saha & IoT", sub: "Geofence Harita -> BLE Takip -> Mobil AR", color: "A855F7" },
      { num: "04", title: "Yapı Denetim", sub: "e-YİBF -> Beton Kırım & Karot -> Demir Vizesi", color: "10B981" },
      { num: "05", title: "Hakediş", sub: "İmalat Kanıtı -> Otomatik Kesintiler -> E-Fatura", color: "F59E0B" },
    ];

    steps.forEach((s, idx) => {
      const x = 0.8 + idx * 2.35;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 2.0,
        w: 2.2,
        h: 3.8,
        fill: { color: CARD_BG },
        line: { color: s.color, width: 2 },
      });

      slide.addText(
        [
          { text: s.num + "\n", options: { fontSize: 24, bold: true, color: s.color } },
          { text: s.title + "\n\n", options: { fontSize: 16, bold: true, color: TEXT_WHITE } },
          { text: s.sub, options: { fontSize: 11, color: TEXT_MUTED } },
        ],
        { x: x + 0.15, y: 2.3, w: 1.9, h: 3.2, align: "center", valign: "top" }
      );
    });

    slide.addText("Veri Bütünlüğü: Tek bir mimari çizim sisteme yüklendiğinde metraj, 3D model, iş emri ve hakediş anında beslenir.", {
      x: 0.8,
      y: 6.1,
      w: 11.7,
      h: 0.6,
      fill: { color: "111827" },
      color: ACCENT_BLUE,
      fontSize: 12,
      align: "center",
      valign: "middle",
      roundRect: true,
    });
  }

  // ==========================================
  // SLIDE 4: ROLES & MULTI-TENANCY
  // ==========================================
  {
    const slide = pptx.addSlide();
    addHeader(slide, "Yetkilendirme", "28 Kullanıcı Rolü & Çok Kiracılı (Multi-Tenant) Yönetim", "04 / 14");

    const roleGroups = [
      { title: "YÖNETİM KADROSU", roles: "SUPER_ADMIN, ADMIN, PROJECT_MANAGER, INVESTOR", color: "3B82F6" },
      { title: "SAHA TEKNİK EKİP", roles: "SITE_MANAGER, ENGINEER, ISG_EXPERT, EQUIPMENT_MANAGER", color: "06B6D4" },
      { title: "YAPI DENETİM & YASAL", roles: "INSPECTION_ADMIN, INSPECTOR, AUDITOR, LAB_TECH", color: "10B981" },
      { title: "TAŞERON & MUHASEBE", roles: "SUBCONTRACTOR, FINANCE, PROCUREMENT, WORKER, DRIVER", color: "A855F7" },
    ];

    roleGroups.forEach((g, idx) => {
      const x = 0.8;
      const y = 1.7 + idx * 1.15;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 6.5,
        h: 0.95,
        fill: { color: CARD_BG },
        line: { color: g.color, width: 1.5 },
      });
      slide.addText(
        [
          { text: g.title + " — ", options: { fontSize: 12, bold: true, color: g.color } },
          { text: g.roles, options: { fontSize: 11, color: TEXT_WHITE } },
        ],
        { x: x + 0.2, y: y + 0.1, w: 6.1, h: 0.75, valign: "middle" }
      );
    });

    // Right Side: Multi-Tenancy Card
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 7.7,
      y: 1.7,
      w: 4.8,
      h: 4.6,
      fill: { color: CARD_BG },
      line: { color: "38BDF8", width: 1.5 },
    });

    slide.addText(
      [
        { text: "SAAS ÇOK KİRACILIK & WHITE-LABEL\n\n", options: { fontSize: 14, bold: true, color: ACCENT_BLUE } },
        { text: "• Özel Domain Desteği: ", options: { fontSize: 12, bold: true, color: TEXT_WHITE } },
        { text: "erp.sirketiniz.com üzerinden erişim.\n\n", options: { fontSize: 12, color: TEXT_MUTED } },
        { text: "• Dinamik Marka Teması: ", options: { fontSize: 12, bold: true, color: TEXT_WHITE } },
        { text: "Firma logosu, özel buton ve kurumsal renk paleti.\n\n", options: { fontSize: 12, color: TEXT_MUTED } },
        { text: "• %100 Veri İzolasyonu: ", options: { fontSize: 12, bold: true, color: TEXT_WHITE } },
        { text: "TenantId bazında izole veritabanı güvenliği.\n\n", options: { fontSize: 12, color: TEXT_MUTED } },
        { text: "• Modüler Lisanslama: ", options: { fontSize: 12, bold: true, color: TEXT_WHITE } },
        { text: "BIM, AI Vision ve Drone özellikleri paket bazlı açılıp kapanabilir.", options: { fontSize: 12, color: TEXT_MUTED } },
      ],
      { x: 8.0, y: 1.9, w: 4.2, h: 4.2, valign: "top", lineSpacing: 18 }
    );
  }

  // ==========================================
  // SLIDES 5 TO 12: SCREENSHOT-BACKED MODULES
  // ==========================================
  const moduleSlides = [
    {
      counter: "05 / 14",
      cat: "Yapay Zeka & Metraj",
      title: "AI Blueprint Vision & Otomatik Metraj / BoQ Keşif Cetveli",
      img: "05-ai-vision.png",
      badge: "GEMINI 2.0 MULTIMODAL API",
      color: ACCENT_PURPLE,
      bullets: [
        { h: "Mimari Pafta Analizi:", p: "PDF/DWG formatındaki çizimlerden oda mahalli, duvar ve kolon koordinatlarını milimetrik çıkarır." },
        { h: "Bakanlık Poz Eşleşmesi:", p: "Çevre ve Şehircilik Bakanlığı poz numaralarıyla (ör. 15.120.1001) otomatik eşleşerek keşif tablosu oluşturur." },
        { h: "Hacim ve Alan Hesaplama:", p: "Beton m³, kalıp m², sıva ve boya metrajları 15 saniyede hazır hale getirilir." },
      ],
      stat1: "~15 sn",
      label1: "Pafta Analiz Süresi",
      stat2: "%98.4",
      label2: "Metraj Doğruluğu",
    },
    {
      counter: "06 / 14",
      cat: "3D BIM & Dijital İkiz",
      title: "3D Federated BIM Motoru & Sanal X-Ray Tesisat Görünürlüğü",
      img: "04-bim-3d.png",
      badge: "WEB-IFC & THREE.JS SHADERS",
      color: ACCENT_CYAN,
      bullets: [
        { h: "Federated Katman Birleşimi:", p: "Mimari, statik, mekanik HVAC ve elektrik tavalarını tek 3D sahnede bir araya getirir." },
        { h: "X-Ray Duvar İçi Görüş:", p: "Dış duvarları yarı saydam yaparak arkasındaki yangın, su ve elektrik borularını gösterir." },
        { h: "Çakışma Tespiti (Clash):", p: "Kiriş-boru çakışmalarını şantiyede döküm yapılmadan önce yakalayarak kırım maliyetini sıfırlar." },
      ],
      stat1: "60 FPS",
      label1: "Tarayıcı GPU Hızı",
      stat2: "₺180K+",
      label2: "Engellenen Kırım Hasarı",
    },
    {
      counter: "07 / 14",
      cat: "Saha & IoT",
      title: "Şantiye Haritası, Geofencing & BLE Personel / Ekipman Radarı",
      img: "02-site-map.png",
      badge: "GIS & BLUETOOTH LOW ENERGY",
      color: ACCENT_GREEN,
      bullets: [
        { h: "Geofence Sanal Sınırlar:", p: "Şantiye sahası ve tehlike çitleri harita üzerinde belirlenir; işçi giriş-çıkışları otomatik kaydedilir." },
        { h: "BLE Baret ve İkon Takibi:", p: "Kat bazlı dikey konum belirleme ile acil tahliye durumlarında her personelin yeri bilinir." },
        { h: "Drone Ortofoto Entegrasyonu:", p: "İHA ortofoto haritaları harita katmanı olarak yüklenir; hafriyat kübaj hesapları yapılır." },
      ],
      stat1: "< 1 sn",
      label1: "SOS Alarm İletimi",
      stat2: "Canlı",
      label2: "Saha Varlık Radarı",
    },
    {
      counter: "08 / 14",
      cat: "Yönetici Kokpiti",
      title: "Executive Dashboard & Çoklu Proje Kontrol Merkezi",
      img: "01-dashboard.png",
      badge: "REAL-TIME EXECUTIVE BI",
      color: ACCENT_BLUE,
      bullets: [
        { h: "Fiziki vs Nakdi İlerleme:", p: "Sözleşme takvimi ile fiili imalat hızı canlı S-eğrileri ile karşılaştırılır." },
        { h: "Kritik Yol & Bütçe Alarmları:", p: "Gecikme riski taşıyan aktiviteler ve malzeme tedarik krizleri önceden haber verilir." },
        { h: "Günlük AI Şantiye Bülteni:", p: "Tüm şantiyelerdeki beton dökümleri, taşeron mevcudu ve hava durumu tek özette toplanır." },
      ],
      stat1: "%74.2",
      label1: "Portföy Tamamlanma",
      stat2: "360°",
      label2: "Finansal Görünürlük",
    },
    {
      counter: "09 / 14",
      cat: "Finans & Hakediş",
      title: "Otomatik Hakediş (Progress Billing) & Taşeron Kesinti Motoru",
      img: "06-finance.png",
      badge: "OTOMATİK METRAJ MAHSUBU",
      color: ACCENT_AMBER,
      bullets: [
        { h: "Fotoğraflı İmalat Kanıtı:", p: "Taşeron sahada bitirdiği metrajı fotoğrafla bildirir; şantiye şefi sahada tek tıkla onaylar." },
        { h: "Otomatik Kesinti Motoru:", p: "Avans mahsubu, stopaj (%3), teminat kesintisi ve şantiye elektrik/su bedelleri otomatik düşülür." },
        { h: "E-Fatura & Cari Mutabakat:", p: "Onaylanan net tutar cari hesaba aktarılır; muhasebe ile taşeron arasında sıfır itiraz kalır." },
      ],
      stat1: "%100",
      label1: "Kesinti Doğruluğu",
      stat2: "0 Gün",
      label2: "Hakediş İtiraz Süresi",
    },
    {
      counter: "10 / 14",
      cat: "Kalite & Denetim",
      title: "Akıllı Yapı Denetim, YİBF & Beton/Karot Laboratuvar Testleri",
      img: "08-inspection.png",
      badge: "T.C. ÇŞB e-YİBF ENTEGRE",
      color: ACCENT_GREEN,
      bullets: [
        { h: "Beton Kırım & Mukavemet:", p: "Çipli beton numunelerinin 7 ve 28 günlük basınç testleri sisteme girildiğinde standart eğrileri çizilir." },
        { h: "Demir Donatı & Kalıp Vizesi:", p: "Döküm öncesi demir aralıkları sahada incelenir; GPS konumlu dijital vize tutanağı üretilir." },
        { h: "Eksiklik (Deficiency) Takibi:", p: "Tespit edilen uygunsuzluklar giderilip onaylanmadan bir sonraki imalata izin verilmez." },
      ],
      stat1: "%100",
      label1: "Bakanlık Uyum Oranı",
      stat2: "0 Risk",
      label2: "Kayıp Numune Tehdidi",
    },
    {
      counter: "11 / 14",
      cat: "İş Güvenliği & AR",
      title: "İSG Risk Haritası, Acil Durum SOS & Mobil AR (X-Ray) Entegrasyonu",
      img: "09-ohs-isg.png",
      badge: "WEBXR MOBİL AR MOTORU",
      color: ACCENT_PURPLE,
      bullets: [
        { h: "Sahada Mobil AR X-Ray:", p: "Mühendis telefon kamerasını duvara tuttuğunda; arkadaki boru ve kablolar canlı kamera üstüne biner." },
        { h: "Anlık SOS ve Tahliye:", p: "Kritik kaza veya yangın anında tek tuşla tüm şantiyeye harita konumlu tahliye alarmı gönderilir." },
        { h: "KKD Zimmet & Ramak Kala:", p: "Baret, emniyet kemeri ve yelek teslimleri dijital imzayla onaylanır; tehlikeli durumlar arşivlenir." },
      ],
      stat1: "WebXR",
      label1: "Mobil AR Görüşü",
      stat2: "< 3 sn",
      label2: "Acil SOS İletimi",
    },
    {
      counter: "12 / 14",
      cat: "Lojistik & Depo",
      title: "QR İrsaliye Malzeme Kabul, Depo Stok & Şantiye İK Puantajı",
      img: "10-logistics.png",
      badge: "QR SEVKİYAT & GPS PUANTAJ",
      color: ACCENT_BLUE,
      bullets: [
        { h: "QR ile Malzeme Kabul:", p: "Demir, çimento ve hazır beton tırları kapıda QR okutularak sipariş fişiyle anında eşleştirilir." },
        { h: "Ekipman & Yakıt Sayaçları:", p: "İş makinelerinin günlük çalışma saatleri ve yakıt tüketimleri kaydedilerek anomaliler önlenir." },
        { h: "GPS Doğrulamalı Puantaj:", p: "İşçilerin mesai başlangıcı geofence sınırları içinde doğrulanarak gerçek puantaj tutulur." },
      ],
      stat1: "%100",
      label1: "Stok Görünürlüğü",
      stat2: "0 Kaçak",
      label2: "İrsaliyesiz Giriş",
    },
  ];

  moduleSlides.forEach((m) => {
    const slide = pptx.addSlide();
    addHeader(slide, m.cat, m.title, m.counter);

    // Left: Real Screenshot Image
    const imgPath = getImgPath(m.img);
    if (imgPath) {
      slide.addImage({
        path: imgPath,
        x: 0.8,
        y: 1.6,
        w: 6.8,
        h: 4.8,
        roundRect: true,
      });

      slide.addText(m.badge, {
        x: 1.0,
        y: 1.8,
        w: 2.8,
        h: 0.35,
        fill: { color: "0D1527" },
        color: m.color,
        fontSize: 9,
        bold: true,
        align: "center",
        valign: "middle",
        roundRect: true,
      });
    }

    // Right: Content & Bullet Points
    const textArr = [];
    m.bullets.forEach((b) => {
      textArr.push({ text: b.h + " ", options: { fontSize: 13, bold: true, color: TEXT_WHITE } });
      textArr.push({ text: b.p + "\n\n", options: { fontSize: 11.5, color: TEXT_MUTED } });
    });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 7.9,
      y: 1.6,
      w: 4.6,
      h: 4.8,
      fill: { color: CARD_BG },
      line: { color: m.color, width: 1.5 },
    });

    slide.addText(textArr, {
      x: 8.2,
      y: 1.8,
      w: 4.0,
      h: 3.3,
      valign: "top",
      lineSpacing: 18,
    });

    // 2 Metrics at bottom of right card
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 8.2,
      y: 5.3,
      w: 1.9,
      h: 0.85,
      fill: { color: "111827" },
      line: { color: "1E293B", width: 1 },
    });
    slide.addText(
      [
        { text: m.stat1 + "\n", options: { fontSize: 14, bold: true, color: m.color } },
        { text: m.label1, options: { fontSize: 8.5, color: "94A3B8" } },
      ],
      { x: 8.25, y: 5.35, w: 1.8, h: 0.75, align: "center", valign: "middle" }
    );

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 10.3,
      y: 5.3,
      w: 1.9,
      h: 0.85,
      fill: { color: "111827" },
      line: { color: "1E293B", width: 1 },
    });
    slide.addText(
      [
        { text: m.stat2 + "\n", options: { fontSize: 14, bold: true, color: m.color } },
        { text: m.label2, options: { fontSize: 8.5, color: "94A3B8" } },
      ],
      { x: 10.35, y: 5.35, w: 1.8, h: 0.75, align: "center", valign: "middle" }
    );
  });

  // ==========================================
  // SLIDE 13: TECH STACK & SECURITY
  // ==========================================
  {
    const slide = pptx.addSlide();
    addHeader(slide, "Teknoloji Altyapısı", "Modern Teknoloji Yığını & Banka Seviyesinde Güvenlik", "13 / 14");

    const stacks = [
      { name: "Next.js 16 & React 19", role: "App Router, SSR, Server Actions", sub: "Ultra hızlı UI performansı", color: "38BDF8" },
      { name: "PostgreSQL & Prisma v6", role: "150+ İlişkisel Tablo, ACID Garantisi", sub: "Multi-tenant kiracı ayrımı", color: "34D399" },
      { name: "Google Gemini 2.0 Vision", role: "Multimodal AI & OCR Motoru", sub: "Paftadan metraj çıkarımı", color: "A855F7" },
      { name: "Three.js & WebAssembly", role: "WebGL GPU Render & LibreDWG", sub: "IFC/DWG 3D X-Ray modeli", color: "06B6D4" },
      { name: "Banka Seviyesi Güvenlik", role: "AES-256 S3 Şifreleme, Audit Log", sub: "Değiştirilemez denetim izi", color: "EF4444" },
      { name: "React Native & WebXR", role: "Mobil AR & Saha Uygulaması", sub: "Offline-first senkronizasyon", color: "F59E0B" },
    ];

    stacks.forEach((s, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 4.0;
      const y = 1.8 + row * 2.4;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.7,
        h: 2.1,
        fill: { color: CARD_BG },
        line: { color: s.color, width: 1.5 },
      });

      slide.addText(
        [
          { text: s.name + "\n", options: { fontSize: 14, bold: true, color: s.color } },
          { text: s.role + "\n\n", options: { fontSize: 11, bold: true, color: TEXT_WHITE } },
          { text: s.sub, options: { fontSize: 10, color: TEXT_MUTED } },
        ],
        { x: x + 0.25, y: y + 0.2, w: 3.2, h: 1.7, valign: "top" }
      );
    });
  }

  // ==========================================
  // SLIDE 14: CLOSING & DEMO ACCESS
  // ==========================================
  {
    const slide = pptx.addSlide();
    addHeader(slide, "Canlı Erişim", "Nexa ERP ile Şantiyenizi Bugünden Dijitalleştirin", "14 / 14");

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 2.2,
      y: 1.8,
      w: 8.9,
      h: 4.6,
      fill: { color: CARD_BG },
      line: { color: "38BDF8", width: 2 },
    });

    slide.addText("NX", {
      x: 6.2,
      y: 2.1,
      w: 0.9,
      h: 0.6,
      fill: { color: "2563EB" },
      color: TEXT_WHITE,
      bold: true,
      fontSize: 22,
      align: "center",
      valign: "middle",
      roundRect: true,
    });

    slide.addText("Nexa ERP Canlı Demo & Kurumsal İletişim", {
      x: 2.5,
      y: 2.8,
      w: 8.3,
      h: 0.5,
      color: TEXT_WHITE,
      fontSize: 22,
      bold: true,
      align: "center",
    });

    slide.addText("Türkiye'nin öncü inşaat ve yapı denetim şirketleri arasına katılın.", {
      x: 2.5,
      y: 3.3,
      w: 8.3,
      h: 0.4,
      color: TEXT_MUTED,
      fontSize: 13,
      align: "center",
    });

    const infoCards = [
      { top: "CANLI PLATFORM", mid: "nxerp.com.tr", bot: "Web & Bulut Portalı", col: ACCENT_BLUE },
      { top: "DEMO KULLANICISI", mid: "admin@nexa.com", bot: "Super Admin Yetkili", col: TEXT_WHITE },
      { top: "MOBİL AR ERİŞİMİ", mid: "iOS & Android", bot: "Kamera X-Ray Görüşü", col: ACCENT_GREEN },
    ];

    infoCards.forEach((c, idx) => {
      const x = 2.6 + idx * 2.75;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 4.0,
        w: 2.5,
        h: 1.5,
        fill: { color: "111827" },
        line: { color: "1E293B", width: 1 },
      });

      slide.addText(
        [
          { text: c.top + "\n", options: { fontSize: 8.5, color: "64748B", bold: true } },
          { text: c.mid + "\n", options: { fontSize: 13, bold: true, color: c.col } },
          { text: c.bot, options: { fontSize: 9.5, color: TEXT_MUTED } },
        ],
        { x: x + 0.1, y: 4.15, w: 2.3, h: 1.2, align: "center", valign: "middle" }
      );
    });

    slide.addText("★ Ücretsiz POC İmkanı  •  ★ 24 Saatte Canlı Kurulum  •  ★ Tam YİBF Uyumluluğu", {
      x: 2.5,
      y: 5.7,
      w: 8.3,
      h: 0.4,
      color: ACCENT_BLUE,
      fontSize: 11,
      bold: true,
      align: "center",
    });
  }

  console.log("💾 Writing PPTX file to disk...");
  await pptx.writeFile({ fileName: PPTX_OUTPUT });
  const stats = fs.statSync(PPTX_OUTPUT);
  console.log(`✅ PPTX Generated: ${PPTX_OUTPUT} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

async function main() {
  console.log("🚀 Starting Presentation Build Pipeline (PDF + PPTX)...");
  await exportPdf();
  await exportPptx();
  console.log("\n🎉 ALL PRESENTATION ASSETS GENERATED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("FATAL BUILD ERROR:", err);
  process.exit(1);
});

