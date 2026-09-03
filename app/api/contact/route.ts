/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/nodemailer"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik" },
        { status: 400 }
      )
    }

    await sendEmail({
      to: "info@mahirbakay.com",
      subject: `İletişim Formu: ${subject}`,
      text: `
Ad: ${name}
E-posta: ${email}
Telefon: ${phone || "Belirtilmedi"}
Konu: ${subject}

Mesaj:
${message}
      `,
      html: `
        <h2>İletişim Formu Mesajı</h2>
        <p><strong>Ad:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone || "Belirtilmedi"}</p>
        <p><strong>Konu:</strong> ${subject}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    })

    return NextResponse.json(
      { success: true, message: "Mesaj başarıyla gönderildi" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Mesaj gönderilirken bir hata oluştu" },
      { status: 500 }
    )
  }
}