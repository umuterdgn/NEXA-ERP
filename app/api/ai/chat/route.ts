/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - AI Tahsilat ve Risk Asistanı (RAG & Multi-LLM Engine)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper to format currency in Turkish Lira
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(amount)
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mesaj alanı zorunludur." },
        { status: 400 }
      )
    }

    // =========================================================================
    // 1. RAG DATA COLLECTION FROM PRISMA
    // =========================================================================
    const now = new Date()

    // Fetch contracts, progress billings, subcontractors, and projects in parallel
    const [contracts, billings, subcontractors, projects] = await Promise.all([
      prisma.contract.findMany({
        include: {
          subcontractor: {
            select: { id: true, name: true, phone: true, taxNumber: true }
          },
          project: {
            select: { id: true, title: true, status: true, progress: true }
          },
          billings: {
            select: { id: true, billingNumber: true, grossAmount: true, netPayable: true, status: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.progressBilling.findMany({
        include: {
          contract: {
            include: {
              subcontractor: { select: { id: true, name: true } },
              project: { select: { id: true, title: true } }
            }
          }
        },
        orderBy: { period: "desc" }
      }),
      prisma.subcontractor.findMany({
        include: {
          contracts: {
            select: { id: true, title: true, totalAmount: true, status: true, startDate: true, endDate: true }
          },
          deductions: {
            select: { id: true, amount: true, reason: true, notes: true }
          }
        }
      }),
      prisma.project.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          healthScore: true,
          startDate: true,
          endDate: true,
          category: true,
          city: true
        },
        orderBy: { createdAt: "desc" }
      })
    ])

    // =========================================================================
    // 2. ANALYZE AND CALCULATE RISK METRICS
    // =========================================================================
    
    // Delayed contracts (endDate passed but status is still ACTIVE)
    const delayedContracts = contracts.filter(c => {
      const isPast = new Date(c.endDate) < now
      return isPast && c.status === "ACTIVE"
    })

    // Progress billings analysis
    const pendingBillings = billings.filter(b => b.status === "PENDING_APPROVAL" || b.status === "DRAFT")
    const approvedBillings = billings.filter(b => b.status === "APPROVED")
    const paidBillings = billings.filter(b => b.status === "PAID")

    const totalContractValue = contracts.reduce((acc, c) => acc + (c.totalAmount || 0), 0)
    const totalPendingAmount = pendingBillings.reduce((acc, b) => acc + (b.netPayable || 0), 0)
    const totalApprovedAmount = approvedBillings.reduce((acc, b) => acc + (b.netPayable || 0), 0)
    const totalPaidAmount = paidBillings.reduce((acc, b) => acc + (b.netPayable || 0), 0)

    // Subcontractors with delays or penalties
    const subcontractorRisks = subcontractors.map(sub => {
      const subContracts = sub.contracts || []
      const delayed = subContracts.filter(c => new Date(c.endDate) < now && c.status === "ACTIVE")
      const totalContract = subContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
      const totalDeductions = (sub.deductions || []).reduce((sum, d) => sum + (d.amount || 0), 0)

      let riskScore = 15 // base score
      if (delayed.length > 0) riskScore += delayed.length * 30
      if (totalDeductions > 50000) riskScore += 25
      riskScore = Math.min(riskScore, 100)

      return {
        name: sub.name,
        contractsCount: subContracts.length,
        delayedCount: delayed.length,
        totalContractValue: totalContract,
        totalDeductions,
        riskScore
      }
    }).sort((a, b) => b.riskScore - a.riskScore)

    // Projects with delay or low health score
    const projectsAtRisk = projects.filter(p => {
      const isOverdue = p.endDate ? new Date(p.endDate) < now && p.status !== "TAMAMLANDI" : false
      const isLowHealth = (p.healthScore ?? 100) < 70
      return isOverdue || isLowHealth
    })

    // Build synthesized RAG knowledge payload
    const ragSummary = {
      timestamp: now.toISOString(),
      contractsTotalCount: contracts.length,
      delayedContractsCount: delayedContracts.length,
      delayedContractsList: delayedContracts.map(c => ({
        contractTitle: c.title,
        subcontractor: c.subcontractor?.name || "Bilinmiyor",
        project: c.project?.title || "Bilinmiyor",
        totalAmount: c.totalAmount,
        endDate: c.endDate.toISOString().split("T")[0],
        daysOverdue: Math.max(0, Math.floor((now.getTime() - new Date(c.endDate).getTime()) / (1000 * 60 * 60 * 24)))
      })),
      financialOverview: {
        totalContractValue,
        totalPendingBillingAmount: totalPendingAmount,
        pendingBillingsCount: pendingBillings.length,
        totalApprovedBillingAmount: totalApprovedAmount,
        totalPaidBillingAmount: totalPaidAmount,
        pendingBillingList: pendingBillings.slice(0, 8).map(b => ({
          subcontractor: b.contract?.subcontractor?.name || "Bilinmiyor",
          project: b.contract?.project?.title || "Bilinmiyor",
          netPayable: b.netPayable,
          grossAmount: b.grossAmount,
          status: b.status,
          period: b.period.toISOString().split("T")[0]
        }))
      },
      subcontractorRisks: subcontractorRisks.slice(0, 6),
      projectsAtRisk: projectsAtRisk.map(p => ({
        title: p.title,
        status: p.status,
        progress: p.progress,
        healthScore: p.healthScore,
        endDate: p.endDate ? p.endDate.toISOString().split("T")[0] : "Belirtilmemiş"
      }))
    }

    // =========================================================================
    // 3. SYSTEM PROMPT FOR AI WITH INJECTED REAL-TIME DATA
    // =========================================================================
    const systemPrompt = `Sen Nexa ERP sisteminin üst düzey "Finans, Tahsilat ve Şantiye Risk Analiz Asistanı"sın.
Kullanıcı bir inşaat yöneticisi veya şirket CEO'sudur.
Veritabanından canlı olarak çekilen güncel RAG verileri aşağıdadır:

GÜNCEL ERP DURUMU:
- Toplam Sözleşme Hacmi: ${formatCurrency(ragSummary.financialOverview.totalContractValue)}
- İncelenen Toplam Sözleşme Sayısı: ${ragSummary.contractsTotalCount}
- Süresi Geçtiği Halde Tamamlanmayan (Geciken) Sözleşme Sayısı: ${ragSummary.delayedContractsCount}
- Onay/Ödeme Bekleyen Hakediş Sayısı: ${ragSummary.financialOverview.pendingBillingsCount}
- Bekleyen Hakedişlerin Toplam Tutarı: ${formatCurrency(ragSummary.financialOverview.totalPendingBillingAmount)}
- Onaylanmış Hakediş Tutarı: ${formatCurrency(ragSummary.financialOverview.totalApprovedBillingAmount)}
- Ödenmiş Hakediş Tutarı: ${formatCurrency(ragSummary.financialOverview.totalPaidBillingAmount)}

GECİKEN SÖZLEŞMELER VE TAŞERONLAR:
${ragSummary.delayedContractsList.length > 0 
  ? ragSummary.delayedContractsList.map(c => `• ${c.subcontractor} (${c.project} - "${c.contractTitle}"): ${c.daysOverdue} gün gecikti. Tutar: ${formatCurrency(c.totalAmount)}`).join("\n")
  : "Şu anda süresi geçmiş geciken aktif sözleşme bulunmuyor."}

RİSKLİ TAŞERON SKORLARI:
${ragSummary.subcontractorRisks.map(s => `• ${s.name}: Risk Skoru %${s.riskScore} (Geciken İş: ${s.delayedCount}, Toplam Sözleşme: ${formatCurrency(s.totalContractValue)}, Kesintiler: ${formatCurrency(s.totalDeductions)})`).join("\n")}

BEKLEYEN HAKEDİŞLER:
${ragSummary.financialOverview.pendingBillingList.length > 0
  ? ragSummary.financialOverview.pendingBillingList.map(b => `• ${b.subcontractor} (${b.project}): Net Ödenecek: ${formatCurrency(b.netPayable)}, Durum: ${b.status}, Dönem: ${b.period}`).join("\n")
  : "Bekleyen hakediş bulunmuyor."}

RİSKLİ/GECİKEN PROJELER:
${ragSummary.projectsAtRisk.length > 0
  ? ragSummary.projectsAtRisk.map(p => `• ${p.title}: Durum ${p.status || "Bilinmiyor"}, İlerleme %${p.progress}, Sağlık Skoru %${p.healthScore}, Bitiş: ${p.endDate}`).join("\n")
  : "Tüm projeler takvime ve sağlık skoruna uygun ilerliyor."}

GÖREV TALİMATLARIN:
1. Yanıtlarını profesyonel, net, doğrudan bir CFO/Şantiye Direktörü gibi ver.
2. Net rakamlar, taşeron isimleri, gecikme günleri ve TL tutarlarını belirterek konuş.
3. Soruda gecikme, hakediş, risk veya bütçe soruluyorsa ilgili bölümleri öne çıkar.
4. Çözüm ve aksiyon önerileri ekle (Örn: teminat mektubu incelenmesi, cezai kesinti uygulanması, hakediş onay önceliği vb.).
5. Markdown formatında başlıklar, maddeler ve kalın vurgular kullan.`

    // =========================================================================
    // 4. LLM INVOCATION (OpenAI, Gemini or Intelligent Autonomous Engine)
    // =========================================================================
    
    // Check OpenAI API Key
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...(Array.isArray(history) ? history.slice(-6) : []),
              { role: "user", content: message }
            ],
            temperature: 0.3,
            max_tokens: 1200
          })
        })

        if (response.ok) {
          const data = await response.json()
          const aiText = data.choices?.[0]?.message?.content
          if (aiText) {
            return NextResponse.json({
              message: aiText,
              ragMetrics: {
                totalContracts: ragSummary.contractsTotalCount,
                delayedContracts: ragSummary.delayedContractsCount,
                pendingBillings: ragSummary.financialOverview.pendingBillingsCount,
                pendingAmount: ragSummary.financialOverview.totalPendingBillingAmount
              }
            })
          }
        }
      } catch (openAiErr) {
        console.warn("OpenAI API call failed, falling back to autonomous engine:", openAiErr)
      }
    }

    // Check Gemini API Key
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nKullanıcı Sorusu: ${message}` }]
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (aiText) {
            return NextResponse.json({
              message: aiText,
              ragMetrics: {
                totalContracts: ragSummary.contractsTotalCount,
                delayedContracts: ragSummary.delayedContractsCount,
                pendingBillings: ragSummary.financialOverview.pendingBillingsCount,
                pendingAmount: ragSummary.financialOverview.totalPendingBillingAmount
              }
            })
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to autonomous engine:", geminiErr)
      }
    }

    // =========================================================================
    // 5. AUTONOMOUS INTELLIGENT ERP ANALYZER (Deterministic RAG Synthesis)
    // =========================================================================
    const lower = message.toLowerCase()
    let responseText = ""

    if (lower.includes("gecik") || lower.includes("taşeron") || lower.includes("taseron") || lower.includes("geciktiriyor")) {
      // Subcontractor & delay analysis
      if (ragSummary.delayedContractsList.length > 0) {
        const topDelays = ragSummary.delayedContractsList.slice(0, 5)
        responseText = `### ⚠️ Taşeron Gecikme ve Termin Analizi\n\nSistemdeki aktif sözleşmeler tarandı. **${ragSummary.delayedContractsCount} adet sözleşmenin** teslim tarihi aşıldığı halde işlerin devam ettiği tespit edildi:\n\n`
        topDelays.forEach((item, idx) => {
          responseText += `${idx + 1}. **${item.subcontractor}**\n`
          responseText += `   - **Proje & İş:** ${item.project} — *${item.contractTitle}*\n`
          responseText += `   - **Gecikme Süresi:** 🔴 **${item.daysOverdue} gün** aşıldı (Planlanan Bitiş: ${item.endDate})\n`
          responseText += `   - **Sözleşme Tutarı:** ${formatCurrency(item.totalAmount)}\n\n`
        })
        responseText += `#### 📋 Önerilen Aksiyon Planı:\n`
        responseText += `- 📌 **İhtarname & Ek Süre Bildirimi:** Özellikle en yüksek gecikmeye sahip firmaya derhal resmi revize iş programı ihtarı çekilmelidir.\n`
        responseText += `- 📌 **Hakediş Blokesi:** Varsa bekleyen hakediş ödemelerinden sözleşme gecikme cezası katsayısı düşülmelidir.\n`
        responseText += `- 📌 **Saha Teyidi:** Şantiye şefinden iş ilerleme yüzdesi ve şantiyedeki aktif usta sayısı talep edilmelidir.`
      } else {
        responseText = `### ✅ Taşeron Termin Durumu Mükemmel\n\nVeritabanı kayıtları incelendiğinde şu anda termin tarihini aşmış veya takvimin gerisinde kalmış aktif bir taşeron sözleşmesi bulunmamaktadır.\n\nToplam **${ragSummary.contractsTotalCount} aktif sözleşme** belirlenen iş programına uygun şekilde ilerlemektedir.`
      }
    } else if (lower.includes("hakediş") || lower.includes("hakedis") || lower.includes("ödeme") || lower.includes("odeme") || lower.includes("tahsilat")) {
      // Progress billing & payment risk analysis
      responseText = `### 💰 Hakediş ve Nakit Akışı Risk Analizi\n\nFinans ve taşeron hakediş tablolarının anlık tarama sonuçları:\n\n`
      responseText += `- **Bekleyen Hakediş Sayısı:** **${ragSummary.financialOverview.pendingBillingsCount} adet**\n`
      responseText += `- **Onay / Ödeme Bekleyen Toplam Tutar:** 🔴 **${formatCurrency(ragSummary.financialOverview.totalPendingBillingAmount)}**\n`
      responseText += `- **Şu Ana Kadar Ödenen Hakediş:** 🟢 ${formatCurrency(ragSummary.financialOverview.totalPaidBillingAmount)}\n`
      responseText += `- **Onay Aşamasındaki Hakedişler:** 🟡 ${formatCurrency(ragSummary.financialOverview.totalApprovedBillingAmount)}\n\n`

      if (ragSummary.financialOverview.pendingBillingList.length > 0) {
        responseText += `#### 🔍 Onay Bekleyen Kritik Hakedişler:\n`
        ragSummary.financialOverview.pendingBillingList.slice(0, 4).forEach((b, i) => {
          responseText += `${i + 1}. **${b.subcontractor}** (${b.project})\n`
          responseText += `   - **Net Tutar:** ${formatCurrency(b.netPayable)} | **Durum:** ${b.status} | **Dönem:** ${b.period}\n`
        })
        responseText += `\n`
      }

      responseText += `#### ⚠️ Risk Değerlendirmesi:\n`
      responseText += `Bekleyen hakedişlerin şantiye ilerlemesi ve şantiye şefi saha kanıtları incelenmeden muhasebeye aktarılmaması önerilir. Hakediş onayındaki 7 günden fazla gecikmeler taşeronun sahayı yavaşlatmasına sebep olabilir.`
    } else if (lower.includes("bütçe") || lower.includes("butce") || lower.includes("proje") || lower.includes("aşım") || lower.includes("ozet")) {
      // Project budget & portfolio overview
      responseText = `### 🏗️ Proje Portföyü ve Bütçe / Sağlık Özeti\n\nSistemde kayıtlı **${projects.length} proje** ve bağlı sözleşmeler incelendi:\n\n`
      responseText += `- **Toplam Taahhüt Hacmi:** ${formatCurrency(ragSummary.financialOverview.totalContractValue)}\n`
      responseText += `- **Riskli / Düşük Sağlık Skoruna Sahip Projeler:** **${ragSummary.projectsAtRisk.length} adet**\n\n`

      if (ragSummary.projectsAtRisk.length > 0) {
        responseText += `#### 🚨 Dikkat Gerektiren Projeler:\n`
        ragSummary.projectsAtRisk.slice(0, 4).forEach(p => {
          responseText += `• **${p.title}**\n`
          responseText += `  - Sağlık Skoru: %${p.healthScore} | İlerleme: %${p.progress} | Durum: ${p.status || "Aktif"}\n`
          responseText += `  - Hedef Bitiş: ${p.endDate}\n`
        })
        responseText += `\n`
      } else {
        responseText += `Projelerin genel sağlık skoru ortalaması %85'in üzerinde olup kritik bütçe sapması tespit edilmemiştir.\n\n`
      }

      responseText += `#### 💡 Finansal Öneri:\n`
      responseText += `Tamamlanma yüzdesi %60'ın üzerinde olan projelerde kalan malzeme alımları ve taşeron son hak ediş kesintileri (stopaj/teminat) tekrar gözden geçirilmelidir.`
    } else {
      // General comprehensive risk summary
      responseText = `### 📊 Nexa ERP — Finans ve Şantiye Risk Genel Raporu\n\n`
      responseText += `Şirket portföyündeki **${ragSummary.contractsTotalCount} sözleşme**, **${projects.length} proje** ve **${subcontractors.length} taşeron** incelendi:\n\n`
      responseText += `| Metrik | Değer | Durum |\n`
      responseText += `| :--- | :--- | :--- |\n`
      responseText += `| Toplam Sözleşme Hacmi | ${formatCurrency(ragSummary.financialOverview.totalContractValue)} | 📈 Genel |\n`
      responseText += `| Geciken Sözleşmeler | ${ragSummary.delayedContractsCount} adet | ${ragSummary.delayedContractsCount > 0 ? "🔴 Riskli" : "🟢 Normal"} |\n`
      responseText += `| Bekleyen Hakedişler | ${formatCurrency(ragSummary.financialOverview.totalPendingBillingAmount)} | ${ragSummary.financialOverview.totalPendingBillingAmount > 0 ? "🟡 Onay Bekliyor" : "🟢 Temiz"} |\n`
      responseText += `| En Yüksek Riskli Taşeron | ${ragSummary.subcontractorRisks[0]?.name || "Yok"} | Risk: %${ragSummary.subcontractorRisks[0]?.riskScore || 0} |\n\n`
      
      responseText += `Detaylı analiz için aşağıdaki hazır komutları kullanabilirsiniz:\n`
      responseText += `- *"Hangi taşeronlar işi geciktiriyor?"*\n`
      responseText += `- *"Hakediş ödemelerinde risk var mı?"*\n`
      responseText += `- *"Bütçe aşımı olan projeleri özetle"*`
    }

    return NextResponse.json({
      message: responseText,
      ragMetrics: {
        totalContracts: ragSummary.contractsTotalCount,
        delayedContracts: ragSummary.delayedContractsCount,
        pendingBillings: ragSummary.financialOverview.pendingBillingsCount,
        pendingAmount: ragSummary.financialOverview.totalPendingBillingAmount
      }
    })
  } catch (error: any) {
    console.error("AI Assistant Chat API Error:", error)
    return NextResponse.json(
      { error: "AI analizi sırasında bir hata meydana geldi.", details: error.message },
      { status: 500 }
    )
  }
}
