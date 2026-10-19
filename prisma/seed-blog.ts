/**
 * © 2026 NXA Software. All rights reserved.
 * Seed script for initial BlogPost records (Bilingual TR/EN with Building Inspection Case Studies)
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const posts = [
    {
      title: "Yapı Denetiminde Gözden Kaçan Kusurlar AI Görsel Analiz ve OCR ile Nasıl Engellendi?",
      slug: "yapi-denetiminde-gozden-kacan-kusurlar-ai-gorsel-analiz-ve-ocr-ile-nasil-engellendi",
      category: "Yapı Denetim & AI",
      targetAudience: "Yapı Denetim Kuruluşları, Teknik Ofis Şefleri, Proje Müdürleri",
      language: "tr",
      author: "Nexa ERP Yapı Denetim Kurulu",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Yapı Denetim Süreçlerinde İnsan Hataları ve Manuel Evrak Yükü</h2>
<p>Yapı denetim kuruluşları ve şantiye kontrol mühendisleri, yüzlerce sayfalık ruhsat ekleri, beton döküm tutanakları ve donatı onay formları arasında kaybolmaktadır. Özellikle demir bağlama aşamasında donatı çapı, aralığı ve paspayı toleranslarının gözle denetlenmesi, insan faktörüne bağlı ciddi yapısal güvenlik açıklarına yol açabilmektedir.</p>

<h2>AI Görsel Analiz ile Demir ve Kalıp Kontrol Otomasyonu</h2>
<p>Nexa ERP Mobil Yapı Denetim modülü sayesinde saha mühendisi, döşeme veya kolon donatısını akıllı telefonuyla fotoğraflar. Entegre bilgisayarlı görü (Computer Vision) algoritması, donatı adetlerini, paspayı mesafesini ve kanca kıvrımlarını milisaniyeler içinde hesaplayarak statik proje şartnamesiyle karşılaştırır. Tespit edilen sapmalar pafta üzerinde otomatik işaretlenir.</p>

<h2>Karekodlu Karot & Numune Takibi ve Akıllı OCR Evrak Arşivi</h2>
<p>Laboratuvara gönderilen her beton numunesi (karot) karekod ile sistemde etiketlenir. Kırım testi sonuçları çıktığında, Nexa ERP Akıllı OCR (Optik Karakter Tanıma) motoru laboratuvar raporunu tarayarak basınç dayanım değerlerini (C25, C30, C35 vb.) doğrudan ilgili beton döküm günlüğüne işler. Şartnameyi karşılamayan beton partileri için Yapı Denetim Müfettişine anlık kırmızı alarm üretilir.</p>

<h2>Ölçülebilir Başarı: 180 Günlük Saha Sonuçları</h2>
<p>350.000 m² inşaat alanına sahip karma projede Nexa Yapı Denetim modülü kullanılmış; demir kontrol onay süresi %68 hızlandırılmış, evrak arşivleme hataları sıfırlanmış ve 12 adet kritik donatı uyuşmazlığı beton dökümünden önce başarıyla engellenmiştir.</p>`,
    },
    {
      title: "How Building Inspection Errors Were Eliminated with AI Visual Analysis and OCR?",
      slug: "how-building-inspection-errors-were-eliminated-with-ai-visual-analysis-and-ocr",
      category: "Building Inspection & AI",
      targetAudience: "Building Inspection Bodies, Chief Technical Officers, Project Managers",
      language: "en",
      author: "Nexa ERP Inspection Board",
      imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>The Chronic Bottleneck: Manual Inspections and Paper Bureaucracy</h2>
<p>Building inspection agencies face significant operational burdens when validating structural compliance across massive job sites. Manually verifying rebar spacing, concrete cover thickness, and cross-referencing hundreds of physical lab test reports creates dangerous compliance blindspots and causes severe project delays.</p>

<h2>AI-Powered Visual Defect Detection for Rebar & Formwork</h2>
<p>Using the Nexa ERP Mobile Inspection module, site inspectors photograph structural elements directly from tablets or mobile devices. Computer vision models instantly detect rebar counts, calculate concrete cover clearances, and cross-examine measurements against the engineering BIM specification in real time. Flagged discrepancies are immediately pinned to the 3D BIM model.</p>

<h2>End-to-End QR Core Sample Tracking and OCR Document Ingestion</h2>
<p>Every concrete cylinder and core sample sent to certified testing laboratories receives a cryptographic QR tracking tag. Once crushing tests are completed, Nexa ERP's AI-assisted OCR engine automatically parses laboratory certificates, extracts compressive strength metrics (MPa / psi), and files the records into the project's permanent digital archive.</p>

<h2>Empirical Results: Zero Critical Non-Conformances at Pour Stage</h2>
<p>Across a 350,000 m² mixed-use commercial construction project, the Nexa Inspection module reduced pre-pour inspection cycles by 68%, eliminated paperwork retrieval latency, and prevented 12 structural reinforcement defects before any concrete batch was poured.</p>`,
    },
    {
      title: "Mega Şantiyelerde Finansal Kaçakların Önlenmesi ve Otonom Hakediş Yönetimi",
      slug: "mega-santiyelerde-finansal-kacaklarin-onlenmesi-ve-otonom-hakedis-yonetimi",
      category: "Vaka Analizi (Case Study)",
      targetAudience: "Müteahhitler, CFO'lar, Proje Direktörleri",
      language: "tr",
      author: "Nexa ERP Mühendislik Ekibi",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Geleneksel Şantiye Muhasebesinin Yarattığı Kronik Kaçaklar</h2>
<p>Büyük ölçekli karma inşaat projelerinde en büyük finansal risk, sahadaki fiili imalat miktarı ile alt yüklenici hakediş faturaları arasındaki uyuşmazlıklardır. Geleneksel Excel ve kağıt bazlı metraj onay süreçlerinde, mükerrer metraj kayıtları, şantiye şefinin gözünden kaçan revizyonlar ve taşeron firmaların teslim etmediği eksik imalatlar yüzünden hakediş bütçelerinde ortalama %8 ila %15 oranında kontrolsüz bütçe aşımları yaşanmaktadır.</p>

<h2>Nexa ERP Otonom Hakediş Blokesi Nasıl Çalışır?</h2>
<p>Nexa ERP, BoQ (Bill of Quantities) hiyerarşisini doğrudan sahadan gelen şantiye günlük raporları ve 3D BIM geometrik hacim hesaplarıyla senkronize eder. Sahada şantiye şefi veya yapı denetim uzmanı tarafından mobil çevrimdışı (offline-first) onaylanmayan hiçbir poz, hakediş icmaline dahil edilemez.</p>
<p>Eğer bir taşeronun imalatında açık bir NCR (Uygunsuzluk Formu) veya çözülmemiş bir kusur varsa, Nexa ERP finans motoru taşeronun faturasına otomatik olarak %10 garanti kesintisi veya tam bloke uygular. Bu sayede teknik uyuşmazlık çözülene dek finansal risk sıfıra indirgenir.</p>

<h2>Sayısal Sonuçlar: 42 Milyon TL'lik Projede %11,4 Maliyet Tasarrufu</h2>
<p>Avrasya Ticaret Merkezi projesinde devreye alınan Nexa ERP Hakediş Modülü sayesinde 14 taşeron firmanın 9 aylık hakediş döngüsü incelenmiş; mükerrer metraj girişleri engellenerek 4.8 milyon TL tutarında haksız ödeme önlenmiştir. Teknik ofis hakediş hazırlama süresi ise 12 günden 4 saate indirilmiştir.</p>`,
    },
    {
      title: "5D BIM ile Şantiye Metraj Uyuşmazlıklarına Son: IFC Entegrasyon Raporu",
      slug: "5d-bim-ile-santiye-metraj-uyusmazliklarina-son-ifc-entegrasyon-raporu",
      category: "Teknoloji & BIM",
      targetAudience: "Teknik Ofis Şefleri, BIM Yöneticileri",
      language: "tr",
      author: "Nexa ERP Ar-Ge Departmanı",
      imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>BIM Modelleri Neden Şantiye Sahasında Terk Ediliyordu?</h2>
<p>Teknik ofislerde haftalarca emek verilerek hazırlanan Revit ve IFC modelleri, şantiye sahasına inildiğinde ağır dosya boyutları, yüksek donanım gereksinimleri ve lisans maliyetleri nedeniyle devre dışı kalıyordu. Sahadaki usta ve taşeronlar iki boyutlu PDF çizimlerine geri dönmek zorunda kalıyor, 3 boyutlu tasarımın sağladığı çakışma (clash) avantajı heba oluyordu.</p>

<h2>WebAssembly (WASM) ile Tarayıcıda 60 FPS IFC Render</h2>
<p>Nexa ERP, WebAssembly ve Three.js tabanlı özel 5D BIM görselleştiricisi ile gigabaytlarca büyüklükteki IFC modellerini saniyeler içinde tarayıcıda 60 FPS hızla işler. Her bir kolon, kiriş veya döşeme elemanı tıklandığında ilişkili poz numarası, birim fiyatı, taşeron firması ve imalat yüzdesi anında ekrana gelir.</p>

<h2>X-Ray Modu ve Lazer Metraj Ölçümü</h2>
<p>Nexa 5D BIM Viewer içerisine entegre edilen X-Ray şeffaflık modu ve 3 eksenli interaktif lazer metre, şantiye şeflerinin tablet üzerinden milimetrik mesafe ölçümü yapmasına olanak tanır. Tasarım toleranslarını aşan sapmalar anında tespit edilerek 3D uzayda işaretlenir.</p>`,
    },
    {
      title: "İnşaat Şantiyelerinde Sıfır İş Kazası Vizyonu: BLE Beacon ve İSG Radar Analitiği",
      slug: "insaat-santiyelerinde-sifir-is-kazasi-vizyonu-ble-beacon-ve-isg-radar-analitigi",
      category: "İSG & Güvenlik",
      targetAudience: "İSG Uzmanları, Şantiye Şefleri, Proje Müdürleri",
      language: "tr",
      author: "Nexa ERP Güvenlik Kurulu",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Şantiyelerde Kör Noktalar ve Kritik Risk Bölgeleri</h2>
<p>Yüksekte çalışma, vinç dönüş yarıçapı, şaft boşlukları ve hafriyat çukurları şantiyelerdeki ölümcül iş kazalarının %74'ünü oluşturmaktadır. Güvenlik kameraları ve devriye gezen İSG uzmanları, binlerce metrekarelik dev şantiyelerde aynı anda her noktayı izlemekte yetersiz kalmaktadır.</p>

<h2>KVKK Uyumlu BLE Beacon Teknolojisi</h2>
<p>Nexa ERP, şantiye sahasına yerleştirilen düşük enerjili Bluetooth (BLE) istasyonları ve personelin baretlerine takılan minyatür çipler ile çalışanların konumunu gerçek zamanlı izler. Kişisel verilerin korunması amacıyla kamera görüntüsü yerine şifreli MAC adresi bazlı radar matrisi kullanılır.</p>
<p>Yetkisiz bir personel kule vinç çalışma sahasına veya korumasız şaft boşluğuna 5 metreden fazla yaklaştığında, hem personelin bareti titreşim ve sesle uyarılır hem de İSG komuta merkezine saniyesinde alarm düşer.</p>

<h2>Proaktif Güvenlik ve Dijital KKD Zimmetleme</h2>
<p>Her personele teslim edilen baret, yelek ve ayakkabı gibi Kişisel Koruyucu Donanımlar (KKD) dijital olarak zimmetlenir. Periyodik muayene süresi dolan veya arızalanan ekipmanlar sistem tarafından otomatik olarak sahaya çıkış kısıtlamasına tabi tutulur.</p>`,
    },
    {
      title: "Hava Muhalefeti Kaynaklı Şantiye Gecikmeleri AI Algoritmalarıyla Nasıl Öngörüldü?",
      slug: "hava-muhalefeti-kaynakli-santiye-gecikmeleri-ai-algoritmalariyla-nasil-ongoruldu",
      category: "AI & Meteorolojik Risk",
      targetAudience: "Şantiye Şefleri, Kule Vinç Operasyon Müdürleri, Proje Direktörleri",
      language: "tr",
      author: "Nexa ERP Meteoroloji & AI Kurulu",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Şantiyelerde Görünmeyen Maliyet: Meteorolojik Belirsizlikler</h2>
<p>Büyük ölçekli yüksek katlı ve altyapı projelerinde hava muhalefeti, iş programı gecikmelerinin en önde gelen (%32) nedenidir. Kule vinç operasyonlarının ani rüzgar hamleleriyle durması veya taze dökülen betonun beklenmedik sağanak yağış ve don olayıyla mukavemetini kaybetmesi, müteahhit firmalara hem ağır sözleşme cezaları hem de milyonlarca liralık telafi masrafları yüklemektedir.</p>

<h2>Nexa ERP AI Destekli Hava Durumu Algoritması Nasıl Çalışır?</h2>
<p>Nexa ERP, sahadaki IoT hava istasyonları, meteorolojik uydu radarları ve son 3 yılın yerel iklim baselineları ile beslenen makine öğrenimi modelini devreye alır:</p>
<ul>
  <li><strong>Kule Vinç Rüzgar Eşiği Analitiği:</strong> Rüzgar hızı anlık veya hamle olarak 50 km/s (kritik devrilme eşiği) sınırına yaklaştığında, sistem kule vinç operatörünün ve İSG şefinin mobil cihazına 90 dakika önceden tahliye ve durdurma alarmı gönderir.</li>
  <li><strong>Yağış ve Beton Döküm Simülasyonu:</strong> Yağış ihtimali %80'in üzerine çıktığında veya gece sıcaklığı 0°C altına inme riski taşıdığında, açık alan döşeme beton dökümü için sistem otonom erteleme uyarısı üretir ve beton santraline giden irsaliye rezervasyonunu askıya alır.</li>
  <li><strong>4D Takvim Entegrasyonu:</strong> Hava kaynaklı duruşlar anında 4D BIM zaman çizelgesine işlenerek kritik yol (Critical Path) üzerindeki iş paketleri otomatik dengelenir.</li>
</ul>

<h2>Saha Sonuçları: 38 Gün Gecikme Engellendi, 3.2 Milyon TL Tasarruf</h2>
<p>İstanbul Finans Merkezi bölgesindeki 48 katlı karma kule projesinde 14 ay boyunca test edilen Nexa AI Hava Durumu sistemi, 7 adet ani rüzgar fırtınasını ve 11 kritik yağış hadisesini 24 saat önceden öngörmüştür. Gereksiz kule vinç bekleme süreleri %41 azaltılmış, yağış nedeniyle bozulacak 1.400 m³ taze beton dökümü proaktif olarak kurtarılmıştır.</p>`,
    },
    {
      title: "How Weather-Induced Construction Delays Were Predicted with AI Algorithms",
      slug: "how-weather-induced-construction-delays-were-predicted-with-ai-algorithms",
      category: "AI & Weather Risk",
      targetAudience: "Site Superintendents, Tower Crane Fleet Managers, Project Directors",
      language: "en",
      author: "Nexa ERP Meteorological AI Team",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>The Hidden Drain on Megaprojects: Meteorological Volatility</h2>
<p>Unanticipated weather events account for over 32% of construction project timeline slippages worldwide. Sudden high-altitude wind gusts stalling tower cranes, or heavy downpours compromising freshly poured slab concrete, routinely trigger catastrophic delay penalties and material waste amounting to millions of dollars.</p>

<h2>Autonomous Meteorological AI & Predictive Site Telemetry</h2>
<p>Nexa ERP integrates real-time hyper-local satellite feeds, on-site IoT sensors, and a multi-year historical climate baseline to deliver actionable forecasting intelligence:</p>
<ul>
  <li><strong>Tower Crane Critical Wind Threshold (>50 km/h):</strong> When sustained or gust wind speeds approach the 50 km/h safety boundary, Nexa's AI issues automated push notifications to crane operators and safety supervisors 90 minutes prior, orchestrating a safe shutdown.</li>
  <li><strong>Precipitation & Concrete Pour Optimization:</strong> With rain probabilities exceeding 80% or projected freeze cycles (< 0°C), the engine advises site engineers to postpone large-scale pours, dynamically freezing batching plant dispatches.</li>
  <li><strong>4D BIM Critical Path Rebalancing:</strong> Weather downtime is programmatically synced with the 4D BIM schedule, recalibrating subcontractor work sequences to eliminate idle workforce overhead.</li>
</ul>

<h2>Measured Impact: 38 Critical Path Days Saved, $420,000 In Risk Mitigated</h2>
<p>Deployed across a 48-story high-rise tower development over 14 months, the Nexa AI Weather engine successfully predicted 7 severe wind events and 11 heavy precipitation windows. Crane standby hours dropped by 41%, and 1,400 m³ of structural concrete was saved from cold-joint and rain washout failures.</p>`,
    },
    {
      title: "Laboratuvar Karot Testleri ve Numune Takibinde Karekodlu Dönüşüm",
      slug: "laboratuvar-karot-testleri-ve-numune-takibinde-karekodlu-donusum",
      category: "Yapı Denetim & Kalite",
      targetAudience: "Yapı Denetim Firmaları, Laboratuvar Yöneticileri, Kalite Kontrol Mühendisleri",
      language: "tr",
      author: "Nexa ERP Malzeme ve Laboratuvar Komitesi",
      imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Geleneksel Beton Numune Alma Süreçlerindeki Güvenlik Açıkları</h2>
<p>Şantiyelerde transmikserlerden alınan taze beton silindir numuneleri veya sertleşmiş betondan delinen karotlar, akredite test laboratuvarlarına gidene kadar şeffaflıktan uzak bir süreçten geçmektedir. Kağıt etiketlerin yırtılması, numunelerin karışması veya kür havuzundaki sıcaklık/nem takibinin aksaması, yapısal deprem güvenliğinin temelini oluşturan basınç dayanım testlerini tartışmalı hale getirmektedir.</p>

<h2>Kriptografik Karekod ve Dijital Zincir Protokolü</h2>
<p>Nexa ERP Numune & Karot Takip Modülü, numune alım anından kırım testine kadar kırılmaz bir dijital izleme zinciri kurar:</p>
<ul>
  <li><strong>Saha Alımında QR Mühürleme:</strong> Şantiye denetçisi silindir numuneyi kalıba aldığı anda hava sıcaklığını, çökme (slump) değerini ve mikser plakasını sisteme işler. Suya dayanıklı kriptografik QR etiket numunenin üzerine mühürlenir ve GPS koordinatıyla eşleşir.</li>
  <li><strong>7 ve 28 Günlük Kırım Eğrisi:</strong> Numune laboratuvara ulaştığında QR kod taranır. 7 günlük erken dayanım ve 28 günlük nihai basınç kırım sonuçları (MPa), Nexa Akıllı OCR motoru tarafından test cihazı çıktısından taranarak YİBF sistemine otomatik yüklenir.</li>
  <li><strong>Otonom Hakediş Blokesi:</strong> Şartnameye (C25/30/35) uymayan veya dayanım sapması gösteren numuneler için ilgili aksın taşeron hakedişine derhal bloke koyulur ve yapı denetçisine NCR (Uygunsuzluk Raporu) taslağı açılır.</li>
</ul>

<h2>1.800 Dökümde Sıfır Hata ve %100 Yasal Uyumluluk</h2>
<p>Ege bölgesindeki 12 toplu konut şantiyesinde uygulanan karekodlu takip sistemi sayesinde numune kayıpları tamamen sıfırlanmış, laboratuvar rapor onay süreleri 6 günden 15 dakikaya indirilmiş ve deprem yönetmeliği standartlarına %100 uyumluluk sağlanmıştır.</p>`,
    },
    {
      title: "QR-Coded Transformation in Laboratory Core Sample and Specimen Testing",
      slug: "qr-coded-transformation-in-laboratory-core-sample-and-specimen-testing",
      category: "Building Inspection & Quality",
      targetAudience: "Building Inspection Agencies, Accredited Lab Directors, QA/QC Directors",
      language: "en",
      author: "Nexa ERP Materials & Inspection Committee",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
      isPublished: true,
      content: `<h2>Vulnerabilities in Traditional Concrete Specimen Chain of Custody</h2>
<p>From transit mixer discharge to laboratory compression presses, concrete cylinders and drilled core specimens undergo critical handoffs fraught with compliance vulnerabilities. Deteriorated paper tags, misplaced curing batches, and manual transcription of pressure gauge readings undermine the structural verification essential for seismic resilience.</p>

<h2>Cryptographic QR Tagging & Automated Lab Ingestion</h2>
<p>The Nexa ERP Specimen & Core Tracking module introduces an immutable digital verification pipeline:</p>
<ul>
  <li><strong>Point-of-Pour QR Sealing:</strong> When site inspectors capture field samples, slump test metrics, ambient temperatures, and ready-mix batch tickets are recorded. Waterproof cryptographic QR tags are affixed directly to specimen surfaces, paired with precise GPS timestamps.</li>
  <li><strong>7-Day and 28-Day Compressive Break Analytics:</strong> Upon laboratory arrival, QR codes are instantly scanned. Compression results (MPa / psi) are captured from testing machine consoles via Nexa's AI OCR engine and mapped into regulatory compliance databases.</li>
  <li><strong>Automated Subcontractor Payment Holds:</strong> If 28-day break curves fail to satisfy structural engineering design thresholds (C25/30/35), the system automatically locks the corresponding work package's BoQ payment installment and flags an NCR.</li>
</ul>

<h2>Proven Integrity: Zero Lost Specimens Across 1,800 Structural Pours</h2>
<p>Implemented across 12 high-density residential towers, the QR tracking pipeline achieved 100% specimen trace rate, reduced test turnaround validation from 6 days to 15 minutes, and established total structural compliance transparency for regulatory audits.</p>`,
    },
  ]

  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    })
    if (!existing) {
      await prisma.blogPost.create({
        data: post,
      })
      console.log(`Created blog post (${post.language}): ${post.title}`)
    } else {
      await prisma.blogPost.update({
        where: { slug: post.slug },
        data: {
          language: post.language,
          category: post.category,
          targetAudience: post.targetAudience,
          content: post.content,
        },
      })
      console.log(`Updated post: ${post.slug}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
