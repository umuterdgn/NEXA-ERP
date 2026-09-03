/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();

    // Mock RAG responses for construction regulation questions
    let response = "";
    let source = "";

    if (lowerMessage.includes("kolon") && (lowerMessage.includes("boyut") || lowerMessage.includes("en"))) {
      response = "TS500'e göre minimum kolon boyutları aşağıdaki gibidir:\n\n• Minimum kolon eni: 25 cm\n• Minimum kolon boyu: 25 cm\n• Minimum kolon derinliği: 25 cm\n\nAncak bu değerler yapısal hesaplamalara göre artırılabilir. Özellikle deprem bölgelerinde ve yüksek yapılarda daha büyük boyutlar gerekebilir. Ayrıca kolon en/boy oranı 1/4'ten küçük olmamalıdır.";
      source = "TS500 Betonarme Yapıların Tasarım ve Kuralları Bölüm 7.3";
    } else if (lowerMessage.includes("zemin") && lowerMessage.includes("etüd")) {
      response = "Zemin etüdü raporunda bulunması gereken temel belgeler şunlardır:\n\n1. **Jeolojik Etüt Raporu**\n   - Zemin özellikleri\n   - Taban suyu seviyesi\n   - Taşıma gücü değerleri\n\n2. **Jeoteknik Etüt Raporu**\n   - Zemin sınıflandırması\n   - Oturma miktarları\n   - Deprem davranış katsayısı\n\n3. **Laboratuvar Sonuçları**\n   - Sondaj numune analizleri\n   - Basınç deney sonuçları\n\n4. **Temel Tasarım Önerileri**\n   - Temel tipi önerisi\n   - Zemin iyileştirme gereklilikleri";
      source = "Türkiye Bina Deprem Yönetmeliği (TBDY 2018) Bölüm 16.2";
    } else if (lowerMessage.includes("beton") && lowerMessage.includes("dayanım")) {
      response = "TS500 ve TS EN 206-1'e göre beton dayanım sınıfları aşağıdadır:\n\n**Normal Betonlar:**\n• C8/10 - C16/20: Hafif yapılar\n• C20/25: Standart yapılar\n• C25/30: Yüksek yapılar\n• C30/37: Özel yapılar\n• C35/45 - C55/67: Çok yüksek dayanımlı betonlar\n\n**Özel Betonlar:**\n• C60/75 - C90/105: Ultra yüksek dayanımlı betonlar\n\nYapı denetiminde en çok kullanılan sınıf C25/30'dur. Kolon ve kirişlerde minimum C20/25 kullanılmalıdır.";
      source = "TS500 Betonarme Yapıların Tasarım ve Kuralları Bölüm 5.1 ve TS EN 206-1";
    } else if (lowerMessage.includes("deprem") && (lowerMessage.includes("kiriş") || lowerMessage.includes("kesme"))) {
      response = "Deprem yönetmeliğine göre kiriş kesme dayanımı hesabı şu adımlarla yapılır:\n\n1. **Kesme Gücü (Vc) Hesabı**\n   Vc = 0.7 × √(fck) × b × d\n\n2. **Donatı Kesme Dayanımı (Vs) Hesabı**\n   Vs = (Atr × fyd × d) / s\n\n3. **Toplam Kesme Dayanımı**\n   Vn = Vc + Vs\n\n4. **Güvenlik Koşulu**\n   Vd ≤ 0.8 × Vn\n\nBurada:\n• fck: Karakteristik beton dayanımı\n• b: Kiriş genişliği\n• d: Efektif yükseklik\n• Atr: Çapraz donatı alanı\n• fyd: Donatı akma dayanımı\n• s: Çapraz donatı aralığı";
      source = "Türkiye Bina Deprem Yönetmeliği (TBDY 2018) Bölüm 7.6";
    } else if (lowerMessage.includes("donatı") && lowerMessage.includes("aralık")) {
      response = "TS500'e göre donatı aralıkları aşağıdaki sınırlara uymalıdır:\n\n**Maksimum Aralıklar:**\n• Gerilme donatısı: 200 mm\n• Basınç donatısı: 300 mm\n• Çapraz donatı: 300 mm\n\n**Minimum Aralıklar:**\n• En az 1.5 × agregat maksimum boyutu\n• En az 25 mm\n• En az donatı çapı\n\n**Özel Durumlar:**\n• Çatlak kontrolü gereken yerlerde: 150 mm\n• Deprem bölgelerinde: Daha sık aralıklar önerilir";
      source = "TS500 Betonarme Yapıların Tasarım ve Kuralları Bölüm 8.2";
    } else {
      response = "Bu konuda spesifik bir mevzuat bilgisi bulamadım. Lütfen sorunuzu daha detaylı bir şekilde belirtin veya şu konularda sorabilirsiniz:\n\n• Kolon boyutları\n• Zemin etüdü gereklilikleri\n• Beton dayanım sınıfları\n• Deprem yönetmeliği hesapları\n• Donatı aralıkları\n• Beton döküm koşulları";
      source = "Genel Mevzuat Kılavuzu";
    }

    return NextResponse.json({ response, source });
  } catch (error) {
    console.error("Regulation chat error:", error);
    return NextResponse.json({ error: "Soru işleme hatası" }, { status: 500 });
  }
}
