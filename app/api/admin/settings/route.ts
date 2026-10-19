/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Sistem ve Dış Servis API Ayarları (OpenAI, AWS Textract, Drive, TCMB)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ["drive_folder_id", "openai_api_key", "aws_textract_key", "tcmb_sync_enabled"]
        }
      }
    })

    const driveFolderSetting = settings.find((s) => s.key === "drive_folder_id")?.value || ""
    const openAiKeyFromDb = settings.find((s) => s.key === "openai_api_key")?.value || ""
    const awsKeyFromDb = settings.find((s) => s.key === "aws_textract_key")?.value || ""
    const tcmbSync = settings.find((s) => s.key === "tcmb_sync_enabled")?.value || "true"

    // Ortam değişkenlerinden gelen değerler varsa kontrol et
    const effectiveOpenAiKey = openAiKeyFromDb || process.env.OPENAI_API_KEY || ""
    const effectiveAwsKey = awsKeyFromDb || process.env.AWS_TEXTRACT_KEY || ""

    return NextResponse.json({
      driveFolderId: driveFolderSetting,
      openaiApiKey: effectiveOpenAiKey,
      awsTextractKey: effectiveAwsKey,
      hasOpenAiKey: Boolean(effectiveOpenAiKey),
      hasAwsKey: Boolean(effectiveAwsKey),
      tcmbSyncEnabled: tcmbSync === "true"
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { driveFolderId, openaiApiKey, awsTextractKey, tcmbSyncEnabled } = body

    const upsertSetting = async (key: string, value: string | undefined | null) => {
      if (value !== undefined && value !== null) {
        await prisma.systemSettings.upsert({
          where: { key },
          update: { value: String(value).trim() },
          create: { key, value: String(value).trim() }
        })
      }
    }

    if (driveFolderId !== undefined) await upsertSetting("drive_folder_id", driveFolderId)
    if (openaiApiKey !== undefined) await upsertSetting("openai_api_key", openaiApiKey)
    if (awsTextractKey !== undefined) await upsertSetting("aws_textract_key", awsTextractKey)
    if (tcmbSyncEnabled !== undefined) await upsertSetting("tcmb_sync_enabled", String(tcmbSyncEnabled))

    return NextResponse.json({ success: true, message: "Ayarlar başarıyla kaydedildi" })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
