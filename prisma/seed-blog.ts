/**
 * © 2026 NXA Software. All rights reserved.
 * Seed script for initial BlogPost records
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const posts = [
    {
      title: "Mega Şantiyelerde Finansal Kaçakların Önlenmesi ve Otonom Hakediş Yönetimi",
      slug: "mega-santiyelerde-finansal-kacaklarin-onlenmesi-ve-otonom-hakedis-yonetimi",
      category: "Vaka Analizi (Case Study)",
      targetAudience: "Müteahhitler, CFO'lar, Proje Direktörleri",
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
      console.log(`Created blog post: ${post.title}`)
    } else {
      console.log(`Post already exists: ${post.slug}`)
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
