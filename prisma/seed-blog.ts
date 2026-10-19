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
