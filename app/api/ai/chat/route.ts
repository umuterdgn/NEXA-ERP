/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"

// Mock AI responses for demo purposes
const mockResponses: Record<string, string> = {
  "kolon filiz": "TS 500 mevzuatına göre kolon filiz boyu en az 30 cm olmalıdır. Bu, kolonun temel veya döşeme ile yeterli bağlantısını sağlamak için kritik bir gerekliliktir. Ayrıca, filiz boyu kolon eninin en az 1.5 katı kadar olmalıdır.",
  "filiz boyu": "TS 500 mevzuatına göre kolon filiz boyu en az 30 cm olmalıdır. Bu, kolonun temel veya döşeme ile yeterli bağlantısını sağlamak için kritik bir gerekliliktir.",
  "personel": "Şu anda sistemde kayıtlı 87 personel bulunmaktadır. Bugün 42 personel şantiyede aktif olarak çalışmaktadır. 3 personelin İSG eğitimi süresi dolmak üzere.",
  "eksiklik": "İskenderun TOKİ projesinde 3 adet kritik eksiklik bulunmaktadır: 1) B Blok 3. katta donatı boşlukları, 2) Zemin kat kalıp desteklerinde yetersizlik, 3) İSG ekipman eksiklikleri. Mevzuata göre bu eksiklikler giderilmeden beton dökümüne onay verilemez.",
  "beton": "Bu hafta 6 adet beton dökümü planlanmıştır. En son beton dökümü A Blok 2. katta gerçekleştirilmiş ve numune sonuçları beklenmektedir.",
  "ruhsat": "Mevcut projelerden 3'ünün yapı ruhsatı süresi dolmak üzere. En yakın yenileme tarihi 15 gün sonra İskenderun TOKİ projesi içindir.",
  "hakediş": "2 adet hakediş onay beklemektedir: Yılmaz İnşaat - 1. aşama (₺450,000) ve Kaya Yapı - 2. aşama (₺320,000). Finans departmanı incelemesini sürdürmektedir.",
  "denetim": "Bugün 23 kontrol planlanmıştır. Bunlardan 8'i tamamlanmış, 15'i devam etmektedir. 1 kontrol hava muhalefeti nedeniyle ertelenmiştir.",
  "default": "Sorunuzu anladım. Şu anda demo modunda çalışıyorum, bu yüzden gerçek bir AI modeli yerine önceden tanımlı yanıtlar veriyorum. Gerçek OpenAI/Gemini entegrasyonu için API key gereklidir. Proje verileri, mevzuat soruları veya şantiye durumu hakkında başka sorularınız varsa lütfen sorun."
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Simulate AI processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Find matching response based on keywords
    const lowerMessage = message.toLowerCase()
    let response = mockResponses.default

    for (const [keyword, answer] of Object.entries(mockResponses)) {
      if (keyword !== "default" && lowerMessage.includes(keyword)) {
        response = answer
        break
      }
    }

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    )
  }
}
