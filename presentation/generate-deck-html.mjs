/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Dynamic Presentation HTML Generator
 * Generates deck.html completely from presentation/module-manifest.json
 * Features ~60 professional 16:9 slides with browser frames, no clipping, and rich architecture flows.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, "module-manifest.json");
const OUTPUT_HTML = path.join(__dirname, "deck.html");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateHtml() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

  // Calculate slide numbers
  let totalSlides = 4; // Cover, TOC, Sector Problem, Roles
  manifest.groups.forEach((g) => {
    totalSlides += 1; // Category Divider Slide
    totalSlides += g.modules.length; // Each module detail slide
  });
  totalSlides += 3; // Tech stack, Integration/API, Closing

  console.log(`📊 Generating dynamic presentation deck with ${totalSlides} total 16:9 slides...`);

  let currentSlideNum = 1;

  let slidesHtml = "";

  // ==========================================
  // SLIDE 1: COVER
  // ==========================================
  slidesHtml += `
  <!-- SLIDE 1: COVER -->
  <section class="slide" style="justify-content: space-between; padding: 70px 100px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="width: 58px; height: 58px; background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: white; box-shadow: 0 0 35px rgba(59, 130, 246, 0.6); border: 1px solid rgba(255,255,255,0.2);">
          NX
        </div>
        <div>
          <span style="font-size: 30px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">NEXA <span style="color: #38BDF8;">ERP</span></span>
          <span style="margin-left: 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38BDF8; padding: 5px 12px; border-radius: 6px;">Enterprise v4.2</span>
        </div>
      </div>
      <div class="chip chip-cyan" style="font-size: 13px;">
        ● KAPSAMLI KURUMSAL SİSTEM MİMARİSİ VE ÜRÜN KATALOGU
      </div>
    </div>

    <div style="max-width: 1300px; margin: 30px 0;">
      <div class="chip chip-purple" style="margin-bottom: 20px; font-size: 13px;">
        ✦ Uçtan Uca ConTech & Yapay Zeka Destekli 3D Dijital İkiz Ekosistemi
      </div>
      <h1 style="font-size: 58px; font-weight: 900; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 20px; color: #FFFFFF;">
        Şantiyeden Hakedişe, 2D Paftadan <br>
        <span style="background: linear-gradient(90deg, #38BDF8 0%, #3B82F6 50%, #A855F7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          3D BIM ve Yapay Zeka Dijital İkizine
        </span>
      </h1>
      <p style="font-size: 20px; color: #94A3B8; line-height: 1.6; max-width: 1050px; font-weight: 400;">
        Modern inşaat yönetiminin tüm paydaşlarını tek çatı altında toplayan; ${manifest.statistics.totalModules} bağımsız modül, ${manifest.statistics.totalPrismaModels} ilişkisel veritabanı tablosu ve ${manifest.statistics.totalUserRoles} yetkilendirilmiş kullanıcı rolüyle çalışan Türkiye'nin en gelişmiş inşaat ERP ekosistemi.
      </p>
    </div>

    <!-- 4 Key System Statistics -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 32px;">
      <div class="metric-box">
        <span class="metric-value">${manifest.statistics.totalModules} Modül</span>
        <span class="metric-label">10 Ana Kurumsal Kategori</span>
      </div>
      <div class="metric-box">
        <span class="metric-value" style="color: #A855F7;">${manifest.statistics.totalPrismaModels} Model</span>
        <span class="metric-label">PostgreSQL & Prisma ORM</span>
      </div>
      <div class="metric-box">
        <span class="metric-value" style="color: #10B981;">${manifest.statistics.totalUserRoles} Rol</span>
        <span class="metric-label">Granüler RBAC & Multi-Tenancy</span>
      </div>
      <div class="metric-box">
        <span class="metric-value" style="color: #F59E0B;">%100 Entegre</span>
        <span class="metric-label">AI, 3D BIM, YİBF & Muhasebe</span>
      </div>
    </div>

    <div class="slide-footer" style="margin-top: 0; padding-top: 18px;">
      <span>© 2026 NXA Software • nxerp.com.tr</span>
      <span class="confidential-tag">GİZLİ & KURUMSAL SİSTEM KATALOGU</span>
      <span>Sayfa 01 / ${totalSlides}</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // ==========================================
  // SLIDE 2: TABLE OF CONTENTS (MODULE MATRIX)
  // ==========================================
  slidesHtml += `
  <!-- SLIDE 2: TABLE OF CONTENTS -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">İçindekiler & Ekosistem Haritası</span>
          <h2 class="slide-title">10 Kurumsal Kategori ve Modül Dağılımı</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body" style="flex-direction: column;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; flex: 1;">
        ${manifest.groups
          .map((g, idx) => {
            return `
          <div class="glass-card" style="padding: 16px 20px; border-left: 4px solid ${g.color}; justify-content: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="chip" style="background: rgba(255,255,255,0.05); color: ${g.color}; border: 1px solid ${g.color}40; font-size: 11px; padding: 2px 8px;">
                BÖLÜM ${String(idx + 1).padStart(2, "0")} • ${escapeHtml(g.badge)}
              </span>
              <strong style="color: ${g.color}; font-size: 12px;">${g.modules.length} MODÜL</strong>
            </div>
            <h3 style="font-size: 16px; color: #FFFFFF; font-weight: 700; margin-bottom: 4px;">${escapeHtml(g.title)}</h3>
            <p style="font-size: 12px; color: #94A3B8; line-height: 1.4; margin-bottom: 8px;">${escapeHtml(g.description)}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${g.modules
                .slice(0, 4)
                .map(
                  (m) => `
                <span style="font-size: 10.5px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); padding: 2px 7px; border-radius: 4px; color: #CBD5E1;">
                  • ${escapeHtml(m.name)}
                </span>
              `
                )
                .join("")}
              ${g.modules.length > 4 ? `<span style="font-size: 10px; color: #64748B; padding: 2px 4px;">+${g.modules.length - 4} diğer</span>` : ""}
            </div>
          </div>
          `;
          })
          .join("")}
      </div>
    </div>

    <div class="slide-footer">
      <span>NEXA ERP • Sistem Mimarisi & Modül Haritası</span>
      <span>${manifest.statistics.totalModules} Modülün Eksiksiz Kataloğu</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // ==========================================
  // SLIDE 3: SECTORAL PROBLEM & EVENT FLOW (SVG)
  // ==========================================
  slidesHtml += `
  <!-- SLIDE 3: PROBLEM & END-TO-END WORKFLOW -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">Olay Örgüsü & Çözüm Mimarisi</span>
          <h2 class="slide-title">Parçalı Yapıdan Entegre ConTech Ekosistemine Veri Akışı</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body" style="flex-direction: column;">
      <div class="glass-card glass-card-glow" style="flex: 1; padding: 24px; justify-content: center;">
        <svg viewBox="0 0 1760 520" style="width: 100%; height: 100%;">
          <defs>
            <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A8A"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient>
            <linearGradient id="gCyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0E7490"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient>
            <linearGradient id="gPurple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#581C87"/><stop offset="100%" stop-color="#9333EA"/></linearGradient>
            <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#064E3B"/><stop offset="100%" stop-color="#10B981"/></linearGradient>
            <linearGradient id="gAmber" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#78350F"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>
          </defs>

          <!-- Step 1 -->
          <g transform="translate(40, 50)">
            <rect width="255" height="410" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="#3B82F6" stroke-width="2"/>
            <rect width="255" height="46" rx="16" fill="url(#gBlue)"/>
            <text x="127" y="30" fill="#FFFFFF" font-family="Outfit" font-size="15" font-weight="700" text-anchor="middle">1. DİJİTAL PAFTA & AI</text>
            <circle cx="127" cy="100" r="30" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" stroke-width="2"/>
            <text x="127" y="108" fill="#60A5FA" font-size="22" text-anchor="middle">📐</text>
            <text x="127" y="155" fill="#FFFFFF" font-family="Outfit" font-size="16" font-weight="700" text-anchor="middle">2D PDF & DWG CAD</text>
            <text x="127" y="178" fill="#94A3B8" font-size="12" text-anchor="middle">LibreDWG Vektör Motoru</text>
            <rect x="20" y="205" width="215" height="80" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="127" y="230" fill="#38BDF8" font-size="12" font-weight="700" text-anchor="middle">GEMINI 2.0 VISION</text>
            <text x="127" y="252" fill="#E2E8F0" font-size="11.5" text-anchor="middle">Oda, Duvar, Kolon Koordinat</text>
            <text x="127" y="272" fill="#94A3B8" font-size="11" text-anchor="middle">(startX, startY, endX, endY)</text>
            <rect x="20" y="300" width="215" height="75" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="127" y="325" fill="#10B981" font-size="12" font-weight="700" text-anchor="middle">OTOMATİK METRAJ (BoQ)</text>
            <text x="127" y="347" fill="#94A3B8" font-size="11.5" text-anchor="middle">Resmi ÇŞB Poz Eşleşmesi</text>
            <text x="127" y="365" fill="#64748B" font-size="11" text-anchor="middle">Birim Fiyat & Keşif Cetveli</text>
          </g>

          <path d="M 295 255 L 375 255" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6,6"/>

          <!-- Step 2 -->
          <g transform="translate(375, 50)">
            <rect width="265" height="410" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="#06B6D4" stroke-width="2"/>
            <rect width="265" height="46" rx="16" fill="url(#gCyan)"/>
            <text x="132" y="30" fill="#FFFFFF" font-family="Outfit" font-size="15" font-weight="700" text-anchor="middle">2. 3D FEDERATED BIM</text>
            <circle cx="132" cy="100" r="30" fill="rgba(6, 182, 212, 0.2)" stroke="#06B6D4" stroke-width="2"/>
            <text x="132" y="108" fill="#22D3EE" font-size="22" text-anchor="middle">🏛️</text>
            <text x="132" y="155" fill="#FFFFFF" font-family="Outfit" font-size="16" font-weight="700" text-anchor="middle">Web-IFC & 3D Render</text>
            <text x="132" y="178" fill="#94A3B8" font-size="12" text-anchor="middle">Mimari + Statik + MEP Katmanları</text>
            <rect x="20" y="205" width="225" height="80" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="230" fill="#22D3EE" font-size="12" font-weight="700" text-anchor="middle">X-RAY DUVAR ARKASI</text>
            <text x="132" y="252" fill="#E2E8F0" font-size="11.5" text-anchor="middle">Yarı Saydam Dış Duvarlar</text>
            <text x="132" y="272" fill="#94A3B8" font-size="11" text-anchor="middle">Sıva İçi Tesisat Görünürlüğü</text>
            <rect x="20" y="300" width="225" height="75" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="325" fill="#F59E0B" font-size="12" font-weight="700" text-anchor="middle">CLASH DETECTION</text>
            <text x="132" y="347" fill="#94A3B8" font-size="11.5" text-anchor="middle">Kiriş-Boru Çakışma Analizi</text>
            <text x="132" y="365" fill="#64748B" font-size="11" text-anchor="middle">BIM Sorun Kaydı Açma</text>
          </g>

          <path d="M 640 255 L 720 255" stroke="#06B6D4" stroke-width="3" stroke-dasharray="6,6"/>

          <!-- Step 3 -->
          <g transform="translate(720, 50)">
            <rect width="265" height="410" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="#9333EA" stroke-width="2"/>
            <rect width="265" height="46" rx="16" fill="url(#gPurple)"/>
            <text x="132" y="30" fill="#FFFFFF" font-family="Outfit" font-size="15" font-weight="700" text-anchor="middle">3. SAHA & IoT RADARI</text>
            <circle cx="132" cy="100" r="30" fill="rgba(147, 51, 234, 0.2)" stroke="#9333EA" stroke-width="2"/>
            <text x="132" y="108" fill="#C084FC" font-size="22" text-anchor="middle">📡</text>
            <text x="132" y="155" fill="#FFFFFF" font-family="Outfit" font-size="16" font-weight="700" text-anchor="middle">GIS Harita & BLE Baret</text>
            <text x="132" y="178" fill="#94A3B8" font-size="12" text-anchor="middle">Gerçek Zamanlı Varlık Takibi</text>
            <rect x="20" y="205" width="225" height="80" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="230" fill="#C084FC" font-size="12" font-weight="700" text-anchor="middle">GEOFENCE & PUANTAJ</text>
            <text x="132" y="252" fill="#E2E8F0" font-size="11.5" text-anchor="middle">Otomatik Giriş-Çıkış Tespiti</text>
            <text x="132" y="272" fill="#94A3B8" font-size="11" text-anchor="middle">Şantiye Dışı Girişleri Engelleme</text>
            <rect x="20" y="300" width="225" height="75" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="325" fill="#EF4444" font-size="12" font-weight="700" text-anchor="middle">MOBİL AR VE X-RAY</text>
            <text x="132" y="347" fill="#94A3B8" font-size="11.5" text-anchor="middle">Telefon Kamerası ile Sahada</text>
            <text x="132" y="365" fill="#64748B" font-size="11" text-anchor="middle">Duvar İçi Tesisat Hizalama</text>
          </g>

          <path d="M 985 255 L 1065 255" stroke="#9333EA" stroke-width="3" stroke-dasharray="6,6"/>

          <!-- Step 4 -->
          <g transform="translate(1065, 50)">
            <rect width="265" height="410" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="#10B981" stroke-width="2"/>
            <rect width="265" height="46" rx="16" fill="url(#gGreen)"/>
            <text x="132" y="30" fill="#FFFFFF" font-family="Outfit" font-size="15" font-weight="700" text-anchor="middle">4. YAPI DENETİM & YİBF</text>
            <circle cx="132" cy="100" r="30" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" stroke-width="2"/>
            <text x="132" y="108" fill="#34D399" font-size="22" text-anchor="middle">🛡️</text>
            <text x="132" y="155" fill="#FFFFFF" font-family="Outfit" font-size="16" font-weight="700" text-anchor="middle">Bakanlık e-YİBF Uyumu</text>
            <text x="132" y="178" fill="#94A3B8" font-size="12" text-anchor="middle">Resmi Tutanak & Numune Ağı</text>
            <rect x="20" y="205" width="225" height="80" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="230" fill="#34D399" font-size="12" font-weight="700" text-anchor="middle">BETON VE KAROT TESTİ</text>
            <text x="132" y="252" fill="#E2E8F0" font-size="11.5" text-anchor="middle">7/28 Gün Mukavemet Eğrileri</text>
            <text x="132" y="272" fill="#94A3B8" font-size="11" text-anchor="middle">Çipli Numune Kırım Otomasyonu</text>
            <rect x="20" y="300" width="225" height="75" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="132" y="325" fill="#38BDF8" font-size="12" font-weight="700" text-anchor="middle">DEMİR VE KALIP VİZESİ</text>
            <text x="132" y="347" fill="#94A3B8" font-size="11.5" text-anchor="middle">Döküm Öncesi Kontrol Onayı</text>
            <text x="132" y="365" fill="#64748B" font-size="11" text-anchor="middle">GPS Konumlu Dijital Tutanak</text>
          </g>

          <path d="M 1330 255 L 1410 255" stroke="#10B981" stroke-width="3" stroke-dasharray="6,6"/>

          <!-- Step 5 -->
          <g transform="translate(1410, 50)">
            <rect width="310" height="410" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="#F59E0B" stroke-width="2"/>
            <rect width="310" height="46" rx="16" fill="url(#gAmber)"/>
            <text x="155" y="30" fill="#FFFFFF" font-family="Outfit" font-size="15" font-weight="700" text-anchor="middle">5. TAŞERON & HAKEDİŞ</text>
            <circle cx="155" cy="100" r="30" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" stroke-width="2"/>
            <text x="155" y="108" fill="#FBBF24" font-size="22" text-anchor="middle">💰</text>
            <text x="155" y="155" fill="#FFFFFF" font-family="Outfit" font-size="16" font-weight="700" text-anchor="middle">Fotoğraflı İmalat Kanıtı</text>
            <text x="155" y="178" fill="#94A3B8" font-size="12" text-anchor="middle">Sıfır İhtilaflı Net Hakediş</text>
            <rect x="20" y="205" width="270" height="80" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="155" y="230" fill="#FBBF24" font-size="12" font-weight="700" text-anchor="middle">OTOMATİK KESİNTİ MOTORU</text>
            <text x="155" y="252" fill="#E2E8F0" font-size="11.5" text-anchor="middle">Avans, Stopaj (%3), Elektrik/Su</text>
            <text x="155" y="272" fill="#94A3B8" font-size="11" text-anchor="middle">İSG Cezaları Doğrudan Mahsup</text>
            <rect x="20" y="300" width="270" height="75" rx="10" fill="rgba(30, 41, 59, 0.8)"/>
            <text x="155" y="325" fill="#10B981" font-size="12" font-weight="700" text-anchor="middle">E-FATURA & CARİ KAPANIŞ</text>
            <text x="155" y="347" fill="#94A3B8" font-size="11.5" text-anchor="middle">Onaylanan Metraj E-Faturaya Eşlenir</text>
            <text x="155" y="365" fill="#64748B" font-size="11" text-anchor="middle">Kuruşu Kuruşuna Cari Mutabakat</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="slide-footer">
      <span>NEXA ERP • Olay Örgüsü & Veri Akışı</span>
      <span>Mimari Paftadan Muhasebe Kapanışına Kesintisiz Zincir</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // ==========================================
  // SLIDE 4: ROLES & MULTI-TENANCY MATRIX
  // ==========================================
  slidesHtml += `
  <!-- SLIDE 4: ROLES & MULTI-TENANCY -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">Yetkilendirme Mimarisi (RBAC)</span>
          <h2 class="slide-title">28 Kullanıcı Rolü & SaaS Çok Kiracılık (Multi-Tenancy)</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body">
      <!-- Left: Role Groups -->
      <div class="glass-card" style="flex: 1.25;">
        <h3 style="font-size: 20px; color: #FFFFFF; font-weight: 700; margin-bottom: 6px;">Kullanıcı Rol Grupları & Sorumluluk Alanları</h3>
        <p style="font-size: 13px; color: #94A3B8; margin-bottom: 20px;">Platformda her rol yalnızca yetkilendirildiği veri setlerini ve menüleri görür</p>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 14px;">
            <span class="chip chip-blue" style="font-size: 11px; padding: 2px 8px; margin-bottom: 8px;">YÖNETİM KADROSU</span>
            <ul style="list-style: none; font-size: 12px; color: #94A3B8; line-height: 1.7;">
              <li>• <strong>SUPER_ADMIN:</strong> Tenant & Lisans Yöneticisi</li>
              <li>• <strong>ADMIN:</strong> Şirket Sahibi / Genel Müdür</li>
              <li>• <strong>PROJECT_MANAGER:</strong> Proje Direktörü</li>
              <li>• <strong>INVESTOR / CLIENT:</strong> Şeffaf Yatırımcı Portalı</li>
            </ul>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 14px;">
            <span class="chip chip-cyan" style="font-size: 11px; padding: 2px 8px; margin-bottom: 8px;">SAHA TEKNİK</span>
            <ul style="list-style: none; font-size: 12px; color: #94A3B8; line-height: 1.7;">
              <li>• <strong>SITE_MANAGER:</strong> Şantiye Şefi & Günlük Jurnal</li>
              <li>• <strong>ENGINEER:</strong> Saha Mühendisi (BIM / Metraj)</li>
              <li>• <strong>ISG_EXPERT:</strong> İSG Uzmanı & Risk Planları</li>
              <li>• <strong>EQUIPMENT_MANAGER:</strong> İş Makinesi & Yakıt</li>
            </ul>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px;">
            <span class="chip chip-emerald" style="font-size: 11px; padding: 2px 8px; margin-bottom: 8px;">YAPI DENETİM & YASAL</span>
            <ul style="list-style: none; font-size: 12px; color: #94A3B8; line-height: 1.7;">
              <li>• <strong>INSPECTION_ADMIN:</strong> Denetim Şirketi Müdürü</li>
              <li>• <strong>INSPECTOR:</strong> Saha Yapı Denetçisi (Vize/Tutanak)</li>
              <li>• <strong>AUDITOR:</strong> Kalite & Bağımsız Denetçi</li>
              <li>• <strong>LAB_TECH:</strong> Beton Kırım & Karot Operatörü</li>
            </ul>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 14px;">
            <span class="chip chip-purple" style="font-size: 11px; padding: 2px 8px; margin-bottom: 8px;">TAŞERON, İK & FİNANS</span>
            <ul style="list-style: none; font-size: 12px; color: #94A3B8; line-height: 1.7;">
              <li>• <strong>SUBCONTRACTOR:</strong> Taşeron Yetkilisi & Kanıt Girişi</li>
              <li>• <strong>FINANCE_MANAGER / MUHASEBE:</strong> Kasa & Hakediş</li>
              <li>• <strong>PROCUREMENT_MANAGER:</strong> Satınalma & RFQ</li>
              <li>• <strong>WORKER / DRIVER:</strong> Mobil QR Puantaj & Sevkiyat</li>
            </ul>
          </div>
        </div>

        <div class="metrics-row" style="margin-top: auto;">
          <div class="metric-box"><span class="metric-value">28</span><span class="metric-label">Özelleştirilmiş Rol</span></div>
          <div class="metric-box"><span class="metric-value">${manifest.statistics.totalPrismaModels}</span><span class="metric-label">Prisma Modeli</span></div>
          <div class="metric-box"><span class="metric-value">%100</span><span class="metric-label">Rol Bazlı İzolasyon</span></div>
        </div>
      </div>

      <!-- Right: SaaS Multi-Tenancy Features -->
      <div class="glass-card glass-card-glow" style="flex: 0.75; justify-content: space-between;">
        <div>
          <span class="chip chip-cyan" style="margin-bottom: 14px;">Multi-Tenant SaaS</span>
          <h3 style="font-size: 22px; color: #FFFFFF; font-weight: 700; margin-bottom: 12px;">Kurumsal Çok Kiracılık & White-Label</h3>
          <p style="font-size: 13.5px; color: #94A3B8; line-height: 1.6; margin-bottom: 20px;">
            Her müteahhitlik ve yapı denetim firması Nexa ERP üzerinde tamamen mantıksal olarak izole edilmiş bir kiracı (Tenant) olarak çalışır.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 12px 16px;">
              <strong style="color: #FFFFFF; font-size: 13.5px;">🏢 Özel Kurumsal Domain</strong>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">erp.sirketiniz.com üzerinden güvenli giriş</p>
            </div>
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 12px 16px;">
              <strong style="color: #FFFFFF; font-size: 13.5px;">🎨 Dinamik Tema & Logo</strong>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">Firma logosu, kurumsal renk kodları ve özel butonlar</p>
            </div>
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 12px 16px;">
              <strong style="color: #FFFFFF; font-size: 13.5px;">🔒 Sıfır Çapraz Veri Sızıntısı</strong>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">TenantId seviyesinde veritabanı bariyeri</p>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 14px; text-align: center;">
          <span style="font-size: 11px; font-weight: 700; color: #38BDF8; letter-spacing: 1px;">MODÜLER LİSANS YÖNETİMİ</span>
          <p style="font-size: 12.5px; color: #E2E8F0; margin-top: 4px;">Pakete göre BIM, AI Vision veya Drone modüllerini tek tıkla açın.</p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>NEXA ERP • Yetkilendirme & Güvenlik</span>
      <span>Enterprise Multi-Tenancy Mimarisi</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // ==========================================
  // SECTION 2: DYNAMIC MODULE SLIDES
  // ==========================================
  manifest.groups.forEach((group, gIdx) => {
    // 1. Group Divider Slide
    slidesHtml += `
    <!-- GROUP DIVIDER SLIDE: ${escapeHtml(group.title)} -->
    <section class="slide" style="justify-content: center; align-items: center; padding: 80px 120px;">
      <div class="glass-card glass-card-glow" style="width: 100%; max-width: 1400px; padding: 60px 80px; text-align: left; border-left: 8px solid ${group.color};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <span class="chip" style="background: rgba(255,255,255,0.06); color: ${group.color}; border: 1px solid ${group.color}50; font-size: 14px; padding: 6px 16px;">
            BÖLÜM ${String(gIdx + 1).padStart(2, "0")} • ${escapeHtml(group.badge)}
          </span>
          <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
        </div>

        <h2 style="font-size: 46px; font-weight: 800; color: #FFFFFF; line-height: 1.2; margin-bottom: 16px;">
          ${escapeHtml(group.title)}
        </h2>
        <p style="font-size: 20px; color: #94A3B8; line-height: 1.6; max-width: 1000px; margin-bottom: 36px;">
          ${escapeHtml(group.description)}
        </p>

        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 28px;">
          <h4 style="font-size: 14px; font-weight: 700; color: ${group.color}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">
            BU BÖLÜMDE İNCELENEN ${group.modules.length} ÇEKİRDEK MODÜL:
          </h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
            ${group.modules
              .map(
                (m, idx) => `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 13px; font-weight: 800; color: ${group.color}; width: 24px;">0${idx + 1}</span>
                <div>
                  <strong style="font-size: 13.5px; color: #FFFFFF; display: block;">${escapeHtml(m.name)}</strong>
                  <span style="font-size: 11px; color: #64748B;">${escapeHtml(m.route)}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="slide-footer" style="position: absolute; bottom: 40px; left: 80px; right: 80px;">
        <span>NEXA ERP Enterprise • Bölüm ${String(gIdx + 1).padStart(2, "0")} Girişi</span>
        <span>Sistem Katalogu</span>
      </div>
    </section>
    `;
    currentSlideNum++;

    // 2. Individual Module Detail Slides
    group.modules.forEach((mod) => {
      slidesHtml += `
      <!-- MODULE DETAIL SLIDE: ${escapeHtml(mod.name)} -->
      <section class="slide">
        <!-- Top Slide Header -->
        <div class="slide-header">
          <div class="slide-header-left">
            <div class="brand-logo-pill">NX</div>
            <div class="slide-title-wrap">
              <span class="slide-category" style="color: ${group.color};">${escapeHtml(group.title)}</span>
              <h2 class="slide-title">${escapeHtml(mod.name)}</h2>
            </div>
          </div>
          <div class="slide-header-right">
            <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
          </div>
        </div>

        <!-- Slide Body: Left Screen (60%), Right Info (40%) -->
        <div class="slide-body">
          <!-- Left: Mac / Browser Mockup Frame (No floating badge over screenshot) -->
          <div class="browser-mockup" style="flex: 1.35;">
            <!-- Browser Header Bar -->
            <div class="browser-header">
              <div class="browser-dots">
                <span class="browser-dot" style="background: #EF4444;"></span>
                <span class="browser-dot" style="background: #F59E0B;"></span>
                <span class="browser-dot" style="background: #10B981;"></span>
              </div>
              <div class="browser-url-bar">
                <span style="color: #64748B; margin-right: 6px;">🔒 https://</span>nxerp.com.tr${escapeHtml(mod.route)}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: ${group.color}; text-transform: uppercase;">
                ${escapeHtml(group.badge)}
              </div>
            </div>

            <!-- Screenshot Area -->
            <div class="browser-viewport">
              <img src="./screenshots/${escapeHtml(mod.screenshotId)}.png" 
                   alt="${escapeHtml(mod.name)}" 
                   onerror="this.src='./screenshots/01-executive-dashboard.png'" 
                   style="width: 100%; height: 100%; object-fit: contain; background: #060913; display: block;" />
            </div>
          </div>

          <!-- Right: Deep Technical Breakdown Card -->
          <div class="glass-card" style="flex: 0.85; justify-content: space-between;">
            <div>
              <!-- Workflow Step Tag -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="chip" style="background: rgba(255,255,255,0.05); color: ${group.color}; border: 1px solid ${group.color}40; font-size: 11px; padding: 2px 8px;">
                  İŞLEVSEL YETENEKLER
                </span>
                <span style="font-size: 11px; color: #64748B;">Rota: ${escapeHtml(mod.route)}</span>
              </div>

              <!-- Key Tabs & Discovered Features -->
              <h4 style="font-size: 13px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                ÖNE ÇIKAN SEKMELER & GÖRÜNÜMLER:
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                ${mod.tabsOrViews
                  .map(
                    (tab) => `
                  <span style="font-size: 11px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.12); color: #E2E8F0; padding: 3px 8px; border-radius: 6px;">
                    ✦ ${escapeHtml(tab)}
                  </span>
                `
                  )
                  .join("")}
              </div>

              <!-- Key Concrete Actions -->
              <h4 style="font-size: 13px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                YÜRÜTÜLEN KRİTİK İŞLEMLER:
              </h4>
              <ul style="list-style: none; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
                ${mod.keyActions
                  .map(
                    (action) => `
                  <li style="font-size: 12.5px; color: #94A3B8; display: flex; gap: 8px; align-items: flex-start;">
                    <span style="color: ${group.color}; font-weight: bold;">✔</span>
                    <span>${escapeHtml(action)}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>

              <!-- End-to-End Workflow Flow -->
              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid ${group.color}30; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 700; color: ${group.color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                  🔄 OLAY ÖRGÜSÜ AKIŞI (WORKFLOW):
                </span>
                <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">
                  ${escapeHtml(mod.workflow)}
                </p>
              </div>
            </div>

            <!-- Bottom: Data Infrastructure & User Roles -->
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #64748B; font-weight: 600;">PRİSMA VERİTABANI MODELLERİ:</span>
                <span style="font-size: 11px; color: ${group.color}; font-weight: 700;">${mod.prismaModels.length} Model</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                ${mod.prismaModels
                  .map(
                    (pm) => `
                  <span style="font-size: 10.5px; background: rgba(59, 130, 246, 0.12); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.25); padding: 1px 6px; border-radius: 4px; font-family: monospace;">
                    ${escapeHtml(pm)}
                  </span>
                `
                  )
                  .join("")}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 11px; color: #64748B; font-weight: 600;">ERİŞEBİLEN ROLLER:</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${mod.roles
                  .map(
                    (role) => `
                  <span style="font-size: 10px; background: rgba(255,255,255,0.05); color: #CBD5E1; border: 1px solid rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px;">
                    ${escapeHtml(role)}
                  </span>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- Slide Footer -->
        <div class="slide-footer">
          <span>NEXA ERP • ${escapeHtml(group.title)}</span>
          <span>Bileşenler: ${mod.uiFeatures.map((f) => escapeHtml(f)).join(" • ")}</span>
          <span>Sayfa ${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
        </div>
      </section>
      `;
      currentSlideNum++;
    });
  });

  // ==========================================
  // SECTION 3: TECHNICAL STACK & API & CLOSING
  // ==========================================
  // Slide: Real Tech Stack
  slidesHtml += `
  <!-- SLIDE: FULL TECH STACK -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">Mimari & Teknoloji Omurgası</span>
          <h2 class="slide-title">Üretim Ortamında Doğrulanmış Teknoloji Yığını</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 100%;">
        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">⚡</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">Next.js 16 & React 19</h4><span style="font-size: 11px; color: #38BDF8;">App Router & Server Actions</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            Zero-API latency ile React Server Components (RSC) mimarisi. Tailwind CSS v4, Framer Motion mikro-etkileşimleri ve Next-Intl ile tam çok dilli operasyon.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            SSR • Streaming • RSC Server Actions
          </div>
        </div>

        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">🐘</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">PostgreSQL & Prisma v6</h4><span style="font-size: 11px; color: #34D399;">ACID & 153 İlişkisel Model</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            AWS Neon Serverless PostgreSQL havuzlama. 153 Prisma modeli, katı veri tipleri, migration engine ve tenantId bazlı mantıksal veri bariyeri.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            Prisma 6.19 • Connection Pooling • ACID
          </div>
        </div>

        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">🤖</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">Google Gemini 2.0 API</h4><span style="font-size: 11px; color: #A855F7;">Multimodal AI & OCR</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            Gemini 2.0 Flash ve 1.5 Pro modelleri ile mimari paftalardan doğrudan parametrik duvar koordinatları ve resmi poz eşleşmeli keşif çıkarımı.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            Structured Output • Multimodal OCR
          </div>
        </div>

        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">🎮</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">Three.js & Web-IFC</h4><span style="font-size: 11px; color: #06B6D4;">GPU Render & LibreDWG WASM</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            C tabanlı LibreDWG motorunun WebAssembly derlemesi. Web-IFC ile tarayıcıda IFC model ayrıştırma, X-Ray şeffaflık shader'ı ve 60 FPS performans.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            WebGL 2.0 • Web-IFC • LibreDWG WASM
          </div>
        </div>

        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">📍</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">Turf.js & Leaflet GIS</h4><span style="font-size: 11px; color: #10B981;">Geofencing & Drone Ortofoto</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            Poligon tabanlı şantiye sınırları denetimi. Drone ortofoto mozaik katmanları, BLE donanım radarı ve mesafe/kübaj hesaplamaları.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            Turf.js • Leaflet • GeoJSON • Socket.io
          </div>
        </div>

        <div class="glass-card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 26px;">🔐</span>
            <div><h4 style="font-size: 17px; color: #FFFFFF;">Banka Seviyesi Güvenlik</h4><span style="font-size: 11px; color: #EF4444;">AES-256 S3 & Audit Logs</span></div>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
            NextAuth v5 oturum yönetimi. AWS S3 üzerinde AES-256 şifreli dosya saklama. Tüm metraj, hakediş ve evrak onaylarında kriptografik IP ve Audit Log kaydı.
          </p>
          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748B;">
            AES-256 S3 • NextAuth v5 • Audit Logs
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>NEXA ERP • Teknoloji Yığını</span>
      <span>Modern Bulut ve GPU Tabanlı Altyapı</span>
      <span>Sayfa ${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // Slide: Integration Ecosystem
  slidesHtml += `
  <!-- SLIDE: INTEGRATIONS & API ECOSYSTEM -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">Entegrasyon Ekosistemi</span>
          <h2 class="slide-title">Donanım, Devlet (YİBF) & Muhasebe Entegrasyonları</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%;">
        <div class="glass-card" style="border-top: 4px solid #38BDF8;">
          <span style="font-size: 32px; margin-bottom: 12px; display: block;">🏛️</span>
          <h4 style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin-bottom: 8px;">T.C. ÇŞB e-YİBF</h4>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 12px;">
            Yapı denetim sistemi API'siyle doğrudan entegre. Karot kırım sonuçları, demir vizeleri ve yasal tutanakların anlık aktarımı.
          </p>
          <span class="chip chip-blue" style="font-size: 10.5px; padding: 2px 8px; margin-top: auto;">Mevzuat Garantisi</span>
        </div>

        <div class="glass-card" style="border-top: 4px solid #10B981;">
          <span style="font-size: 32px; margin-bottom: 12px; display: block;">📡</span>
          <h4 style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin-bottom: 8px;">BLE & IoT Baretler</h4>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 12px;">
            Bluetooth Low Energy beacon'lar ve kask aparatları. Kat bazlı dikey personel konumu, SOS acil durum tahliye sinyali.
          </p>
          <span class="chip chip-emerald" style="font-size: 10.5px; padding: 2px 8px; margin-top: auto;">Donanım Entegrasyonu</span>
        </div>

        <div class="glass-card" style="border-top: 4px solid #A855F7;">
          <span style="font-size: 32px; margin-bottom: 12px; display: block;">🚁</span>
          <h4 style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin-bottom: 8px;">İHA & Fotogrametri</h4>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 12px;">
            DJI ve profesyonel haritacı dronelarından alınan GeoTIFF ve ortofoto haritaların yüklenmesi ve 3D nokta bulutu işleme.
          </p>
          <span class="chip chip-purple" style="font-size: 10.5px; padding: 2px 8px; margin-top: auto;">Haritacılık Desteği</span>
        </div>

        <div class="glass-card" style="border-top: 4px solid #F59E0B;">
          <span style="font-size: 32px; margin-bottom: 12px; display: block;">🧾</span>
          <h4 style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin-bottom: 8px;">E-Fatura & Muhasebe</h4>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 12px;">
            GİB uyumlu e-Fatura entegrasyonu. Onaylanan taşeron hakediş icmallerinin otomatik faturayla ve cari hesapla eşleşmesi.
          </p>
          <span class="chip chip-amber" style="background: rgba(245,158,11,0.15); color: #FBBF24; font-size: 10.5px; padding: 2px 8px; margin-top: auto;">Sıfır Hata</span>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>NEXA ERP • Entegrasyon Mimarisi</span>
      <span>Açık API & Donanım Ekosistemi</span>
      <span>Sayfa ${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
    </div>
  </section>
  `;
  currentSlideNum++;

  // Slide: Closing Slide
  slidesHtml += `
  <!-- SLIDE: CLOSING & DEMO ACCESS -->
  <section class="slide" style="justify-content: space-between;">
    <div class="slide-header">
      <div class="slide-header-left">
        <div class="brand-logo-pill">NX</div>
        <div class="slide-title-wrap">
          <span class="slide-category">NEXA ERP Canlı Erişim</span>
          <h2 class="slide-title">İnşaatınızı Geleceğin Teknolojisiyle Bugünden Yönetin</h2>
        </div>
      </div>
      <div class="slide-header-right">
        <span class="slide-counter">${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
      </div>
    </div>

    <div class="slide-body" style="align-items: center; justify-content: center;">
      <div class="glass-card glass-card-glow" style="width: 1100px; padding: 48px; text-align: center; align-items: center;">
        <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; color: white; margin-bottom: 24px; box-shadow: 0 0 45px rgba(59, 130, 246, 0.6);">
          NX
        </div>

        <h3 style="font-size: 38px; color: #FFFFFF; font-weight: 800; margin-bottom: 12px;">
          Nexa ERP Canlı Demo & Kurumsal İletişim
        </h3>
        <p style="font-size: 18px; color: #94A3B8; max-width: 750px; line-height: 1.6; margin-bottom: 36px;">
          Türkiye'nin lider inşaat, taahhüt ve yapı denetim şirketleri arasına katılın. Projenizi 24 saat içinde 3D dijital ikizine kavuşturalım.
        </p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; margin-bottom: 36px;">
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 20px;">
            <span style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Canlı Platform</span>
            <h4 style="font-size: 20px; color: #38BDF8; margin-top: 6px;">nxerp.com.tr</h4>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Web & Bulut Erişimi</p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 20px;">
            <span style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Kurumsal İletişim</span>
            <h4 style="font-size: 20px; color: #FFFFFF; margin-top: 6px;">info@nxerp.com.tr</h4>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">NXA Software Teknolojileri</p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 20px;">
            <span style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Mobil AR Desteği</span>
            <h4 style="font-size: 20px; color: #10B981; margin-top: 6px;">iOS & Android</h4>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Kamera ile X-Ray Görüşü</p>
          </div>
        </div>

        <div style="display: flex; gap: 16px;">
          <div class="chip chip-blue" style="font-size: 13px; padding: 8px 18px;">
            ★ Ücretsiz POC (Proof of Concept)
          </div>
          <div class="chip chip-purple" style="font-size: 13px; padding: 8px 18px;">
            ★ 24 Saat İçinde Kurulum
          </div>
          <div class="chip chip-emerald" style="font-size: 13px; padding: 8px 18px;">
            ★ YİBF ve Muhasebe Entegrasyonu
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>© 2026 NXA Software • Nexa ERP Enterprise</span>
      <span>Geliştirici: Umut Erdoğan • nxerp.com.tr</span>
      <span>Sayfa ${String(currentSlideNum).padStart(2, "0")} / ${totalSlides}</span>
    </div>
  </section>
  `;

  // Complete HTML Envelope
  const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Nexa ERP — Kapsamlı Sistem Mimarisi & Ürün Katalogu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: 1920px 1080px; margin: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #04060D;
      color: #F1F5F9;
      -webkit-font-smoothing: antialiased;
      width: 1920px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, .brand-font { font-family: 'Outfit', sans-serif; }

    .slide {
      width: 1920px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      padding: 44px 64px 36px 64px;
      background: radial-gradient(circle at 85% 15%, rgba(37, 99, 235, 0.16) 0%, transparent 45%),
                  radial-gradient(circle at 15% 85%, rgba(124, 58, 237, 0.14) 0%, transparent 40%),
                  linear-gradient(180deg, #070B16 0%, #03050A 100%);
    }

    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
    }
    .slide-header-left { display: flex; align-items: center; gap: 16px; }
    .brand-logo-pill {
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      color: white; font-weight: 800; font-size: 13px; letter-spacing: 1.5px;
      padding: 5px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
    }
    .slide-category { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
    .slide-title-wrap { display: flex; flex-direction: column; }
    .slide-title { font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; }
    .slide-header-right { display: flex; align-items: center; gap: 16px; }
    .slide-counter {
      font-size: 13px; font-weight: 600; color: #64748B; padding: 5px 12px;
      background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;
    }

    .slide-body { flex: 1; display: flex; gap: 32px; align-items: stretch; min-height: 0; }

    /* macOS / Browser Mockup Frame */
    .browser-mockup {
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: #0B1120;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .browser-header {
      background: #0E1628;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .browser-dots { display: flex; gap: 8px; align-items: center; }
    .browser-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .browser-url-bar {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 4px 14px;
      font-size: 11.5px;
      color: #94A3B8;
      font-family: monospace;
      flex: 1;
      max-width: 550px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .browser-viewport {
      flex: 1;
      background: #060913;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Cards */
    .glass-card {
      background: rgba(13, 21, 39, 0.82);
      border: 1px solid rgba(56, 189, 248, 0.18);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
    }
    .glass-card-glow {
      box-shadow: 0 0 35px -10px rgba(56, 189, 248, 0.22), 0 20px 40px -15px rgba(0, 0, 0, 0.6);
      border-color: rgba(56, 189, 248, 0.35);
    }

    .chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
      border-radius: 30px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
    }
    .chip-blue { background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60A5FA; }
    .chip-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #22D3EE; }
    .chip-purple { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); color: #C084FC; }
    .chip-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; }

    .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
    .metric-box {
      background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px; padding: 14px 18px; display: flex; flex-direction: column;
    }
    .metric-value { font-size: 26px; font-weight: 800; color: #38BDF8; font-family: 'Outfit', sans-serif; }
    .metric-label { font-size: 11.5px; color: #94A3B8; margin-top: 4px; font-weight: 500; }

    .slide-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 20px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 11.5px; color: #64748B;
    }
    .confidential-tag {
      color: #EF4444; font-weight: 600; background: rgba(239, 68, 68, 0.1);
      padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.2);
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML, fullHtml, "utf-8");
  console.log(`✅ Saved ${totalSlides}-slide HTML presentation to: ${OUTPUT_HTML}`);
  return totalSlides;
}

generateHtml();

