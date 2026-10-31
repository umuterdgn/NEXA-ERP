/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { 
  Building2, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Database, 
  Layers, 
  WifiOff, 
  Radio, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  Boxes
} from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda | Neden Nexa ERP? - Otonom Şantiye Teknolojileri",
  description: "İnşaat sektöründeki %30 maliyet kaçaklarını ve İSG ihlallerini 5D BIM, yapay zeka ve BLE IoT ile sıfırlayan Nexa ERP'nin vizyonu, mimarisi ve güvenilir bulut altyapısı.",
  keywords: [
    "Neden Nexa ERP",
    "İnşaat Dijital İkiz",
    "5D BIM",
    "İnşaat ERP",
    "Offline-First İnşaat",
    "Şantiye İSG",
    "Hakediş Blokesi",
    "Drone 4D"
  ]
}

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Neden Nexa ERP? - Hakkımızda",
    "description": "İnşaat sektöründeki maliyet kaçaklarını ve İSG ihlallerini sıfıra indiren kurumsal 4D/5D BIM işletim sistemi.",
    "publisher": {
      "@type": "Organization",
      "name": "Nexa ERP / NXA Software",
      "url": "https://nxerp.com.tr"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 lg:py-24 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/15 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              Neden Nexa ERP? • Vizyonumuz
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2] mb-6">
            Geleneksel Mühendislikten{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Otonom Şantiye Yönetimine.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            İnşaat sektöründeki %30'a varan maliyet kaçaklarını, kâğıt üzerindeki hakediş usulsüzlüklerini ve İSG ihlallerini; yapay zeka, 5D BIM ve nesnelerin interneti (IoT) ile kökten çözmek için yola çıktık.
          </p>
        </div>
      </section>

      {/* Hikayemiz & Sektör Problemi */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Şantiye Gerçekliği
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Masaüstüne Hapsolan BIM Modellerine ve Kaybolan Formlara Son
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Yıllarca inşaat projelerinde en büyük sorun, genel merkezde Revit ve Navisworks ile çizilen milyon dolarlık 3D modellerin sahaya asla inememesi oldu. Sahada şantiye şefleri WhatsApp fotoğraflarıyla, ıslanan kâğıt formlarla ve karmaşık Excel tablolarıyla boğuşurken; hatalı imalatlar gözden kaçtı, taşeronlara haksız hakedişler ödendi.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Nexa ERP, ağır masaüstü yazılımlarını tarihe gömerek <strong className="text-cyan-300">WebAssembly (WASM)</strong> teknolojisiyle 3D modelleri şantiye şefinin cebindeki tablete ve telefona getirdi. Üstelik internetsiz bodrum katlarda dahi tıkır tıkır çalışan <strong className="text-cyan-300">Offline-First</strong> mimarisiyle.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-2xl font-black text-cyan-400">%30</div>
                <div className="text-xs text-slate-400 mt-1">Maliyet Kaçak Önleme</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-2xl font-black text-emerald-400">%100</div>
                <div className="text-xs text-slate-400 mt-1">Hakedişte Kusur Denetimi</div>
              </div>
            </div>
          </div>

          {/* Vizyon ve Misyon Kartları */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xl border border-cyan-500/40">
                🎯
              </div>
              <h3 className="text-xl font-black text-white">Vizyonumuz</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                İnşaat sektöründeki <strong>%30'a varan maliyet kaçaklarını ve İSG ihlallerini</strong>, yapay zeka ve nesnelerin interneti (IoT) ile sıfıra indirmek; Türkiye ve dünyada inşaatın otonom işletim standardı haline gelmek.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/40">
                🚀
              </div>
              <h3 className="text-xl font-black text-white">Misyonumuz</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Şantiyede çamurlu botlarla çalışan saha mühendisinden, genel merkezdeki finans direktörüne kadar tüm paydaşları <strong>tek bir dijital hakikat kaynağında</strong> buluşturarak, hatasız ve zaman damgalı yönetim sağlamak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Teknoloji Altyapımız (Kurumsal Güven & Kesintisizlik) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                Mühendislik & Güvenilirlik
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Kurumsal Düzeyde Güvenli ve Ölçeklenebilir Teknoloji Altyapısı
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Müteahhitlerin ve Yapı Denetim kuruluşlarının en değerli varlığı olan proje verilerini, dünya standartlarında modern SaaS mimarisiyle koruyoruz.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Altyapı Kart 1: Vercel Edge */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Vercel Edge Networks</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Global CDN ve Edge dağıtımı sayesinde şantiyeleriniz nerede olursa olsun milisaniyeler mertebesinde ultra düşük gecikme ve %99.9 erişilebilirlik.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DDoS ve bot koruması</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Her an ölçeklenebilir altyapı</span>
                </li>
              </ul>
            </div>

            {/* Altyapı Kart 2: PostgreSQL & Prisma */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">PostgreSQL & Prisma ORM</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Finansal seviyede veri bütünlüğü (ACID) ve ilişkisel güvenilirlik. Hakediş, sözleşme ve metraj kayıtlarında tek bir satır veri dahi kaybolmaz.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zaman damgalı işlem logları</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Otomatik yedekleme ve şifreleme</span>
                </li>
              </ul>
            </div>

            {/* Altyapı Kart 3: React Three Fiber & Web-IFC */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">WASM Tabanlı 5D BIM</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                WebAssembly (WASM) ve WebGL sayesinde ağır AutoCAD/Revit kurulumu gerektirmeden .ifc, .glb ve .gltf modelleri tarayıcıda 60 FPS hızla işlenir.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>X-Ray şeffaflık & disiplin filtreleri</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3D Lazer Metre ve hacim hesabı</span>
                </li>
              </ul>
            </div>

            {/* Altyapı Kart 4: Dexie.js & Offline-First */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Offline-First PWA Mimarisi</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dexie.js (IndexedDB) yerel veritabanı motoru sayesinde internetsiz bodrum katlarda dahi çizim yapabilir, puantaj girebilir ve rapor yazabilirsiniz.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Otomatik çift yönlü senkronizasyon</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sıfır veri kaybı garantisi</span>
                </li>
              </ul>
            </div>

            {/* Altyapı Kart 5: BLE IoT İSG Ağı */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">KVKK Uyumlu BLE IoT Ağı</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kamera tabanlı yasal risk taşıyan yüz tanıma yerine Bluetooth Low Energy (BLE) sensörleriyle baret, yelek ve tehlikeli bölge yaklaşım radarı.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akıllı donanım zimmeti</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>İSG ihlallerinde anlık mobil alarm</span>
                </li>
              </ul>
            </div>

            {/* Altyapı Kart 6: Veri Güvenliği & SLA */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Kurumsal Veri İzolasyonu</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Çok kiracılı (Multi-Tenant) mimaride her şirketin, taşeronun ve yapı denetim kuruluşunun veri sınırları rol bazlı kriptografik kontrollerle ayrıştırılır.
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Granüler rol bazlı erişim (RBAC)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>SSL/TLS şifreli uçtan uca iletişim</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-white">
          Nexa ERP ile Şantiyenizi Geleceğe Taşıyın
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Mühendislik ekiplerimizle görüşün, projenizin 3D modelini yükleyerek canlı demo deneyimi yaşayın.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/iletisim"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/20"
          >
            <span>Canlı Demo Talep Edin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/faq"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800"
          >
            <span>Sıkça Sorulan Sorular (S.S.S.)</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
