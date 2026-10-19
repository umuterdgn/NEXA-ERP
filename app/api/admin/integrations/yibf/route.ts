/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Çevre ve Şehircilik Bakanlığı (YİBF/UDS) Entegrasyon Ayarları API'si
 * AES-256 Şifrelemeli Kayıt ve Güvenli Maskeleme
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptAES, decryptAES, maskSensitive } from "@/lib/crypto-vault";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tcSetting, passSetting, activeSetting, syncSetting] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: "yibf_tc_kimlik" } }),
      prisma.systemSettings.findUnique({ where: { key: "yibf_edevlet_password" } }),
      prisma.systemSettings.findUnique({ where: { key: "yibf_is_active" } }),
      prisma.systemSettings.findUnique({ where: { key: "yibf_auto_sync" } }),
    ]);

    const plainTc = tcSetting?.value ? decryptAES(tcSetting.value) : "";
    const hasPassword = Boolean(passSetting?.value);

    return NextResponse.json({
      tcKimlik: plainTc ? maskSensitive(plainTc, 3, 2) : "",
      rawTcPresent: Boolean(plainTc),
      hasPassword,
      isActive: activeSetting?.value === "true",
      autoSync: syncSetting?.value || "MANUAL",
      encryptionProtocol: "AES-256-CBC Hardware Enclave",
      lastUpdated: passSetting?.updatedAt || tcSetting?.updatedAt || null,
    });
  } catch (error) {
    console.error("YIBF settings fetch error:", error);
    return NextResponse.json({ error: "Ayarlar alınamadı." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tcKimlik, password, isActive, autoSync } = body;

    // 1. TC Kimlik No Şifrele ve Kaydet
    if (tcKimlik && !tcKimlik.includes("*")) {
      const encryptedTc = encryptAES(tcKimlik);
      await prisma.systemSettings.upsert({
        where: { key: "yibf_tc_kimlik" },
        update: { value: encryptedTc },
        create: { key: "yibf_tc_kimlik", value: encryptedTc },
      });
    }

    // 2. E-Devlet Şifresi Şifrele ve Kaydet (Asla düz metin saklanmaz!)
    if (password && !password.includes("*")) {
      const encryptedPass = encryptAES(password);
      await prisma.systemSettings.upsert({
        where: { key: "yibf_edevlet_password" },
        update: { value: encryptedPass },
        create: { key: "yibf_edevlet_password", value: encryptedPass },
      });
    }

    // 3. Durum ve Otomatik Senkronizasyon
    if (isActive !== undefined) {
      await prisma.systemSettings.upsert({
        where: { key: "yibf_is_active" },
        update: { value: String(isActive) },
        create: { key: "yibf_is_active", value: String(isActive) },
      });
    }

    if (autoSync !== undefined) {
      await prisma.systemSettings.upsert({
        where: { key: "yibf_auto_sync" },
        update: { value: String(autoSync) },
        create: { key: "yibf_auto_sync", value: String(autoSync) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bakanlık E-Devlet kimlik bilgileri AES-256 ile güvenle şifrelendi ve kaydedildi.",
    });
  } catch (error: any) {
    console.error("YIBF settings update error:", error);
    return NextResponse.json(
      { error: error.message || "Ayarlar kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}
