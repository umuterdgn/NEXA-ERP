/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - Presentation Demo Data Seeder
 * Populates realistic, consistent demo data for "Vadi Evleri 3. Etap"
 * Non-destructive: Uses upsert and checks before insert.
 */

import { PrismaClient, CompanyType, ContractStatus, BillingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("🚀 NEXA ERP - KAPSAMLI SUNUM DEMO VERİLERİ (SEED) BAŞLATILIYOR...");
  console.log("================================================================================");

  // 1. Hedef Projeyi Bul veya Doğrula
  const targetProject = await prisma.project.findFirst({
    where: { name: "Vadi Evleri 3. Etap" },
  });

  if (!targetProject) {
    throw new Error("Hedef proje 'Vadi Evleri 3. Etap' bulunamadı!");
  }

  const projectId = targetProject.id;
  const tenantId = targetProject.tenantId || "cmvoqchft0000jn08lz1jjl93";
  const companyId = targetProject.companyId || "cmvzl59ws00019ga87wxna9d4";

  console.log(`📌 Hedef Proje: ${targetProject.name} (ID: ${projectId}, Tenant: ${tenantId})`);

  // Admin kullanıcı ve personelleri al
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });
  const userId = adminUser?.id || "cmtm0ocar00009g44j9joz70d";

  const personels = await prisma.personel.findMany({
    where: { tenantId },
    take: 10,
  });
  const personelId1 = personels[0]?.id;
  const personelId2 = personels[1]?.id;

  const demoPhotos = [
    "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  ];

  // ============================================================================
  // 1. FİNANS & TAŞERON: POZİTİF NAKİT AKIŞI, SÖZLEŞMELER, HAKEDİŞLER
  // ============================================================================
  console.log("\n💰 1. Finans & Taşeron Verileri Ekleniyor...");

  // Son 6 aya ait pozitif nakit akışı işlemleri
  const now = new Date();
  const txData = [
    { type: "GELIR", amount: 18500000, desc: "Hakediş No 05 Tahsilatı - Konut Bloğu A/B Kaba Yapı", cat: "HAKEDIS", monthsAgo: 5 },
    { type: "GIDER", amount: 7200000, desc: "Marmara Hazır Beton C35/37 Döküm Bedeli", cat: "BETON", monthsAgo: 5 },
    { type: "GELIR", amount: 22000000, desc: "Yatırımcı Konsorsiyum Finansman Girişi (Faz 2)", cat: "DIGER", monthsAgo: 4 },
    { type: "GIDER", amount: 6800000, desc: "Mega Demir Çelik S420 Nervürlü Donatı Alımı (500 Ton)", cat: "DEMIR", monthsAgo: 4 },
    { type: "GELIR", amount: 16400000, desc: "Hakediş No 06 Tahsilatı - Ticari Blok Zemin & Çevre İksa", cat: "HAKEDIS", monthsAgo: 3 },
    { type: "GIDER", amount: 5900000, desc: "Özkan Kalıp İskele & Endüstriyel Tünel Kalıp Kirası", cat: "TASERON", monthsAgo: 3 },
    { type: "GELIR", amount: 19800000, desc: "Hakediş No 07 Tahsilatı - 1-4. Kat Tabliye İmalatları", cat: "HAKEDIS", monthsAgo: 2 },
    { type: "GIDER", amount: 8100000, desc: "Akkaya Mekanik Sıhhi Tesisat Altyapı Hakediş Ödemesi", cat: "TASERON", monthsAgo: 2 },
    { type: "GELIR", amount: 24500000, desc: "Banka Teminatlı Proje Kredisi Dilim Çıkışı", cat: "DIGER", monthsAgo: 1 },
    { type: "GIDER", amount: 9200000, desc: "Saha Taşeron ve Mühendislik Maaş Bordroları Toplu Transfer", cat: "MAAS", monthsAgo: 1 },
    { type: "GELIR", amount: 14200000, desc: "Ön Satış Gelirleri & Daire Teslim Peşinatları", cat: "DIGER", monthsAgo: 0 },
    { type: "GIDER", amount: 4800000, desc: "SGK Primleri & İş Sağlığı Hizmet Faturaları", cat: "SGK", monthsAgo: 0 },
  ];

  for (const t of txData) {
    const txDate = new Date(now.getFullYear(), now.getMonth() - t.monthsAgo, 15);
    const existing = await prisma.transaction.findFirst({
      where: { projectId, description: t.desc },
    });
    if (!existing) {
      await prisma.transaction.create({
        data: {
          tenantId,
          projectId,
          companyId,
          type: t.type,
          amount: t.amount,
          description: t.desc,
          category: t.cat,
          date: txDate,
        },
      });
    }
  }
  console.log("  ✅ Pozitif Nakit Akışı Finans Hareketleri Hazırlandı.");

  // Taşeron Firmaları
  let subs = await prisma.subcontractor.findMany({ where: { tenantId }, take: 4 });
  if (subs.length < 3) {
    const s1 = await prisma.subcontractor.create({
      data: { tenantId, name: "Özkan Kalıp & İskele Ltd. Şti.", contactName: "Murat Özkan", phone: "0532 555 1020" },
    });
    const s2 = await prisma.subcontractor.create({
      data: { tenantId, name: "Çelikler Donatı Sanayi A.Ş.", contactName: "Hakan Çelik", phone: "0533 444 3040" },
    });
    const s3 = await prisma.subcontractor.create({
      data: { tenantId, name: "Akkaya Mekanik & Yangın Ltd.", contactName: "Bülent Akkaya", phone: "0535 333 5060" },
    });
    subs = [s1, s2, s3];
  }

  // 3 Aktif Taşeron Sözleşmesi (Contract & SubcontractorContract)
  const contractCompanies = await prisma.company.findMany({ take: 3 });
  for (let i = 0; i < 3; i++) {
    const comp = contractCompanies[i];
    if (comp) {
      const existingContract = await prisma.contract.findFirst({
        where: { projectId, subcontractorId: comp.id },
      });
      if (!existingContract) {
        await prisma.contract.create({
          data: {
            tenantId,
            projectId,
            subcontractorId: comp.id,
            title: `${comp.name} - Vadi Evleri İmalat ve Uygulama Sözleşmesi`,
            totalAmount: 18500000 + i * 4500000,
            startDate: new Date("2025-02-01"),
            endDate: new Date("2026-12-31"),
            status: ContractStatus.ACTIVE,
            dailyPenaltyRate: 25000,
            retentionRate: 0.05,
          },
        });
      }

      const existingSubContract = await prisma.subcontractorContract.findFirst({
        where: { projectId, subcontractorId: comp.id },
      });
      if (!existingSubContract) {
        await prisma.subcontractorContract.create({
          data: {
            tenantId,
            projectId,
            subcontractorId: comp.id,
            contractType: "UNIT_PRICE",
            totalValue: 18500000 + i * 4500000,
            startDate: new Date("2025-02-01"),
            endDate: new Date("2026-12-31"),
            status: "ACTIVE",
            notes: "Birim fiyatlı hakediş sözleşmesi. %5 teminat kesintisi uygulanır.",
          },
        });
      }
    }
  }
  console.log("  ✅ 3 Taşeron Sözleşmesi (Contract & SubcontractorContract) Hazırlandı.");

  // 4 Onaylı / Bekleyen Hakediş (ProgressBilling & ProgressPayment)
  const activeContracts = await prisma.contract.findMany({ where: { projectId }, take: 3 });
  const activeContract = activeContracts[0];

  const billingsData = [
    { num: 1, gross: 4200000, net: 3850000, status: BillingStatus.APPROVED, pStatus: "APPROVED", title: "A Blok 1-4. Kat Kaba Yapı Hakedişi" },
    { num: 2, gross: 5600000, net: 5120000, status: BillingStatus.APPROVED, pStatus: "APPROVED", title: "B Blok Temel & Perde Betonları Hakedişi" },
    { num: 3, gross: 3900000, net: 3560000, status: BillingStatus.APPROVED, pStatus: "APPROVED", title: "Otopark Katı İksa & Ankraj Hakedişi" },
    { num: 4, gross: 4800000, net: 4380000, status: BillingStatus.PENDING_APPROVAL, pStatus: "PENDING", title: "C Blok 1. Kat Tabliye & Donatı Hakedişi" },
  ];

  let createdBillings: any[] = [];
  for (const b of billingsData) {
    let billing = await prisma.progressBilling.findFirst({
      where: { contractId: activeContract?.id, billingNumber: b.num },
    });
    if (!billing && activeContract) {
      billing = await prisma.progressBilling.create({
        data: {
          tenantId,
          contractId: activeContract.id,
          billingNumber: b.num,
          period: new Date(2026, 8 + b.num, 1),
          grossAmount: b.gross,
          retentionDeduction: b.gross * 0.05,
          penaltyDeduction: b.num === 4 ? 20000 : 0,
          netPayable: b.net,
          status: b.status,
        },
      });
    }
    if (billing) createdBillings.push(billing);

    const existingPayment = await prisma.progressPayment.findFirst({
      where: { projectId, title: b.title },
    });
    if (!existingPayment) {
      await prisma.progressPayment.create({
        data: {
          tenantId,
          projectId,
          contractId: activeContract?.id,
          title: b.title,
          period: `2026-0${8 + b.num}`,
          totalAmount: b.gross,
          quantity: 1200 + b.num * 300,
          unit: "m2",
          unitPrice: 3500,
          netAmount: b.net,
          netPayableAmount: b.net,
          status: b.pStatus,
        },
      });
    }
  }
  console.log("  ✅ 4 Adet Hakediş Kaydı (ProgressBilling & ProgressPayment) Eklendi.");

  // 4 Fotoğraflı İş Kanıtı (WorkProof)
  const targetSub = subs[0];
  if (targetSub) {
    const proofs = [
      { title: "A Blok 3. Kat Kolon Kalıp Donatı Montajı Tamamlandı", qty: 450, img: demoPhotos[0] },
      { title: "B Blok Zemin Tabliye C35 Beton Dökümü ve Mastarlama", qty: 620, img: demoPhotos[1] },
      { title: "İksa Duvarı Jet Grout Kolonları İmalat Tamamlanma Tutanağı", qty: 280, img: demoPhotos[2] },
      { title: "Kule Vinç-1 Temel Ankraj Civataları Tork Kontrolü", qty: 12, img: demoPhotos[3] },
    ];
    for (const p of proofs) {
      const existingProof = await prisma.workProof.findFirst({
        where: { subcontractorId: targetSub.id, title: p.title },
      });
      if (!existingProof) {
        await prisma.workProof.create({
          data: {
            tenantId,
            projectId,
            subcontractorId: targetSub.id,
            contractId: activeContract?.id,
            progressBillingId: createdBillings[0]?.id,
            title: p.title,
            claimedQuantity: p.qty,
            approvedQuantity: p.qty,
            photoUrl: p.img,
            imageUrl: p.img,
            status: "APPROVED",
            engineerStatus: "APPROVED",
            managerStatus: "APPROVED",
            description: "Saha şefi ve denetçi tarafından yerinde incelenmiş ve hakedişe bağlanmıştır.",
          },
        });
      }
    }
  }
  console.log("  ✅ 4 Fotoğraflı İş Kanıtı (WorkProof) Eklendi.");

  // 3 Kesinti / Ceza Kaydı (Deduction)
  if (targetSub) {
    const deductions = [
      { amount: 35000, reason: "A Blok 2. Kat İskele Emniyet Ağı Eksikliği Nedeniyle İSG İdari Para Cezası" },
      { amount: 48000, reason: "Kalıp Söküm Süresi Gecikmesi 2 Günlük Sözleşme Cezası" },
      { amount: 18500, reason: "Saha İçi Malzeme Atıklarının Temizlenmemesi Çevre Temizlik Kesintisi" },
    ];
    for (const d of deductions) {
      const existingDed = await prisma.deduction.findFirst({
        where: { subcontractorId: targetSub.id, reason: d.reason },
      });
      if (!existingDed) {
        await prisma.deduction.create({
          data: {
            tenantId,
            projectId,
            subcontractorId: targetSub.id,
            amount: d.amount,
            reason: d.reason,
            date: new Date(),
          },
        });
      }
    }
  }
  console.log("  ✅ 3 Kesinti/Ceza Kaydı (Deduction) Eklendi.");

  // 4 Çek/Senet/Teminat Mektubu (FinancialDocument)
  const finDocs = [
    { type: "GUARANTEE_LETTER", docNo: "TM-2026-90412", amount: 12500000, status: "PORTFOLIO", dueMonths: 14 },
    { type: "CHECK", docNo: "CHK-0048129", amount: 4200000, status: "PORTFOLIO", dueMonths: 2 },
    { type: "CHECK", docNo: "CHK-0048130", amount: 3800000, status: "PORTFOLIO", dueMonths: 3 },
    { type: "PROMISSORY_NOTE", docNo: "SNT-2026-104", amount: 2650000, status: "PORTFOLIO", dueMonths: 1 },
  ];
  for (const fd of finDocs) {
    const dueDate = new Date(now.getFullYear(), now.getMonth() + fd.dueMonths, 25);
    const existingFd = await prisma.financialDocument.findUnique({
      where: { documentNo: fd.docNo },
    });
    if (!existingFd) {
      await prisma.financialDocument.create({
        data: {
          tenantId,
          companyId,
          documentType: fd.type,
          documentNo: fd.docNo,
          amount: fd.amount,
          currency: "TRY",
          issueDate: new Date(),
          dueDate,
          status: fd.status,
        },
      });
    }
  }
  console.log("  ✅ 4 Çek/Senet/Teminat Mektubu (FinancialDocument) Eklendi.");

  // 2 Tahsilat Risk Uyarısı / AI Raporu (DailyAiReport)
  const aiReports = [
    {
      summary: "Yapay zeka nakit akışı analizi: Önümüzdeki 45 gün içerisinde A Blok cephe taşeronunun hakediş tahsilatlarında gecikme riski öngörülmektedir. Toplam teminat mektubu tutarı 12.5M TL olup risk tamponu yeterlidir.",
      tags: ["TAHSİLAT RİSKİ", "BÜTÇE OPTİMİZASYONU", "TEMİNAT YETERLİ"],
    },
    {
      summary: "Beton ve demir fiyat endekslerindeki %4.2 artış simülasyonu: 4. Çeyrek kaba yapı maliyetlerinde +1.8M TL sapma riski tespit edildi. Tedarikçi sabit fiyat anlaşmalarının yenilenmesi önerilmektedir.",
      tags: ["FİYAT ARTIŞI", "ENFLASYON RİSKİ", "MALZEME TEDARİK"],
    },
  ];
  for (const ar of aiReports) {
    const existingAr = await prisma.dailyAiReport.findFirst({
      where: { projectId, summaryText: ar.summary },
    });
    if (!existingAr) {
      await prisma.dailyAiReport.create({
        data: {
          tenantId,
          projectId,
          summaryText: ar.summary,
          riskTags: ar.tags,
          date: new Date(),
        },
      });
    }
  }
  console.log("  ✅ 2 AI Nakit ve Bütçe Risk Raporu (DailyAiReport) Eklendi.");

  // ============================================================================
  // 2. YAPI DENETİM & QA/QC
  // ============================================================================
  console.log("\n📐 2. Yapı Denetim & QA/QC Kayıtları Ekleniyor...");

  // 5 Yapı Denetim Tutanağı (Inspection)
  if (personelId1) {
    const inspections = [
      { type: "DONATI", floor: "3. Kat", notes: "A Blok 3. Kat tabliye ve kiriş donatıları statik projeye uygun bağlandı, paspayları yerleştirildi." },
      { type: "BETON", floor: "3. Kat", notes: "C35 hazır beton transmikser slump ve sıcaklık kontrolü yapıldı. Slump 18 cm, döküme onay verildi." },
      { type: "KALIP", floor: "4. Kat", notes: "B Blok 4. kat kolon ve perde kalıpları şakül ve aks kontrolünden geçti. Kalıp kilitleri sağlam." },
      { type: "DOSEME", floor: "Zemin", notes: "Ticari blok zemin kat hasır çelik ve membran su yalıtımı kontrolü tamamlandı." },
      { type: "KOLON", floor: "1. Kat", notes: "A Blok 1. kat köşe kolonlarında düşey donatı bindirme boyları ve etriye sıklaştırmaları kontrol edildi." },
    ];
    for (const ins of inspections) {
      const existingIns = await prisma.inspection.findFirst({
        where: { projectId, type: ins.type, floor: ins.floor },
      });
      if (!existingIns) {
        await prisma.inspection.create({
          data: {
            tenantId,
            projectId,
            inspectorId: personelId1,
            type: ins.type,
            floor: ins.floor,
            status: "APPROVED",
            notes: ins.notes,
            inspectionDate: new Date(),
          },
        });
      }
    }
  }
  console.log("  ✅ 5 Yapı Denetim Tutanağı (Inspection) Eklendi.");

  // 6 Beton/Karot Numunesi (ConcreteTest)
  const concreteData = [
    { elem: "A Blok 3. Kat Tabliye & Kirişler", d7: 29.8, d28: 41.5, waybill: "IRS-2026-8812", status: "GECTI" },
    { elem: "A Blok 2. Kat Kolon & Perdeler", d7: 31.2, d28: 43.1, waybill: "IRS-2026-8740", status: "GECTI" },
    { elem: "B Blok Radye Temel 1. Kısım", d7: 28.5, d28: 39.8, waybill: "IRS-2026-8610", status: "GECTI" },
    { elem: "B Blok Radye Temel 2. Kısım", d7: 29.1, d28: 40.4, waybill: "IRS-2026-8615", status: "GECTI" },
    { elem: "C Blok Zemin Kat Perdeler", d7: 30.4, d28: 42.0, waybill: "IRS-2026-8902", status: "GECTI" },
    { elem: "Otopark Katı İstinat Duvarı", d7: 27.6, d28: 38.2, waybill: "IRS-2026-8955", status: "GECTI" },
  ];
  for (const c of concreteData) {
    const existingC = await prisma.concreteTest.findFirst({
      where: { projectId, waybillNo: c.waybill },
    });
    if (!existingC) {
      await prisma.concreteTest.create({
        data: {
          tenantId,
          projectId,
          castDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          concreteClass: "C35/45",
          element: c.elem,
          waybillNo: c.waybill,
          day7Result: c.d7,
          day28Result: c.d28,
          status: c.status,
          reportUrl: "https://assets.nxerp.com.tr/lab/concrete-test-report.pdf",
        },
      });
    }
  }
  console.log("  ✅ 6 Beton Kırım Testi (ConcreteTest 7 & 28 Günlük) Eklendi.");

  // 4 Demir-Kalıp Kontrol Vizesi (ReinforcementVisa & RebarFormworkCheck)
  const visas = [
    { no: "VIZE-2026-041", elem: "A Blok 3. Kat Tabliye & Kiriş", rebar: "Ø14, Ø16 (B420C)", cover: 3.5 },
    { no: "VIZE-2026-042", elem: "B Blok 2. Kat Kolonlar", rebar: "Ø18, Ø20 (B420C)", cover: 4.0 },
    { no: "VIZE-2026-043", elem: "C Blok 1. Kat Perde Duvarlar", rebar: "Ø12, Ø14 (B420C)", cover: 3.0 },
    { no: "VIZE-2026-044", elem: "Otopark Katı Kiriş Donatıları", rebar: "Ø16, Ø20 (B420C)", cover: 3.5 },
  ];
  for (const v of visas) {
    const existingV = await prisma.reinforcementVisa.findUnique({
      where: { visaNo: v.no },
    });
    if (!existingV) {
      await prisma.reinforcementVisa.create({
        data: {
          tenantId,
          projectId,
          inspectorId: userId,
          visaNo: v.no,
          elementName: v.elem,
          reinforcementDetails: v.rebar,
          coverSpace: v.cover,
          formworkStatus: "Şakülünde ve Rijit",
          status: "APPROVED",
        },
      });
    }

    if (personelId1) {
      const existingRf = await prisma.rebarFormworkCheck.findFirst({
        where: { projectId, location: v.elem },
      });
      if (!existingRf) {
        await prisma.rebarFormworkCheck.create({
          data: {
            tenantId,
            projectId,
            inspectorId: personelId1,
            title: `${v.elem} Vize Kontrolü`,
            type: "BOTH",
            location: v.elem,
            status: "APPROVED",
            checkDate: new Date(),
            notes: "Donatı aralıkları ve kalıp gönyesi tam uyumlu.",
          },
        });
      }
    }
  }
  console.log("  ✅ 4 Demir-Kalıp Vizesi (ReinforcementVisa & RebarFormworkCheck) Eklendi.");

  // 5 Saha Eksikliği (Deficiency / Snagging)
  const snags = [
    { floor: "2. Kat", elem: "Kolon C14", cat: "Donatı", prio: "MEDIUM", desc: "Kolon alt paspayı takozları 2 noktada eksik, beton dökümü öncesi tamamlanmalı.", img: demoPhotos[0] },
    { floor: "3. Kat", elem: "B Blok Koridor", cat: "Kalıp", prio: "LOW", desc: "Kalıp birleşim yerinde 3mm fuga açıklığı mevcut, köpük mastik çekilmeli.", img: demoPhotos[1] },
    { floor: "1. Kat", elem: "A Blok Merdiven", cat: "Beton", prio: "MEDIUM", desc: "Merdiven sahanlığında hafif segregasyon alanı gözlendi, tamir harcıyla onarılmalı.", img: demoPhotos[2] },
    { floor: "Bodrum", elem: "İstinat Perdesi", cat: "Yalıtım", prio: "CRITICAL", desc: "Su yalıtım membranında 10cm yırtık tespit edildi, yama uygulanmalı.", img: demoPhotos[3] },
    { floor: "4. Kat", elem: "Dış İskele", cat: "İSG", prio: "CRITICAL", desc: "Dış cephe güvenlik filesi yıpranmış, derhal yenisiyle değiştirilmeli.", img: demoPhotos[4] },
  ];
  for (const s of snags) {
    const existingS = await prisma.deficiency.findFirst({
      where: { projectId, description: s.desc },
    });
    if (!existingS) {
      await prisma.deficiency.create({
        data: {
          tenantId,
          projectId,
          floor: s.floor,
          element: s.elem,
          category: s.cat,
          priority: s.prio,
          description: s.desc,
          photoUrl: s.img,
          status: "OPEN",
          severity: s.prio,
        },
      });
    }
  }
  console.log("  ✅ 5 Saha Eksikliği (Deficiency / Snagging) Eklendi.");

  // 4 Malzeme Onayı (MaterialApproval)
  const matApprovals = [
    { name: "C35/45 Sülfata Dayanıklı Çimento", sup: "Marmara Hazır Beton A.Ş.", batch: "PRD-2026-904", res: "APPROVED" },
    { name: "S420 Nervürlü Donatı Çeliği (Ø16-Ø25)", sup: "Mega Demir Çelik Sanayi", batch: "MGD-2026-312", res: "APPROVED" },
    { name: "21mm Huş Plywood Kalıp Paneli", sup: "Toros Orman Ürünleri Ltd.", batch: "PLY-2026-104", res: "APPROVED" },
    { name: "SBS Modifiyeli Bitümlü Su Yalıtım Membranı (4mm)", sup: "İzotek Yalıtım Teknolojileri", batch: "IZO-2026-788", res: "APPROVED" },
  ];
  for (const ma of matApprovals) {
    const existingMa = await prisma.materialApproval.findFirst({
      where: { projectId, batchNo: ma.batch },
    });
    if (!existingMa) {
      await prisma.materialApproval.create({
        data: {
          tenantId,
          projectId,
          materialName: ma.name,
          supplier: ma.sup,
          batchNo: ma.batch,
          testResult: ma.res,
          testDate: new Date(),
          notes: "TSE ve CE uygunluk belgeleri onaylandı.",
        },
      });
    }
  }
  console.log("  ✅ 4 Malzeme Onayı (MaterialApproval) Eklendi.");

  // 3 NCR / DÖF Raporu (NonConformance & NonconformityDOF)
  const ncrs = [
    { no: "NCR-2026-001", title: "A Blok 2. Kat Kolon Paspayı Yetersizliği", desc: "A Blok 2. kat kolonlarında projede 4cm öngörülen paspayının yerinde 2.5cm kaldığı ölçülmüştür. Kalıp açılarak takozlar yenilenmiştir.", sev: "HIGH", status: "RESOLVED" },
    { no: "NCR-2026-002", title: "C35 Beton Slump Değeri Uygunsuzluğu", desc: "34 VK 412 plakalı transmikserde slump değeri 22cm ölçülerek kabul sınırını aşmıştır. Mikser sahaya sokulmadan şantiyeden iade edilmiştir.", sev: "CRITICAL", status: "RESOLVED" },
    { no: "NCR-2026-003", title: "İskele Topraklama Ölçüm Raporu Eksikliği", desc: "Şantiye ana dağıtım panosu ve kule vinç topraklama meger testi süresi dolmuş olup yenilenmesi talep edilmiştir.", sev: "MEDIUM", status: "OPEN" },
  ];
  for (const n of ncrs) {
    const existingNc = await prisma.nonConformance.findUnique({
      where: { reportNo: n.no },
    });
    if (!existingNc) {
      await prisma.nonConformance.create({
        data: {
          tenantId,
          projectId,
          reportNo: n.no,
          creatorId: userId,
          description: n.desc,
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: n.status,
          severity: n.sev,
          photos: [demoPhotos[0]],
        },
      });
    }

    const existingDof = await prisma.nonconformityDOF.findFirst({
      where: { projectId, title: n.title },
    });
    if (!existingDof && personelId1) {
      await prisma.nonconformityDOF.create({
        data: {
          tenantId,
          projectId,
          reportedById: personelId1,
          title: n.title,
          type: "QUALITY",
          severity: n.sev,
          status: n.status === "RESOLVED" ? "CLOSED" : "OPEN",
          description: n.desc,
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log("  ✅ 3 NCR/DÖF Kaydı (NonConformance & NonconformityDOF) Eklendi.");

  // 3 Dinamik Denetim Form Şablonu (DynamicForm)
  const forms = [
    {
      title: "Kalıp & Donatı Beton Döküm Öncesi Vize Kontrol Formu",
      cat: "Kalıp & Donatı",
      desc: "Beton dökümü öncesinde şantiye şefi ve yapı denetçi tarafından doldurulan zorunlu vize kontrol listesi.",
      fields: [
        { id: "q1", label: "Aks ve kot ölçümleri onaylı projeye uygun mu?", type: "boolean", required: true },
        { id: "q2", label: "Demir çapı, adedi ve etriye sıklaştırmaları uygun mu?", type: "boolean", required: true },
        { id: "q3", label: "Paspayı takozları yerleştirildi mi (en az 3cm)?", type: "boolean", required: true },
        { id: "q4", label: "Kalıp içi temizliği ve basınçlı hava uygulaması yapıldı mı?", type: "boolean", required: true },
      ],
    },
    {
      title: "Haftalık İSG Saha Güvenlik ve Risk Denetim Formu",
      cat: "İSG",
      desc: "Saha İSG uzmanı tarafından haftalık periyotlarla doldurulan 24 maddelik saha uygunluk tutanağı.",
      fields: [
        { id: "q1", label: "Tüm personelde CE onaylı baret ve yelek kullanımı tam mı?", type: "boolean", required: true },
        { id: "q2", label: "Yüksekte çalışan tüm personelde çift kollu lanyart ve paraşüt kemer bağlı mı?", type: "boolean", required: true },
        { id: "q3", label: "Asansör şaft boşluklarında çift sıra metal korkuluk mevcut mu?", type: "boolean", required: true },
      ],
    },
    {
      title: "Elektrik Dağıtım Panosu & Mekanik Altyapı Uygunluk Formu",
      cat: "Mekanik & Elektrik",
      desc: "Kaçak akım röleleri ve yangın dolapları periyodik muayene formu.",
      fields: [
        { id: "q1", label: "30mA kaçak akım rölesi test butonu tetikleme veriyor mu?", type: "boolean", required: true },
        { id: "q2", label: "Topraklama levhası geçiş direnci < 2 Ohm mu?", type: "boolean", required: true },
      ],
    },
  ];
  for (const f of forms) {
    const existingF = await prisma.dynamicForm.findFirst({
      where: { title: f.title },
    });
    if (!existingF) {
      await prisma.dynamicForm.create({
        data: {
          tenantId,
          title: f.title,
          category: f.cat,
          description: f.desc,
          fields: f.fields,
        },
      });
    }
  }
  console.log("  ✅ 3 Dinamik Denetim Formu (DynamicForm) Eklendi.");

  // ============================================================================
  // 3. İSG & HARİTA
  // ============================================================================
  console.log("\n🗺️ 3. İSG & Harita / GPS Bilgileri Güncelleniyor...");

  // Proje koordinatlarını Başakşehir / İstanbul olarak güncelle
  await prisma.project.update({
    where: { id: projectId },
    data: {
      latitude: 41.0833,
      longitude: 28.8050,
      gpsRequired: true,
      gpsRadius: 250,
      geofenceRadius: 250,
      location: "Başakşehir / İstanbul (Kuzey Marmara Otoyolu Bağlantısı)",
      city: "İstanbul",
      district: "Başakşehir",
    },
  });
  console.log("  ✅ Vadi Evleri Proje GPS Koordinatları (41.0833, 28.8050) Güncellendi.");

  // Geofence Poligonları
  const geofenceCoords = [
    { lat: 41.0820, lng: 28.8020 },
    { lat: 41.0850, lng: 28.8025 },
    { lat: 41.0845, lng: 28.8080 },
    { lat: 41.0815, lng: 28.8075 },
  ];
  const existingGeo = await prisma.geofenceZone.findFirst({
    where: { projectId, name: "Vadi Evleri 3. Etap Şantiye Çevre Sınırı" },
  });
  if (!existingGeo) {
    await prisma.geofenceZone.create({
      data: {
        tenantId,
        projectId,
        name: "Vadi Evleri 3. Etap Şantiye Çevre Sınırı",
        type: "MAIN_SITE",
        coordinates: geofenceCoords,
        isActive: true,
      },
    });
  }

  const existingDangerGeo = await prisma.geofenceZone.findFirst({
    where: { projectId, name: "Kule Vinç-1 Altı Yüksek Risk Bölgesi" },
  });
  if (!existingDangerGeo) {
    await prisma.geofenceZone.create({
      data: {
        tenantId,
        projectId,
        name: "Kule Vinç-1 Altı Yüksek Risk Bölgesi",
        type: "DANGER_ZONE",
        coordinates: [
          { lat: 41.0830, lng: 28.8040 },
          { lat: 41.0840, lng: 28.8040 },
          { lat: 41.0840, lng: 28.8055 },
          { lat: 41.0830, lng: 28.8055 },
        ],
        isActive: true,
      },
    });
  }
  console.log("  ✅ Geofence Poligonları (MAIN_SITE & DANGER_ZONE) Eklendi.");

  // 5 Aktif BLE Cihazı ve Konum Pini
  const bleList = [
    { mac: "C4:4E:AC:10:91:01", type: "BARET", name: "Akıllı Baret Beacon #101", lat: 41.0832, lng: 28.8048 },
    { mac: "C4:4E:AC:10:91:02", type: "YELEK", name: "Akıllı İSG Yeleği Beacon #102", lat: 41.0835, lng: 28.8052 },
    { mac: "C4:4E:AC:10:91:03", type: "BARET", name: "Akıllı Baret Beacon #103", lat: 41.0828, lng: 28.8042 },
    { mac: "C4:4E:AC:10:91:04", type: "YAKA_KARTI", name: "Personel Yaka Kartı #104", lat: 41.0838, lng: 28.8058 },
    { mac: "C4:4E:AC:10:91:05", type: "BARET", name: "Akıllı Baret Beacon #105", lat: 41.0825, lng: 28.8062 },
  ];
  for (const b of bleList) {
    const existingBle = await prisma.bleDevice.findUnique({
      where: { macAddress: b.mac },
    });
    if (!existingBle) {
      await prisma.bleDevice.create({
        data: {
          tenantId,
          projectId,
          macAddress: b.mac,
          deviceType: b.type,
          batteryLevel: 92,
          lastSeenAt: new Date(),
        },
      });
    }

    // Harita pini için LocationLog ekle
    await prisma.locationLog.create({
      data: {
        tenantId,
        userId,
        latitude: b.lat,
        longitude: b.lng,
        accuracy: 2.5,
        timestamp: new Date(),
      },
    });
  }
  console.log("  ✅ 5 Aktif BLE Cihazı ve Harita Konum Logları (LocationLog) Eklendi.");

  // /admin/isg kartlarındaki kırık görsel URL'lerini çalışan yerel/unsplash URL'lerle değiştir
  const brokenIsgCount = await prisma.isgReport.count({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: "" },
      ],
    },
  });
  if (brokenIsgCount > 0) {
    const isgList = await prisma.isgReport.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: "" },
        ],
      },
    });
    for (let i = 0; i < isgList.length; i++) {
      const img = demoPhotos[i % demoPhotos.length];
      await prisma.isgReport.update({
        where: { id: isgList[i].id },
        data: { imageUrl: img },
      });
    }
    console.log(`  ✅ ${brokenIsgCount} Adet İSG Raporundaki Boş/Kırık Görsel Çalışan Demo Görselleriyle Değiştirildi.`);
  }

  // Ramak Kala Raporları (NearMiss)
  if (personelId1) {
    const nearMisses = [
      {
        title: "Kule Vinç Halatı Asansör Boşluğuna Sürtündü",
        desc: "Kule vinç palet indirirken rüzgar etkisiyle yük halatı 2. kat şaft korkuluğuna temas etti. Herhangi bir can kaybı ya da kopma olmadı. Yükleme açısı değiştirildi.",
        sev: "HIGH",
        status: "INVESTIGATING",
        loc: "A Blok Asansör Şaftı",
      },
      {
        title: "İskele Üzerinden Ahşap Takoz Düşmesi",
        desc: "3. kat dış iskele platformundan 5x10 ahşap takoz güvenlik tentesine düştü. Alt kısımda personel bulunmuyordu. İskele eteklik tahtaları kontrol edildi.",
        sev: "MEDIUM",
        status: "CLOSED",
        loc: "B Blok Dış Cephe",
      },
    ];
    for (const nm of nearMisses) {
      const existingNm = await prisma.nearMiss.findFirst({
        where: { projectId, title: nm.title },
      });
      if (!existingNm) {
        await prisma.nearMiss.create({
          data: {
            tenantId,
            projectId,
            reportedById: personelId1,
            title: nm.title,
            description: nm.desc,
            severity: nm.sev,
            status: nm.status,
            location: nm.loc,
            incidentDate: new Date(),
            imageUrl: demoPhotos[0],
          },
        });
      }
    }
  }
  console.log("  ✅ Ramak Kala (NearMiss) Raporları Eklendi.");

  // KKD Zimmet Kayıtları (PPEAssignment)
  if (personelId1 && personelId2) {
    const ppeList = [
      { pId: personelId1, name: "Endüstriyel Güvenlik Bareti (EN 397)", type: "HELMET", serial: "KKD-BRT-8812" },
      { pId: personelId1, name: "Yüksek Görünürlüklü Reflektif Yelek (EN ISO 20471)", type: "VEST", serial: "KKD-YLK-4401" },
      { pId: personelId2, name: "Çelik Burunlu S3 Koruyucu İş Ayakkabısı", type: "BOOTS", serial: "KKD-AYK-2019" },
      { pId: personelId2, name: "Paraşüt Tipi Düşüş Durdurucu Emniyet Kemeri (EN 361)", type: "OTHER", serial: "KKD-KMR-1092" },
    ];
    for (const ppe of ppeList) {
      const existingPpe = await prisma.pPEAssignment.findFirst({
        where: { serialNo: ppe.serial },
      });
      if (!existingPpe) {
        await prisma.pPEAssignment.create({
          data: {
            tenantId,
            projectId,
            personelId: ppe.pId,
            itemName: ppe.name,
            type: ppe.type,
            serialNo: ppe.serial,
            status: "ASSIGNED",
            assignmentDate: new Date(),
          },
        });
      }
    }
  }
  console.log("  ✅ KKD Dijital Zimmet Kayıtları (PPEAssignment) Eklendi.");

  // ============================================================================
  // 4. LOJİSTİK, İK & GÜVENLİK
  // ============================================================================
  console.log("\n🚚 4. Lojistik, İK & Güvenlik Kayıtları Ekleniyor...");

  // 4 Araç Randevusu (LogisticsAppointment)
  const appointments = [
    { plate: "34 ERK 582", driver: "Hüseyin Kurt", phone: "0532 999 1122", sup: "Marmara Hazır Beton A.Ş.", title: "C35 Hazır Beton Mikser Teslimatı", status: "İÇERİDE" },
    { plate: "34 BKR 104", driver: "Mustafa Demir", phone: "0533 888 2233", sup: "Mega Demir Çelik San. A.Ş.", title: "25 Ton Nervürlü Donatı Çeliği Tır Sevkiyatı", status: "KAPIDA" },
    { plate: "06 NZM 881", driver: "Selim Çetin", phone: "0535 777 3344", sup: "Özkan Kalıp İskele Sistemleri", title: "Endüstriyel Plywood Kalıp Panelleri", status: "BEKLİYOR" },
    { plate: "34 KLP 912", driver: "Ramazan Polat", phone: "0536 666 4455", sup: "Toros Yapı Kimyasalları", title: "Su Yalıtım Membranı & Astar Malzemeleri", status: "BEKLİYOR" },
  ];
  for (const app of appointments) {
    const existingApp = await prisma.logisticsAppointment.findFirst({
      where: { projectId, plateNumber: app.plate },
    });
    if (!existingApp) {
      await prisma.logisticsAppointment.create({
        data: {
          tenantId,
          projectId,
          plateNumber: app.plate,
          driverName: app.driver,
          driverPhone: app.phone,
          supplier: app.sup,
          title: app.title,
          type: "DELIVERY",
          status: app.status,
          appointmentDate: new Date(),
        },
      });
    }
  }
  console.log("  ✅ 4 Araç Lojistik Randevusu (LogisticsAppointment) Eklendi.");

  // 6 Ambar Stok Kalemi (Inventory & InventoryItem)
  const stockItems = [
    { name: "C35/45 Hazır Beton", code: "STK-BTN-C35", qty: 450, unit: "m3", cat: "Kaba Yapı" },
    { name: "Ø16 Nervürlü İnşaat Demiri (S420)", code: "STK-DMR-016", qty: 125, unit: "Ton", cat: "Donatı" },
    { name: "21mm Huş Plywood Kalıp Plakası", code: "STK-KLP-PLY", qty: 840, unit: "Adet", cat: "Kalıp" },
    { name: "150 kg/m3 Taşyünü Yalıtım Levhası", code: "STK-YLT-TSY", qty: 1600, unit: "m2", cat: "İzolasyon" },
    { name: "Endüstriyel Beyaz Baret (EN 397)", code: "STK-ISG-BRT", qty: 180, unit: "Adet", cat: "İSG Ekipmanı" },
    { name: "Paraşüt Tipi Emniyet Kemeri", code: "STK-ISG-KMR", qty: 45, unit: "Adet", cat: "İSG Ekipmanı" },
  ];
  for (const st of stockItems) {
    const existingInv = await prisma.inventory.findFirst({
      where: { projectId, name: st.name },
    });
    if (!existingInv) {
      await prisma.inventory.create({
        data: {
          tenantId,
          projectId,
          name: st.name,
          type: "IN",
          quantity: st.qty,
          unit: st.unit,
          category: st.cat,
          location: "Merkez Şantiye Ambarı",
          recordedBy: userId,
        },
      });
    }

    const existingInvItem = await prisma.inventoryItem.findFirst({
      where: { projectId, barcode: st.code },
    });
    if (!existingInvItem) {
      await prisma.inventoryItem.create({
        data: {
          tenantId,
          projectId,
          materialName: st.name,
          name: st.name,
          barcode: st.code,
          qrCode: `QR-${st.code}`,
          quantity: st.qty,
          unit: st.unit,
          category: st.cat,
          status: "IN_STOCK",
        },
      });
    }
  }
  console.log("  ✅ 6 Ambar Stok Kalemi (Inventory & InventoryItem) Eklendi.");

  // 5 İş Makinesi / Demirbaş (Equipment)
  const machinery = [
    { name: "Kule Vinç 1 (Potain MDT 178)", type: "IS_MAKINESI", serial: "MCH-POT-178-01", cat: "Kule Vinç" },
    { name: "Mobil Beton Pompası (Putzmeister 42m)", type: "IS_MAKINESI", serial: "MCH-PUTZ-42M-02", cat: "Beton Ekipmanı" },
    { name: "Paletli Ekskavatör (CAT 320 GC)", type: "IS_MAKINESI", serial: "MCH-CAT-320-03", cat: "Hafriyat" },
    { name: "Bekolu Yükleyici (JCB 4CX)", type: "IS_MAKINESI", serial: "MCH-JCB-4CX-04", cat: "Yükleyici" },
    { name: "Kule Vinç 2 (Liebherr 132 EC-H)", type: "IS_MAKINESI", serial: "MCH-LIEB-132-05", cat: "Kule Vinç" },
  ];
  for (const m of machinery) {
    const existingMach = await prisma.equipment.findFirst({
      where: { projectId, serialNumber: m.serial },
    });
    if (!existingMach) {
      await prisma.equipment.create({
        data: {
          tenantId,
          projectId,
          name: m.name,
          type: m.type,
          serialNumber: m.serial,
          category: m.cat,
          status: "ASSIGNED",
          lastSeenAt: new Date(),
        },
      });
    }
  }
  console.log("  ✅ 5 İş Makinesi ve Demirbaş (Equipment) Eklendi.");

  // Bugüne Ait Personel Yoklamaları (AttendanceRecord)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of personels) {
    const existingAtt = await prisma.attendanceRecord.findFirst({
      where: { projectId, personelId: p.id, date: today },
    });
    if (!existingAtt) {
      const checkInTime = new Date();
      checkInTime.setHours(7, 45 + Math.floor(Math.random() * 15), 0, 0);
      await prisma.attendanceRecord.create({
        data: {
          tenantId,
          projectId,
          personelId: p.id,
          date: today,
          checkIn: checkInTime,
          status: "PRESENT",
          dayMultiplier: 1.0,
          overtimeHours: 1.5,
          latitude: 41.0833,
          longitude: 28.8050,
        },
      });
    }
  }
  console.log(`  ✅ ${personels.length} Personel İçin Bugünkü Yoklama Kayıtları (AttendanceRecord) Eklendi.`);

  // 3 Vardiya Tanımı (Shift)
  const shifts = [
    { name: "Gündüz Ana Vardiyası (Kalıp, Donatı & Beton)", time: "08:00 - 17:00", count: 48 },
    { name: "İkinci Vardiya (Demir Bağlama & İskele Montaj)", time: "17:00 - 01:00", count: 24 },
    { name: "Gece Nöbetçi Vardiyası (Saha Güvenlik & Lojistik Kabul)", time: "01:00 - 08:00", count: 8 },
  ];
  for (const s of shifts) {
    const existingShift = await prisma.shift.findFirst({
      where: { projectId, name: s.name },
    });
    if (!existingShift) {
      await prisma.shift.create({
        data: {
          tenantId,
          projectId,
          name: s.name,
          timeRange: s.time,
          personnelCount: s.count,
          status: "Active",
        },
      });
    }
  }
  console.log("  ✅ 3 Vardiya Tanımı (Shift) Eklendi.");

  // 4 Bekleyen Onay Talebi (LeaveRequest & AdvanceRequest)
  if (personelId1 && personelId2) {
    const leaves = [
      { pId: personelId1, days: 3, reason: "Mazeret İzni - Ailevi Nedenler", type: "MAZERET" },
      { pId: personelId2, days: 5, reason: "Yıllık Ücretli İzin Talebi", type: "YILLIK" },
    ];
    for (const l of leaves) {
      const existingLeave = await prisma.leaveRequest.findFirst({
        where: { personelId: l.pId, reason: l.reason },
      });
      if (!existingLeave) {
        await prisma.leaveRequest.create({
          data: {
            tenantId,
            personelId: l.pId,
            userId,
            startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + (2 + l.days) * 24 * 60 * 60 * 1000),
            days: l.days,
            totalDays: l.days,
            reason: l.reason,
            leaveType: l.type,
            status: "PENDING",
          },
        });
      }
    }
  }

  const advances = [
    { amount: 15000, reason: "Şantiye Saha Masrafları ve Malzeme Alımı Avansı" },
    { amount: 22500, reason: "Taşeron Usta Ekibi Konaklama & Yol Avansı" },
  ];
  for (const adv of advances) {
    const existingAdv = await prisma.advanceRequest.findFirst({
      where: { userId, reason: adv.reason },
    });
    if (!existingAdv) {
      await prisma.advanceRequest.create({
        data: {
          tenantId,
          userId,
          amount: adv.amount,
          deductMonth: "2026-12",
          reason: adv.reason,
          status: "PENDING",
        },
      });
    }
  }
  console.log("  ✅ 4 Bekleyen Onay Talebi (LeaveRequest & AdvanceRequest) Eklendi.");

  // 8 Adet AuditLog Kaydı (AuditLog)
  const auditLogs = [
    { action: "BIM_MODEL_SYNC", entity: "BimFile", summary: "Vadi Evleri Rev3.glb 3D federated BIM modeli başarıyla sisteme yüklendi ve BoQ kalemleriyle eşleştirildi." },
    { action: "INSPECTION_APPROVED", entity: "Inspection", summary: "A Blok 3. Kat tabliye ve donatı vizesi Başdenetçi tarafından onaylandı." },
    { action: "PAYMENT_APPROVED", entity: "ProgressPayment", summary: "Hakediş No 05 (3,850,000 TL) Genel Müdür onayından geçerek banka talimatına aktarıldı." },
    { action: "DEFECT_RESOLVED", entity: "Deficiency", summary: "B Blok 2. Kat kolon donatı aralığı kusuru saha taşeronu tarafından giderildi ve kapatıldı." },
    { action: "GEOFENCE_VIOLATION", entity: "BleDevice", summary: "Kule Vinç-1 emniyet sahasına yetkisiz baret girişi tespit edildi ve saha şefine anlık SMS uyarısı iletildi." },
    { action: "MATERIAL_DELIVERY", entity: "LogisticsAppointment", summary: "34 ERK 582 plakalı mikser ile 45 m3 C35 hazır beton sahaya kabul edildi ve kırım numuneleri alındı." },
    { action: "CONTRACT_ACTIVATED", entity: "Contract", summary: "Çelikler Donatı San. A.Ş. ile imzalanan 23.000.000 TL bedelli taşeron sözleşmesi yürürlüğe girdi." },
    { action: "AI_RISK_GENERATED", entity: "DailyAiReport", summary: "Yapay zeka motoru tarafından 4. çeyrek nakit akışı ve enflasyon risk simülasyon raporu üretildi." },
  ];
  for (const al of auditLogs) {
    const existingLog = await prisma.auditLog.findFirst({
      where: { projectId, summary: al.summary },
    });
    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          projectId,
          userId,
          userName: "Umut Erdoğan (Yönetici)",
          action: al.action,
          entityType: al.entity,
          summary: al.summary,
        },
      });
    }
  }
  console.log("  ✅ 8 Detaylı AuditLog Kaydı (AuditLog) Eklendi.");

  console.log("\n================================================================================");
  console.log("🎉 TÜM SUNUM DEMO VERİLERİ EKSİKSİZ VE TUTARLI ŞEKİLDE BAŞARIYLA TAMAMLANDI!");
  console.log("================================================================================");
}

main()
  .catch((e) => {
    console.error("FATAL SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
