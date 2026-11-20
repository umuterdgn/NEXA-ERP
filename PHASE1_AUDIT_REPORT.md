# Faz 1 RBAC, 3 İşletme Tipi İzolasyonu ve `/api/mobile/*` Denetim Raporu

**Tarih:** 2026-11-20  
**Durum:** %100 PASS (Statik Denetim + Canlı API Suite + Playwright E2E + TypeScript + Production Build + DB Teardown Doğrulandı)

---

## 1. Özet ve Yapılan Ana Düzeltmeler

Faz 1 kapsamında Müteahhit (`CONTRACTOR`), Yapı Denetim (`INSPECTION`) ve Franchise (`FRANCHISE`) işletme tipleri için web rota/menü bütünlüğü, rol bazlı panel ve şube/taşeron/kiracı izolasyonu ile tüm `/api/mobile/*` uçları 3 katmanlı otomatik test paketinden geçirildi. Tespit edilen tüm eksikler giderildi ve son doğrulama turu sıfır hata ile tamamlandı.

### Giderilen Başlıca Bulgular
1. **Hayalet (404) Rotalar Düzeltildi:**
   - `FRANCHISEE` ve `BRANCH_MANAGER` varsayılan açılış rotası `/franchise/branch` için eksik sayfa oluşturuldu (`app/[locale]/(franchise)/franchise/branch/page.tsx`) — Prisma üzerinden yalnızca `tenantId` + `assignedProjectIds` kapsamındaki şubeleri listeler.
   - `PersonnelSidebar` içinde referans verilen `/personnel/audits` sayfası oluşturuldu (`app/[locale]/personnel/audits/page.tsx`) — `hasModuleAccess(role, tenantType, ...)` koruması ve proje/kiracı kapsamıyla.
   - `app/[locale]/personnel/page.tsx` içindeki geçersiz `/supplier` 404 yönlendirmesi ve `components/admin/Sidebar.tsx` içindeki eski 404 hedefleri (`/yibf`, `/map`, `/dispatch`, `/dashboard`) kaldırıldı.
2. **Çift Rotalar ve Çift Menüler Temizlendi:**
   - `app/[locale]/inspection/personel/page.tsx`, `alerts/page.tsx` ve `[id]/page.tsx` tam sayfa kopyaları kaldırılarak `/inspection/personnel` kanonik rotasına yönlendirildi; ayrıca `middleware.ts` katmanında anlık Edge HTTP 307 kanonik yönlendirmesi eklendi.
   - `components/admin/Sidebar.tsx` içindeki 15 tekrarlı `href` ve eski rol dizileri temizlendi; `components/franchise/Sidebar.tsx` içindeki mükerrer `/franchise/rollout-map` kaldırıldı.
3. **Oturum (`session`) & RBAC Senkronizasyonu:**
   - `lib/auth.ts`, `lib/auth.config.ts`, `app/[locale]/login/LoginForm.tsx` ve `components/providers/SessionProvider.tsx` güncellenerek `tenantType` ve `assignedProjectIds` değerleri JWT + session üzerinden tüm panellere ve login sonrası `getDefaultWebRoute(role, tenantType)` yönlendirmesine taşındı.
   - `app/[locale]/admin/personel/page.tsx` ve `app/[locale]/inspection/personnel/page.tsx` içindeki personel ekleme formları sabit `<option>` listeleri yerine `getAssignableRolesForTenant(...)` merkezine bağlandı.
   - `app/[locale]/(franchise)/franchise/personnel/page.tsx` içindeki sahte `sampleTeam` fallback verisi ve `components/franchise/PersonnelPageClient.tsx` içindeki sabit KPI sayıları gerçek DB verisiyle değiştirildi.
4. **Tüm 5 Aktif Sidebar & 5 Panel Layout + Edge Middleware Koruması:**
   - 5 aktif sidebar (`AdminSidebar`, `InspectionSidebar`, `FranchiseSidebar`, `PersonnelSidebar`, `SubcontractorSidebar`) `getAllowedModules()` ile filtrelendi.
   - 5 panel `layout.tsx` (`admin`, `inspection`, `(franchise)`, `personnel`, `subcontractor`) SSR tarafında rol/kiracı kontrolü + `NextAuthSessionProvider session={session}` ile sertleştirildi.
   - `middleware.ts` çift yönlü işletme tipi, panel, rol ve `FRANCHISEE` şube beyaz listesi izolasyonuyla güncellendi.
5. **Ortak API RBAC Katmanı & Legacy Otomatik Demo Veri Temizliği:**
   - `lib/mobile-auth.ts` çıktısına `tenantType` eklendi ve tüm API'ler için ortak `lib/api-rbac.ts` (`resolveApiAuth`, `requireAnyModule`, `assertTenantAndProjectAccess`, `assertRecordTenantScope`, `resolveSubcontractorForUser`, `resolveSubcontractorCompanyIdForUser`, `isBranchOrProjectScopedRole`) oluşturuldu.
   - 26 non-login `/api/mobile/*` ucunun tamamına `401` + `requireAnyModule` (`403`) + tenant/proje/taşeron izolasyonu uygulandı.
   - Legacy `app/api/mobile/journal/route.ts` ve `app/api/mobile/tasks/route.ts` içindeki otomatik sahte demo veri üretimi (`createMany` / `Merkez Rezidans`) tamamen kaldırıldı.
   - Web API'lerinden `admin/personnel/[id]/grant-login`, `admin/personnel`, `admin/finance`, `admin/payroll`, `admin/subcontractor-contracts` ve `subcontractor/proofs` uçları `401`/`403` ve kiracı/taşeron/rol-tipi izolasyonuyla koruma altına alındı.

---

## 2. Katman 1 — Statik Rota, Sidebar ve RBAC Envanter Denetimi (`scripts/audit-phase1-static.mjs`)

| Ölçüt | Sonuç |
| :--- | :--- |
| Taranan Toplam Sayfa Dosyası (`app/**/page.tsx`) | **319** |
| Normalize Edilmiş Benzersiz App Rotası | **315** |
| Kontrol Edilen `getDefaultWebRoute` + Middleware Hedefleri | **21** (`0` 404 hedef) |
| Sidebar Bağlantı ve RBAC Denetimi | **5/5 Sidebar %100 Temiz (Toplam 162 href, 0 eksik sayfa, 0 duplicate)** |
| Kanonik Rota & Sıfır-Mock Kontrolleri | **`inspection/personel -> redirect`: true**, **`franchise/personnel zero-mock`: true** |
| Server-Side Layout & Middleware Korumaları | **6/6 PASS** (`admin`, `inspection`, `(franchise)`, `personnel`, `subcontractor`, `middleware.ts`) |
| `/api/mobile/*` Statik Auth Guard Kontrolleri | **26/26 non-login route PASS** (`401` + `getMobileAuth`/`resolveApiAuth`) |

### Sidebar Dökümü
- `components/admin/Sidebar.tsx`: `77` href | `missingCount: 0` | `dupCount: 0` | `usesRbac: true`
- `components/inspection/InspectionSidebar.tsx`: `32` href | `missingCount: 0` | `dupCount: 0` | `usesRbac: true`
- `components/franchise/Sidebar.tsx`: `25` href | `missingCount: 0` | `dupCount: 0` | `usesRbac: true`
- `components/PersonnelSidebar.tsx`: `22` href | `missingCount: 0` | `dupCount: 0` | `usesRbac: true`
- `components/subcontractor/SubcontractorSidebar.tsx`: `6` href | `missingCount: 0` | `dupCount: 0` | `usesRbac: true`

---

## 3. Katman 2 — Canlı API Test Sonuçları (`scripts/test-phase1-api.mjs`)

Toplam **36 kontrol / 36 PASS**:

1. **Unauthenticated (`401`) Kontrolleri:**
   - Login dışındaki **26** `/api/mobile/*` rotasına karşılık gelen **37** HTTP metot+uç isteği (`GET`, `POST`, `PATCH`) tokensiz gönderildi → **37/37 kesin `401 Unauthorized`**.
2. **11 Test Aktörü Auth & Sözleşme Doğrulaması (`POST /api/mobile/auth/login`, `GET /api/mobile/auth/me`, `GET` & `POST /api/mobile/sso-token`):**
   - `ADMIN`, `SITE_MANAGER`, `ENGINEER`, `WORKER`, `DRIVER`, `SUBCONTRACTOR`, `INSPECTION_ADMIN`, `INSPECTOR`, `LAB_TECH`, `FRANCHISE_ADMIN`, `FRANCHISEE` → **11/11 PASS** (`accessToken`, `allowedModules`, `locationTrackingMode`, `assignedProjects` dolu ve tutarlı).
3. **Pozitif API Akışları (Yetkili Roller — 17 Kontrol Grubu + Logout):**
   - `dashboard`, `telemetry/location`, `routes`, `work-proofs` + `work-proofs/[id]/review` (`PATCH` + `POST`), `inspections`, `samples` (`POST`/`GET`/`PATCH`), `deficiencies` (`POST`/`GET`/`PATCH`), `forms`, `attendance`, `hr/requests` (`POST`/`GET`/`PATCH`), `hr/self`, `logistics` (`GATE_CHECKIN`, `CREATE_REQUEST`, `CONSUME_QR`), `isg` (`NearMiss` + `SOS`), `chat`, `ai/vision`, `sync/batch` ve 6 legacy uç (`journal`, `tasks`, `tasks/progress`, `inventory/consume`, `receiving`, `logistics/status`) ile `auth/logout` → **Tamamı `200` PASS**.
4. **Sert Negatif Yetki & Çapraz İzolasyon Testleri (`403` / Sıfır Sızıntı):**
   - `WORKER` → `/api/mobile/work-proofs/[id]/review`, `/api/admin/finance`, `/api/admin/payroll` => **403**.
   - `INSPECTOR` → `/api/admin/finance`, `/api/admin/payroll`, `/api/mobile/work-proofs/[id]/review`, `/api/mobile/work-proofs`, `/api/mobile/journal` => **403**.
   - `DRIVER` → `/api/mobile/samples`, `/api/mobile/inspections` => **403**.
   - `FRANCHISEE` (yalnızca Şube A yetkili) → `BranchB` için `/api/mobile/deficiencies?projectId=...` => **403**, varsayılan listede `0` Şube B kaydı, `CONTRACTOR` kiracısı projesi için `/api/mobile/dashboard?projectId=...` => **403**.
   - `SUBCONTRACTOR` (`subCompanyA` / `subA`) → `subB` `workProofB` sorgusunda (`?subcontractorId=...`) => **403**, `GET /api/mobile/work-proofs` => `0` `ProofB` sızıntısı, `GET /api/admin/subcontractor-contracts` => `0` `ContractB` sızıntısı.
   - `INSPECTION_ADMIN` → `POST /api/admin/personnel/[id]/grant-login` ile kendi personeline `CONTRACTOR` rolü (`SITE_MANAGER`) atama girişimi => **403**; `CONTRACTOR` kiracısına ait personele (`targetContractorPersonel`) rol atama girişimi => **403**.

---

## 4. Katman 3 — Playwright Headless Chromium Web E2E Sonuçları (`scripts/test-phase1-e2e.mjs`)

Toplam **6 Playwright E2E Senaryosu / 6 PASS** (Sıfır `404`, Sıfır `500`, Sıfır React hydration/console hatası):

1. **`GrantAccessModal` (`CONTRACTOR` — `/admin/personel`):** Yalnızca Müteahhit rolleri (`SITE_MANAGER`, `ENGINEER`, `WORKER`, `DRIVER`) görünür; `INSPECTION_ADMIN`, `LAB_TECH`, `FRANCHISEE` görünmez.
2. **`GrantAccessModal` (`INSPECTION` — `/inspection/personnel`) + Kanonik Redirect:** Yalnızca Yapı Denetim rolleri (`INSPECTOR`, `LAB_TECH`, `PROJECT_AUDITOR`) görünür; `SITE_MANAGER` / `Şantiye Şefi` / `FRANCHISEE` kesinlikle görünmez; `/inspection/personel` ziyareti anında `/inspection/personnel` rotasına yönlenir.
3. **`GrantAccessModal` (`FRANCHISE` — `/franchise/personnel`):** Yalnızca Franchise rolleri (`FRANCHISE_ADMIN`, `REGIONAL_MANAGER`, `FRANCHISEE`, `FITOUT_SUPERVISOR`, `FITOUT_TECH`) görünür; `SITE_MANAGER` / `Şantiye Şefi` / `LAB_TECH` görünmez.
4. **`INSPECTOR` Web İzolasyonu:** Login sonrası `/inspection/field` açılır; `Saha Terminali` görünür, `Taşeron İş Kabulleri`, `Malzeme Tüketimi (QR)`, `Kasa & Finans`, `Personeller` gizlidir; `BIM & 3D Modeller` menüsü en fazla 1 kez görünür; doğrudan `/admin/finance` ve `/inspection/finance` istekleri `/inspection` altına geri yönlendirilerek engellenir.
5. **`WORKER` Web İzolasyonu:** Login sonrası `/personnel` açılır; `QR Giriş/Çıkış`, `Görevlerim`, `İzin Yönetimi`, `Zimmetli Ekipmanlar`, `İSG Bildirimleri` görünür; `Şantiye Günlüğü`, `Taşeron İş Kabulleri`, `3D BIM & AR`, `Denetim Raporları` gizlidir; doğrudan `/admin` erişimi `/personnel` sayfasına engellenir.
6. **`FRANCHISEE` Şube & Panel İzolasyonu:** Login sonrası `/franchise/branch` açılır; sayfada yalnızca `Şube A` (`__PHASE1_AUDIT__Franchise_BranchA`) görüntülenir, `Şube B` görünmez; menüde `Şubem` bulunur ve `Kasa & Finans`, `Kullanıcılar`, `Personel` gizlidir; doğrudan `/admin` ve `/franchise/finance` istekleri `/franchise/branch` rotasına engellenir.

*(Not: Yerel `http://localhost:3000` test ortamında Vercel hosting katmanı bulunmadığı için `@vercel/analytics` ve `@vercel/speed-insights` scriptlerinin ürettiği `/_vercel/insights/script.js` ve `/_vercel/speed-insights/script.js` 404 istekleri E2E ağ kolektöründe harici telemetri istisnası olarak filtrelenmiştir.)*

---

## 5. Veritabanı Teardown, Build ve TypeScript Doğrulaması

### DB Teardown Doğrulaması (`verifyCleanDatabase()`)
Hem ADIM 2 hem ADIM 3 `finally` bloklarında ve orkestratör (`scripts/run-phase1-live-tests.mjs`) final kapanışında tüm `__PHASE1_AUDIT__` kayıtları leaf-to-root sırasıyla temizlendi ve canlı Neon PostgreSQL veritabanı doğrulandı:

```json
{
  "tenants": 0,
  "users": 0,
  "projects": 0,
  "personels": 0,
  "subcontractors": 0,
  "companies": 0,
  "workProofs": 0,
  "contracts": 0,
  "dynamicForms": 0,
  "coreSamples": 0,
  "deficiencies": 0,
  "inventoryItems": 0,
  "tasks": 0
}
```

### Build ve TypeScript
- `npm run build`: Çıkış kodu `0` (`prisma generate`, `prisma db push`, `next build --webpack`, `1543` statik/dinamik sayfa ve `ƒ Proxy (Middleware)` başarıyla derlendi).
- `npx tsc --noEmit` (tüm son düzenlemeler sonrası): Çıkış kodu `0` (`0` hata).

---

## 6. Kalan Riskler veya Notlar

1. **Diğer Web `/api/*` Uçları:** Faz 1 canlı test paketi tüm `27` `/api/mobile/*` ucunu ve RBAC ile doğrudan ilişkili `6` admin/subcontractor API'sini kapsar; `app/api/` altındaki diğer tüm eski web uçları (ör. BIM, procurement, yibf, upload vb.) tek tek canlı test matrisine alınmamıştır.
2. **Playwright Rol Kapsamı:** Playwright tarayıcı testleri `6` ana aktörü (`ADMIN`, `INSPECTION_ADMIN`, `FRANCHISE_ADMIN`, `INSPECTOR`, `WORKER`, `FRANCHISEE`) kapsar; `SITE_MANAGER`, `ENGINEER`, `DRIVER`, `SUBCONTRACTOR` ve `LAB_TECH` rolleri API katmanında ve statik sidebar/middleware kurallarında doğrulanmış ancak ayrı Playwright oturumlarında çalıştırılmamıştır.
3. **Çerçeve (Framework) Uyarıları:** Next.js 16 derlemesi sırasında `middleware.ts` için `proxy` konvansiyonuna geçiş önerisi uyarısı, `package.json#prisma` uyarısı ve `jose` Edge Runtime `CompressionStream`/`DecompressionStream` uyarıları mevcuttur (çalışmayı engellememektedir).

