"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AboutClientProps {
  title: string
  content: string
}

export default function AboutClient({ title, content }: AboutClientProps) {
  const growthData = [
    { year: "2019", projects: 12 },
    { year: "2020", projects: 25 },
    { year: "2021", projects: 43 },
    { year: "2022", projects: 67 },
    { year: "2023", projects: 89 },
    { year: "2024", projects: 115 },
  ]

  return (
    <main className="min-h-screen">
      {/* Video Background Header */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          >
            <source src="/about-video.mp4" type="video/mp4" />
          </video>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {title || "Hakkımızda"}
          </h1>
          <div className="text-lg md:text-xl text-slate-300 leading-relaxed">
            {content || "İçerik yükleniyor..."}
          </div>
        </motion.div>
      </section>

      {/* Vision & Mission Section with Image */}
      <section className="py-16 px-4 bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Vision & Mission Text */}
            <div className="space-y-8">
              <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Vizyonumuz
                </h2>
                <p className="text-base text-slate-300 leading-relaxed">
                  Sektörde lider konumumuzu koruyarak, yenilikçi teknolojiler ve sürdürülebilir çözümlerle geleceği inşa etmeyi hedefliyoruz.
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 border border-slate-700">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Misyonumuz
                </h2>
                <p className="text-base text-slate-300 leading-relaxed">
                  Müşteri memnuniyetini ön planda tutarak, kaliteli ve güvenilir mühendislik hizmetleri sunmak ve topluma değer katmaktır.
                </p>
              </div>
            </div>

            {/* Image with Animation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                <Image
                  src="/about-placeholder.png"
                  alt="Mahir Bakay Mühendislik"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Growth Chart Section */}
      <section className="py-16 px-4 bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Yıllara Göre Tamamlanan Projeler
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Her yıl başarıyla tamamladığımız proje sayıları
          </p>
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value: any) => [`${value} Proje`, "Proje Sayısı"]}
                />
                <Area
                  type="monotone"
                  dataKey="projects"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProjects)"
                  name="Proje Sayısı"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* Statistics Grid */}
      <section className="py-16 px-4 bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ translateY: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
            >
              <div className="text-3xl font-bold text-slate-200 mb-2">20+</div>
              <div className="text-sm text-slate-400">Yıllık Tecrübe</div>
            </motion.div>
            
            <motion.div
              whileHover={{ translateY: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
            >
              <div className="text-3xl font-bold text-slate-200 mb-2">500+</div>
              <div className="text-sm text-slate-400">Tamamlanan Proje</div>
            </motion.div>
            
            <motion.div
              whileHover={{ translateY: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
            >
              <div className="text-3xl font-bold text-slate-200 mb-2">50+</div>
              <div className="text-sm text-slate-400">Profesyonel Ekip</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Back to Home */}
      <section className="py-12 px-4 bg-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            href="/"
            className="inline-block bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </section>
    </main>
  )
}
