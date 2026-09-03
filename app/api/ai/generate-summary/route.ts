/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { stats } = await request.json();

    if (!stats) {
      return NextResponse.json({ error: "İstatistikler gerekli" }, { status: 400 });
    }

    // Mock AI summary generation
    // In production, this would use OpenAI API or similar
    const { totalInspections, openedDeficiencies, closedDeficiencies, topProblematicProjects } = stats;
    const closureRate = Math.round((closedDeficiencies / openedDeficiencies) * 100);
    const topProject = topProblematicProjects[0];

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const currentMonth = monthNames[new Date().getMonth()];

    const summary = `${currentMonth} ayında toplam ${totalInspections} saha kontrolü gerçekleştirilmiştir. Açılan ${openedDeficiencies} uygunsuzluğun %${closureRate}'si başarıyla kapatılmış olup, özellikle YİBF ${topProject.yibfNo} projesindeki ${topProject.mainIssue} dikkat çekmektedir. Genel saha performansı olumludur.`;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summary generation error:", error);
    return NextResponse.json({ error: "Özet oluşturma hatası" }, { status: 500 });
  }
}
