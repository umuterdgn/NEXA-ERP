/**
 * © 2026 NXA Software. All rights reserved.
 * Franchise / Rollout Örnek Veri Tohumlama Scripti
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Franchise / Rollout data...")

  // 1. Franchise Şirketi veya Tenant Kontrolü
  let franchiseCompany = await prisma.company.findFirst({
    where: { companyType: "FRANCHISE" },
  })

  if (!franchiseCompany) {
    franchiseCompany = await prisma.company.create({
      data: {
        name: "Nexa Retail & Franchise Group",
        slug: "nexa-retail",
        companyType: "FRANCHISE",
        type: "FRANCHISE",
        themeColor: "#2563eb",
      },
    })
    console.log("✅ Franchise Company oluşturuldu:", franchiseCompany.name)
  }

  // 2. Tip Mağaza Şablonları (StoreTemplate)
  const templateAvm = await prisma.storeTemplate.upsert({
    where: { id: "template-avm-100" },
    update: {},
    create: {
      id: "template-avm-100",
      companyId: franchiseCompany.id,
      name: "AVM Konsepti - 100m²",
      estimatedDays: 45,
      defaultBoQ: [
        { code: "ELK-01", description: "3 Fazlı Pano & Aydınlatma Rayları", unit: "Set", quantity: 1, unitPrice: 85000 },
        { code: "MEK-01", description: "VRF Tavan Tipi İklimlendirme & Menfezler", unit: "Set", quantity: 2, unitPrice: 120000 },
        { code: "MIM-01", description: "Granit Seramik Zemin Kaplaması (60x120)", unit: "m2", quantity: 100, unitPrice: 1450 },
        { code: "MIM-02", description: "OFCI Kurumsal Kasa Bankosu & Arka Görsel", unit: "Adet", quantity: 1, unitPrice: 95000 },
        { code: "TAB-01", description: "Işıklı Pleksi Kurumsal Cephe Tabelası", unit: "Adet", quantity: 1, unitPrice: 65000 },
      ],
      defaultTasks: [
        { name: "Kira Kontratı & AVM Proje Onayı", durationDays: 10 },
        { name: "Şantiye Kurulumu & Kaba Altyapı", durationDays: 12 },
        { name: "Elektrik & Havalandırma İmalatları", durationDays: 15 },
        { name: "OFCI Mağaza Mobilya & Kasa Montajı", durationDays: 5 },
        { name: "Punch List & Açılış Denetimi", durationDays: 3 },
      ],
    },
  })

  const templateCadde = await prisma.storeTemplate.upsert({
    where: { id: "template-cadde-250" },
    update: {},
    create: {
      id: "template-cadde-250",
      companyId: franchiseCompany.id,
      name: "Cadde Flagship Konsepti - 250m²",
      estimatedDays: 60,
      defaultBoQ: [
        { code: "ELK-02", description: "Endüstriyel Güç Dağıtımı & LED Spotlar", unit: "Set", quantity: 1, unitPrice: 195000 },
        { code: "MEK-02", description: "Dış Ünite Rooftop Klima Sistemi", unit: "Set", quantity: 1, unitPrice: 240000 },
        { code: "MIM-03", description: "Doğal Meşe Parke & Mikrobeton Zemin", unit: "m2", quantity: 250, unitPrice: 1800 },
        { code: "OFCI-01", description: "Merkez Sevkli Teşhir Rafları ve Askılıklar", unit: "Set", quantity: 1, unitPrice: 320000 },
      ],
      defaultTasks: [
        { name: "Belediye Ruhsatı & Statik Proje", durationDays: 15 },
        { name: "Cephe Doğrama & Cam Giydirme", durationDays: 14 },
        { name: "İnce Yapı & Zemin Kaplamaları", durationDays: 18 },
        { name: "Merkez OFCI Ürün Dizilimi", durationDays: 8 },
        { name: "İtfaiye Uygunluk & Final Kabul", durationDays: 5 },
      ],
    },
  })

  console.log("✅ Konsept şablonları hazırlandı.")

  // 3. Örnek Mağaza Projeleri
  const stores = [
    {
      id: "store-cevahir",
      name: "Nexa - Cevahir AVM Mağazası",
      city: "İstanbul",
      district: "Şişli",
      address: "Büyükdere Cad. No:22 Cevahir AVM K:2 No:142",
      latitude: 41.0628,
      longitude: 28.9932,
      progress: 68,
      status: "SAHA",
      templateId: templateAvm.id,
      companyId: franchiseCompany.id,
      gates: [
        { stageName: "KİRALAMA", isApproved: true, doc: "https://example.com/kira-cevahir.pdf" },
        { stageName: "AVM_ONAYI", isApproved: true, doc: "https://example.com/avm-onay-cevahir.pdf" },
        { stageName: "KABA_YAPI", isApproved: true, doc: "https://example.com/kaba-yapi-izni.pdf" },
        { stageName: "İTFAİYE_ONAYI", isApproved: false, doc: null },
        { stageName: "AÇILIŞ", isApproved: false, doc: null },
      ],
    },
    {
      id: "store-tunali",
      name: "Nexa - Tunalı Hilmi Cadde Mağazası",
      city: "Ankara",
      district: "Çankaya",
      address: "Tunalı Hilmi Caddesi No:88",
      latitude: 39.9056,
      longitude: 32.8612,
      progress: 15,
      status: "ETUT",
      templateId: templateCadde.id,
      companyId: franchiseCompany.id,
      gates: [
        { stageName: "KİRALAMA", isApproved: true, doc: "https://example.com/kira-tunali.pdf" },
        { stageName: "AVM_ONAYI", isApproved: false, doc: null },
        { stageName: "KABA_YAPI", isApproved: false, doc: null },
        { stageName: "İTFAİYE_ONAYI", isApproved: false, doc: null },
        { stageName: "AÇILIŞ", isApproved: false, doc: null },
      ],
    },
    {
      id: "store-alsancak",
      name: "Nexa - Alsancak Point Mağazası",
      city: "İzmir",
      district: "Konak",
      address: "Kıbrıs Şehitleri Cad. No:45",
      latitude: 38.4372,
      longitude: 27.1438,
      progress: 88,
      status: "SAHA",
      templateId: templateAvm.id,
      companyId: franchiseCompany.id,
      gates: [
        { stageName: "KİRALAMA", isApproved: true, doc: "https://example.com/kira-alsancak.pdf" },
        { stageName: "AVM_ONAYI", isApproved: true, doc: "https://example.com/onay-alsancak.pdf" },
        { stageName: "KABA_YAPI", isApproved: true, doc: "https://example.com/kaba-alsancak.pdf" },
        { stageName: "İTFAİYE_ONAYI", isApproved: true, doc: "https://example.com/itfaiye-alsancak.pdf" },
        { stageName: "AÇILIŞ", isApproved: false, doc: null },
      ],
    },
    {
      id: "store-korupark",
      name: "Nexa - Korupark AVM Mağazası",
      city: "Bursa",
      district: "Nilüfer",
      address: "Mudanya Yolu 9. Km Korupark AVM Zemin Kat",
      latitude: 40.2458,
      longitude: 28.9567,
      progress: 100,
      status: "TAMAMLANDI",
      templateId: templateAvm.id,
      companyId: franchiseCompany.id,
      gates: [
        { stageName: "KİRALAMA", isApproved: true, doc: "https://example.com/kira-korupark.pdf" },
        { stageName: "AVM_ONAYI", isApproved: true, doc: "https://example.com/onay-korupark.pdf" },
        { stageName: "KABA_YAPI", isApproved: true, doc: "https://example.com/kaba-korupark.pdf" },
        { stageName: "İTFAİYE_ONAYI", isApproved: true, doc: "https://example.com/itfaiye-korupark.pdf" },
        { stageName: "AÇILIŞ", isApproved: true, doc: "https://example.com/acilis-izni-korupark.pdf" },
      ],
    },
    {
      id: "store-terracity",
      name: "Nexa - TerraCity AVM Mağazası",
      city: "Antalya",
      district: "Muratpaşa",
      address: "Tekelioğlu Cad. No:55 Lara",
      latitude: 36.8521,
      longitude: 30.7584,
      progress: 40,
      status: "CIZIM",
      templateId: templateAvm.id,
      companyId: franchiseCompany.id,
      gates: [
        { stageName: "KİRALAMA", isApproved: true, doc: "https://example.com/kira-terracity.pdf" },
        { stageName: "AVM_ONAYI", isApproved: false, doc: null },
        { stageName: "KABA_YAPI", isApproved: false, doc: null },
        { stageName: "İTFAİYE_ONAYI", isApproved: false, doc: null },
        { stageName: "AÇILIŞ", isApproved: false, doc: null },
      ],
    },
  ]

  for (const store of stores) {
    const project = await prisma.project.upsert({
      where: { id: store.id },
      update: {
        title: store.name,
        name: store.name,
        description: `${store.name} anahtar teslim franchise kurulum projesi`,
        images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
        city: store.city,
        district: store.district,
        location: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        progress: store.progress,
        status: store.status,
        storeTemplateId: store.templateId,
      },
      create: {
        id: store.id,
        title: store.name,
        name: store.name,
        description: `${store.name} anahtar teslim franchise kurulum projesi`,
        images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
        city: store.city,
        district: store.district,
        location: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        progress: store.progress,
        status: store.status,
        companyId: store.companyId,
        storeTemplateId: store.templateId,
        isActive: true,
      },
    })

    // Stage Gates
    for (const g of store.gates) {
      const existing = await prisma.stageGate.findFirst({
        where: { projectId: project.id, stageName: g.stageName },
      })
      if (!existing) {
        await prisma.stageGate.create({
          data: {
            projectId: project.id,
            stageName: g.stageName,
            isRequired: true,
            isApproved: g.isApproved,
            documentUrl: g.doc,
            approvedAt: g.isApproved ? new Date() : null,
          },
        })
      }
    }
  }

  console.log("✅ Mağaza projeleri ve Stage-Gate'leri oluşturuldu.")

  // 4. Punch List Örnek Kusurlar
  const sampleDefects = [
    {
      projectId: "store-alsancak",
      inspectorId: "BM-Ahmet-Yilmaz",
      subcontractorId: "Alsefa Reklam & Tabela Ltd.",
      defectDesc: "Kurumsal tabela renk tonu Pantone 286 C yerine açık mavi yapılmış. Düzeltilmesi şart.",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 36), // 36 saat sonra
      status: "OPEN",
    },
    {
      projectId: "store-alsancak",
      inspectorId: "BM-Ahmet-Yilmaz",
      subcontractorId: "Ege Elektrik Tesisat",
      defectDesc: "Kasa arkası LED ambians aydınlatmasında 3 metre hat sönük kalıyor, trafo arızalı.",
      photoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 gün sonra
      status: "OPEN",
    },
    {
      projectId: "store-cevahir",
      inspectorId: "BM-Deniz-Kaya",
      subcontractorId: "Akıncı Zemin & Parke",
      defectDesc: "Giriş vitrin önü granit seramik derz dolgularında 4 adet çatlak tespit edildi.",
      photoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 saat önce dolmuş (Gecikmiş!)
      status: "OPEN",
    },
    {
      projectId: "store-cevahir",
      inspectorId: "BM-Deniz-Kaya",
      subcontractorId: "Ofisline Mağaza Mobilyaları",
      defectDesc: "Orta teşhir gondolunun köşe koruma çıtası gevşek, montaj civatası eksik.",
      photoUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 48),
      status: "FIXED",
    },
  ]

  for (const d of sampleDefects) {
    const existing = await prisma.punchList.findFirst({
      where: { projectId: d.projectId, defectDesc: d.defectDesc },
    })
    if (!existing) {
      await prisma.punchList.create({ data: d })
    }
  }

  console.log("✅ Punch List kusurları oluşturuldu.")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
