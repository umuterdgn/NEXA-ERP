/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ortak Veri ve Entegrasyon Katmanı: ACID Transaction & Çekirdek Servis Katmanı
 */

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApproveProgressPaymentInput {
  progressPaymentId: string
  approvedById?: string | null
  deductPenalties?: boolean // Varsayılan: true (Cezaları hakedişten düş)
  notes?: string
  ipAddress?: string
  organizationId?: string
}

export interface ApproveProgressPaymentResult {
  success: boolean
  payment: any
  grossAmount: number
  totalPenalties: number
  netAmount: number
  openBimIssuesFound: number
  blockedByIssues: boolean
  financialTransaction: any
  auditLog: any
  message: string
}

export interface ReceiveStockDeliveryInput {
  purchaseOrderId: string
  receivedById?: string | null
  quantityReceived?: number // Belirtilmezse talep/kalan miktarın tamamı
  targetStockId?: string
  notes?: string
  ipAddress?: string
  organizationId?: string
}

export interface ReceiveStockDeliveryResult {
  success: boolean
  purchaseOrder: any
  stock: any
  stockMovement: any
  quantityReceived: number
  newStockQuantity: number
  auditLog: any
  message: string
}

export interface ConsumeStockForWorkPackageInput {
  stockId: string
  workPackageId: string
  quantity: number
  personnelId?: string | null
  description?: string
  notes?: string
  ipAddress?: string
  organizationId?: string
}

// ============================================================================
// HAKEDİŞ ONAY İŞLEMİ (ACID Transaction)
// ============================================================================
/**
 * Hakediş Onay İşlemi:
 * Aynı prisma.$transaction içinde:
 * 1. Hakediş kaydını ve bağlı sözleşme/taşeron bilgilerini doğrular.
 * 2. Taşeronun açık 3D BIM kusurlarını (BimIssue / Snagging) tarar ve bloke/ceza durumunu inceler.
 * 3. Ceza tutarlarını hesaplayıp brüt hakedişten düşerek net ödenecek tutarı belirler.
 * 4. Hakediş durumunu günceller (ONAYLANDI, netAmount, penaltyDeduction).
 * 5. Kasa/Finans defterinde otomatik FinancialTransaction ve Transaction tahakkuk kaydı oluşturur.
 * 6. Merkezi AuditLog ve ApprovalWorkflow kaydı düşer.
 */
export async function approveProgressPaymentTransaction(
  input: ApproveProgressPaymentInput
): Promise<ApproveProgressPaymentResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Hakediş kaydını ilişkileriyle birlikte çek
    const payment = await tx.progressPayment.findUnique({
      where: { id: input.progressPaymentId },
      include: {
        contract: {
          include: {
            subcontractor: true,
          },
        },
        subcontractor: true,
        project: true,
        workPackage: true,
        boqItem: true,
      },
    })

    if (!payment) {
      throw new Error(`Hakediş kaydı bulunamadı: ID ${input.progressPaymentId}`)
    }

    if (payment.status === "ONAYLANDI" || payment.status === "APPROVED") {
      throw new Error(`Bu hakediş zaten onaylanmış durumda (ID: ${payment.id})`)
    }

    // Taşeron ve proje kapsamını tespit et
    const subId = payment.subcontractorId || payment.contract?.subcontractorId || null
    const subName = payment.subcontractor?.name || payment.contract?.subcontractor?.name || null
    const projId = payment.projectId || payment.contract?.projectId || null
    const workPkgId = payment.workPackageId || null

    // 2. Taşeronun açık 3D BIM kusurlarını (Snagging) kontrol et
    const openBimIssues = await tx.bimIssue.findMany({
      where: {
        status: { in: ["OPEN", "Open", "ACIK", "Beklemede"] },
        ...(projId ? { projectId: projId } : {}),
        OR: [
          ...(subId ? [{ subcontractorId: subId }] : []),
          ...(workPkgId ? [{ workPackageId: workPkgId }] : []),
          ...(subName
            ? [
                {
                  subcontractorName: {
                    equals: subName,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
    })

    let totalPenalties = 0
    let hasHardBlock = false

    for (const issue of openBimIssues) {
      if (issue.blockPayment) {
        hasHardBlock = true
      }
      if (issue.penaltyAmount && issue.penaltyAmount > 0) {
        totalPenalties += issue.penaltyAmount
      }

      // Geriye dönük uyumluluk: description içindeki gömülü ---BIM_META--- JSON verisini kontrol et
      if (issue.description && issue.description.includes("---BIM_META---")) {
        try {
          const parts = issue.description.split("---BIM_META---")
          const meta = JSON.parse(parts[1].trim())
          if (meta.blockPayment === true) {
            hasHardBlock = true
          }
          if (meta.penaltyAmount && typeof meta.penaltyAmount === "number" && !issue.penaltyAmount) {
            totalPenalties += meta.penaltyAmount
          }
        } catch {}
      }
    }

    const grossAmount = payment.totalPrice ?? ((payment.quantity || 0) * (payment.unitPrice || 0))
    const penaltyToDeduct = input.deductPenalties !== false ? totalPenalties : 0
    const retentionRate = payment.retentionRate ?? 0.05
    const retentionAmount = Math.round(grossAmount * retentionRate * 100) / 100
    const advanceDeduction = payment.advanceDeduction ?? 0
    const netAmount = Math.max(0, Math.round((grossAmount - (penaltyToDeduct + retentionAmount + advanceDeduction)) * 100) / 100)

    // 3. Hakediş durumunu ve kesinti bilgilerini güncelle
    const updatedPayment = await tx.progressPayment.update({
      where: { id: payment.id },
      data: {
        status: "ONAYLANDI",
        penaltyDeduction: totalPenalties,
        retentionRate,
        retentionAmount,
        advanceDeduction,
        netPayableAmount: netAmount,
        netAmount: netAmount,
      },
    })

    // 4. Finansal işlem kaydı oluştur (FinancialTransaction)
    const financialTx = await tx.financialTransaction.create({
      data: {
        type: "EXPENSE",
        amount: grossAmount,
        netAmount: netAmount,
        penaltyDeduction: totalPenalties,
        status: "COMPLETED",
        description: `Hakediş Onayı: ${payment.title} (Brüt: ${grossAmount.toLocaleString(
          "tr-TR"
        )} ₺, BIM Ceza/Kusur Kesintisi: ${totalPenalties.toLocaleString("tr-TR")} ₺, Net: ${netAmount.toLocaleString(
          "tr-TR"
        )} ₺)`,
        category: "HAKEDIS",
        contractId: payment.contractId || null,
        progressPaymentId: payment.id,
        projectId: projId || null,
        subcontractorId: subId || null,
        date: new Date(),
      },
    })

    // Finans görünümünün anlık tutarlılığı için Transaction tablosuna da borç/gider kaydı işle
    await tx.transaction.create({
      data: {
        type: "GIDER",
        amount: netAmount,
        description: `Hakediş Tahakkuku: ${payment.title} - Taşeron: ${subName || "Belirtilmedi"} (Net Ödeme)`,
        category: "HAKEDIS",
        projectId: projId || null,
        contractId: payment.contractId || null,
        progressPaymentId: payment.id,
        date: new Date(),
      },
    })

    // 5. Onay İş akışı kaydı (ApprovalWorkflow)
    await tx.approvalWorkflow.create({
      data: {
        entityType: "PROGRESS_PAYMENT",
        entityId: payment.id,
        progressPaymentId: payment.id,
        status: "APPROVED",
        approverId: input.approvedById || null,
        comment:
          input.notes ||
          `Hakediş onaylandı. Açık 3D BIM kusurları (${openBimIssues.length} adet) incelendi ve ${totalPenalties.toLocaleString(
            "tr-TR"
          )} ₺ ceza düşüldü.`,
        approvedAt: new Date(),
      },
    })

    // 6. Merkezi Değiştirilemez Denetim İzi (AuditLog)
    const auditLog = await tx.auditLog.create({
      data: {
        action: "APPROVE_PROGRESS_PAYMENT",
        entityType: "PROGRESS_PAYMENT",
        entityId: payment.id,
        userId: input.approvedById || null,
        organizationId: input.organizationId || null,
        reason:
          input.notes ||
          `Hakediş başarıyla onaylandı. Brüt: ${grossAmount.toLocaleString(
            "tr-TR"
          )} ₺, Kesinti: ${totalPenalties.toLocaleString("tr-TR")} ₺, Net Ödenecek: ${netAmount.toLocaleString(
            "tr-TR"
          )} ₺.`,
        ipAddress: input.ipAddress || null,
        metadata: JSON.stringify({
          progressPaymentId: payment.id,
          grossAmount,
          penaltyDeduction: totalPenalties,
          netAmount,
          openIssuesCount: openBimIssues.length,
          openIssueIds: openBimIssues.map((i) => i.id),
          subcontractorId: subId,
          subcontractorName: subName,
          financialTransactionId: financialTx.id,
        }),
        diff: JSON.stringify({
          previousStatus: payment.status,
          newStatus: "ONAYLANDI",
          penaltyDeduction: totalPenalties,
          netAmount: netAmount,
        }),
      },
    })

    return {
      success: true,
      payment: updatedPayment,
      grossAmount,
      totalPenalties,
      netAmount,
      openBimIssuesFound: openBimIssues.length,
      blockedByIssues: hasHardBlock,
      financialTransaction: financialTx,
      auditLog,
      message: `Hakediş başarıyla onaylandı. ${openBimIssues.length} adet BIM kusuru incelendi, ${totalPenalties.toLocaleString(
        "tr-TR"
      )} ₺ kesinti yapıldı. Net ödenecek: ${netAmount.toLocaleString("tr-TR")} ₺.`,
    }
  })
}

// ============================================================================
// STOK / SİPARİŞ TESLİM ALMA İŞLEMİ (ACID Transaction)
// ============================================================================
/**
 * Stok/Sipariş İşlemi:
 * Aynı prisma.$transaction içinde:
 * 1. Satınalma siparişini (PurchaseOrder) doğrular.
 * 2. Ambar stoğunu (Stock) tespit eder veya sipariş kalemine göre otomatik oluşturur.
 * 3. Ambar stok miktarını atomik olarak artırır (quantity: { increment: qty }).
 * 4. Stok hareket kaydı (StockMovement: GIRIS) ve maliyet kaydı (StockTransaction: IN) oluşturur.
 * 5. Sipariş (PurchaseOrder) ve Malzeme Talebi (MaterialRequest) durumunu DELIVERED yapar.
 * 6. Merkezi AuditLog ve ApprovalWorkflow kaydı düşer.
 */
export async function receiveStockDeliveryTransaction(
  input: ReceiveStockDeliveryInput
): Promise<ReceiveStockDeliveryResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Siparişi ilişkileriyle birlikte çek
    const po = await tx.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
      include: {
        request: {
          include: {
            project: true,
          },
        },
        stock: true,
        material: true,
      },
    })

    if (!po) {
      throw new Error(`Satınalma siparişi bulunamadı: ID ${input.purchaseOrderId}`)
    }

    if (po.status === "DELIVERED") {
      throw new Error(`Bu sipariş zaten ambar stoğuna teslim alınmış durumda (PO ID: ${po.id})`)
    }

    const qtyToReceive =
      input.quantityReceived && input.quantityReceived > 0
        ? input.quantityReceived
        : po.request?.quantity || 1

    // 2. Ambar stoğunu (Stock) belirle veya oluştur
    let stockId = input.targetStockId || po.stockId

    if (!stockId && po.materialId) {
      const existingStock = await tx.stock.findFirst({
        where: { materialId: po.materialId },
      })
      if (existingStock) {
        stockId = existingStock.id
      }
    }

    if (!stockId) {
      const itemName = po.request?.itemName || po.supplierName || "Malzeme"
      const existingStockByName = await tx.stock.findFirst({
        where: { name: { equals: itemName, mode: "insensitive" } },
      })

      if (existingStockByName) {
        stockId = existingStockByName.id
      } else {
        const newStock = await tx.stock.create({
          data: {
            code: `STK-${Date.now().toString().slice(-6)}`,
            name: itemName,
            unit: "ADET",
            quantity: 0,
            costPrice: po.unitPrice,
            category: "Satınalma Siparişi",
            materialId: po.materialId || null,
          },
        })
        stockId = newStock.id
      }
    }

    // 3. Ambar stoğunu atomik olarak artır
    const updatedStock = await tx.stock.update({
      where: { id: stockId },
      data: {
        quantity: { increment: qtyToReceive },
        costPrice: po.unitPrice,
        ...(po.materialId && !po.stock?.materialId ? { materialId: po.materialId } : {}),
      },
    })

    // 4. Stok Giriş Hareketi (StockMovement: GIRIS / IN)
    const stockMovement = await tx.stockMovement.create({
      data: {
        type: "GIRIS",
        quantity: qtyToReceive,
        description: `Satınalma Siparişi Ambar Girişi: PO #${po.id.slice(-6)} (${po.supplierName}) - ${
          input.notes || "Teslim Alındı"
        }`,
        stockId: stockId,
        purchaseOrderId: po.id,
        materialId: po.materialId || null,
        projectId: po.request?.projectId || null,
        date: new Date(),
      },
    })

    // Maliyet ve finansal takip için StockTransaction kaydı oluştur
    await tx.stockTransaction.create({
      data: {
        stockId: stockId,
        type: "IN",
        quantity: qtyToReceive,
        unitPrice: po.unitPrice,
        totalPrice: po.unitPrice * qtyToReceive,
        description: `Sipariş Teslimatı: PO #${po.id} (${po.supplierName})`,
        date: new Date(),
      },
    })

    // 5. Sipariş ve Malzeme Talebi durumlarını güncelle
    const updatedPO = await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: "DELIVERED",
        stockId: stockId,
        receivedQuantity: qtyToReceive,
        deliveredAt: new Date(),
      },
    })

    if (po.requestId) {
      await tx.materialRequest.update({
        where: { id: po.requestId },
        data: { status: "DELIVERED" },
      })
    }

    // 6. Onay İş Akışı (ApprovalWorkflow)
    await tx.approvalWorkflow.create({
      data: {
        entityType: "PURCHASE_ORDER",
        entityId: po.id,
        purchaseOrderId: po.id,
        status: "APPROVED",
        approverId: input.receivedById || null,
        comment: input.notes || "Sipariş teslimatı kabul edildi ve ambar stoğuna aktarıldı",
        approvedAt: new Date(),
      },
    })

    // 7. Merkezi Değiştirilemez Denetim İzi (AuditLog)
    const auditLog = await tx.auditLog.create({
      data: {
        action: "RECEIVE_PURCHASE_ORDER",
        entityType: "PURCHASE_ORDER",
        entityId: po.id,
        userId: input.receivedById || null,
        organizationId: input.organizationId || null,
        reason:
          input.notes ||
          `Satınalma siparişi (${po.id}) başarıyla teslim alındı. ${qtyToReceive} adet ambar stoğuna (Stok: ${updatedStock.name}) giriş yapıldı.`,
        ipAddress: input.ipAddress || null,
        metadata: JSON.stringify({
          purchaseOrderId: po.id,
          supplierName: po.supplierName,
          stockId: stockId,
          stockName: updatedStock.name,
          quantityReceived: qtyToReceive,
          newTotalQuantity: updatedStock.quantity,
          unitPrice: po.unitPrice,
          totalPrice: po.unitPrice * qtyToReceive,
        }),
        diff: JSON.stringify({
          previousStockQuantity: updatedStock.quantity - qtyToReceive,
          newStockQuantity: updatedStock.quantity,
          purchaseOrderStatus: "DELIVERED",
        }),
      },
    })

    return {
      success: true,
      purchaseOrder: updatedPO,
      stock: updatedStock,
      stockMovement,
      quantityReceived: qtyToReceive,
      newStockQuantity: updatedStock.quantity,
      auditLog,
      message: `Sipariş başarıyla ambar stoğuna eklendi. Depodaki güncel miktar: ${updatedStock.quantity} (${updatedStock.name})`,
    }
  })
}

// ============================================================================
// ŞANTİYE İŞ PAKETİNE MALZEME SARFI İŞLEMİ (OUT Movement)
// ============================================================================
/**
 * Ambardan Şantiye İş Paketine Sarf (OUT Movement):
 * Ambardan çıkan malzemenin doğrudan ilgili İş Paketi (WorkPackage)
 * ve Projeye zimmetlenerek stoktan düşülmesini ve AuditLog yazılmasını sağlar.
 */
export async function consumeStockForWorkPackageTransaction(
  input: ConsumeStockForWorkPackageInput
) {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({
      where: { id: input.stockId },
    })

    if (!stock) {
      throw new Error(`Stok kalemi bulunamadı: ID ${input.stockId}`)
    }

    if (stock.quantity < input.quantity) {
      throw new Error(
        `Yetersiz ambar stoğu! Mevcut: ${stock.quantity}, Talep edilen: ${input.quantity}`
      )
    }

    const workPackage = await tx.workPackage.findUnique({
      where: { id: input.workPackageId },
      include: { project: true },
    })

    if (!workPackage) {
      throw new Error(`İş paketi bulunamadı: ID ${input.workPackageId}`)
    }

    // 1. Stok miktarını düş
    const updatedStock = await tx.stock.update({
      where: { id: stock.id },
      data: {
        quantity: { decrement: input.quantity },
      },
    })

    // 2. Stok Çıkış Hareketi (StockMovement: CIKIS)
    const stockMovement = await tx.stockMovement.create({
      data: {
        type: "CIKIS",
        quantity: input.quantity,
        description:
          input.description ||
          `İş Paketine Sarf: ${workPackage.name} (${workPackage.code || "Pozsuz"})`,
        stockId: stock.id,
        workPackageId: workPackage.id,
        projectId: workPackage.projectId,
        personnelId: input.personnelId || null,
        materialId: stock.materialId || null,
        date: new Date(),
      },
    })

    // 3. Maliyet Takibi (StockTransaction: OUT)
    await tx.stockTransaction.create({
      data: {
        stockId: stock.id,
        type: "OUT",
        quantity: input.quantity,
        unitPrice: stock.costPrice || 0,
        totalPrice: (stock.costPrice || 0) * input.quantity,
        description: `İş Paketi Sarfı: ${workPackage.name}`,
        date: new Date(),
      },
    })

    // 4. Denetim İzi (AuditLog)
    const auditLog = await tx.auditLog.create({
      data: {
        action: "CONSUME_STOCK_TO_WORK_PACKAGE",
        entityType: "STOCK",
        entityId: stock.id,
        userId: input.personnelId || null,
        organizationId: input.organizationId || null,
        reason:
          input.notes ||
          `${input.quantity} birim malzeme, "${workPackage.name}" iş paketine sarf edildi.`,
        ipAddress: input.ipAddress || null,
        metadata: JSON.stringify({
          stockId: stock.id,
          stockName: stock.name,
          workPackageId: workPackage.id,
          workPackageName: workPackage.name,
          projectId: workPackage.projectId,
          quantityConsumed: input.quantity,
          remainingQuantity: updatedStock.quantity,
        }),
        diff: JSON.stringify({
          previousQuantity: stock.quantity,
          newQuantity: updatedStock.quantity,
        }),
      },
    })

    return {
      success: true,
      stock: updatedStock,
      stockMovement,
      workPackage,
      auditLog,
    }
  })
}

// ============================================================================
// TAŞERON 3D BIM KUSUR KONTROL YARDIMCISI (Read-Only)
// ============================================================================
export async function getOpenBimDefectsForSubcontractor(subcontractorIdOrName: string, projectId?: string) {
  return await prisma.bimIssue.findMany({
    where: {
      status: { in: ["OPEN", "Open", "ACIK", "Beklemede"] },
      ...(projectId ? { projectId } : {}),
      OR: [
        { subcontractorId: subcontractorIdOrName },
        {
          subcontractorName: {
            equals: subcontractorIdOrName,
            mode: "insensitive" as const,
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  })
}
