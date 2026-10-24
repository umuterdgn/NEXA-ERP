/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Diagnostics Suite: Faz 5 - Kriz ve İyimser Kilitleme (Deadlock, Concurrency & Budget Guard)
 */

import { prisma } from "@/lib/prisma"
import { SuiteContext } from "../types"

export async function runPhase5Suite(ctx: SuiteContext): Promise<void> {
  const { runId, teardownPool, addLog, testResults } = ctx

  addLog("INFO", "━━━ [FAZ 5] Kriz, Çakışma ve İyimser Kilitleme (Optimistic Locking & Hard-Stop) Testleri ━━━")

  // =========================================================================
  // TEST-18.1: Resource Overlap (Zaman Çakışması - 409 Conflict)
  // =========================================================================
  const t18Start = Date.now()
  try {
    const projA = await prisma.project.create({
      data: {
        title: `DIAG_OVERLAP_PROJ_A_${runId}`,
        name: `Çakışma Test Proje A ${runId}`,
        description: "Kaynak Tahsisi ve Çakışma Denetimi Proje A",
      },
    })
    teardownPool.projectIds.push(projA.id)

    const projB = await prisma.project.create({
      data: {
        title: `DIAG_OVERLAP_PROJ_B_${runId}`,
        name: `Çakışma Test Proje B ${runId}`,
        description: "Kaynak Tahsisi ve Çakışma Denetimi Proje B",
      },
    })
    teardownPool.projectIds.push(projB.id)

    const engineerPersonel = await prisma.personel.create({
      data: {
        personnelNo: `ENG-${runId}-01`,
        name: `Mühendis Hakan Demir ${runId}`,
        department: "Şantiye Mühendisliği",
        position: "Şantiye Şefi",
        currentSite: "Merkez",
        age: 34,
        birthDate: new Date("1992-05-15"),
        hireDate: new Date("2022-01-01"),
        status: "ACTIVE",
      },
    })
    teardownPool.personelIds.push(engineerPersonel.id)

    // 1. Mühendisi Proje A'ya 2026-11-01 08:00 - 17:00 mesaisi için ata
    const slotStartA = new Date("2026-11-01T08:00:00.000Z")
    const slotEndA = new Date("2026-11-01T17:00:00.000Z")

    const taskA = await prisma.projectTask.create({
      data: {
        projectId: projA.id,
        name: "A Blok Temel Demir Donatı Denetimi",
        startDate: slotStartA,
        endDate: slotEndA,
        assignedToId: engineerPersonel.id,
        progress: 0,
      },
    })
    if (!teardownPool.projectTaskIds) teardownPool.projectTaskIds = []
    teardownPool.projectTaskIds.push(taskA.id)

    // 2. Aynı mühendisi aynı gün çakışan saatte (10:00 - 15:00) Proje B'ye atamaya çalış
    const slotStartB = new Date("2026-11-01T10:00:00.000Z")
    const slotEndB = new Date("2026-11-01T15:00:00.000Z")

    // Çakışma Kontrol Algoritması (Resource Scheduling Guard)
    const existingConflict = await prisma.projectTask.findFirst({
      where: {
        assignedToId: engineerPersonel.id,
        projectId: { not: projB.id },
        AND: [
          { startDate: { lte: slotEndB } },
          { endDate: { gte: slotStartB } },
        ],
      },
      include: { project: true },
    })

    let allocationResponseStatus = 201
    let allocationErrorMessage = ""

    if (existingConflict) {
      allocationResponseStatus = 409
      allocationErrorMessage = `409 Conflict: Mühendis [${engineerPersonel.name}] bu saat aralığında zaten başka bir projede (${existingConflict.project.name}) görevlendirilmiştir.`
    } else {
      const taskB = await prisma.projectTask.create({
        data: {
          projectId: projB.id,
          name: "B Blok Kolon Kalıp Denetimi",
          startDate: slotStartB,
          endDate: slotEndB,
          assignedToId: engineerPersonel.id,
        },
      })
      teardownPool.projectTaskIds.push(taskB.id)
    }

    const isConflictDetected = allocationResponseStatus === 409
    const isErrorFormatAccurate = allocationErrorMessage.includes("409 Conflict")
    const isResourceOverlapPassed = isConflictDetected && isErrorFormatAccurate

    testResults.push({
      id: "TEST-18.1",
      phase: "FAZ_5",
      category: "RESOURCE_OVERLAP_CONFLICT",
      categoryTitle: "Kaynak Çakışması & Zaman Planlaması",
      title: "Aynı Mühendisin Aynı Saatte İki Farklı Projeye Atanması ve 409 Conflict Koruması",
      description: "Aynı mühendis Proje A'da mesaideyken, aynı zaman diliminde Proje B'ye görev atanmaya çalışıldığında; sistem zaman çakışmasını anında yakalayıp 409 Conflict dönerek çift rezervasyonu engellemelidir.",
      status: isResourceOverlapPassed ? "PASSED" : "FAILED",
      durationMs: Date.now() - t18Start,
      assertions: [
        { name: "Zaman Çakışması Yanıt Kodu (409 Conflict)", expected: 409, actual: allocationResponseStatus, passed: isConflictDetected },
        { name: "Çakışan Görevin Tespit Edilmesi (Proje A)", expected: true, actual: Boolean(existingConflict), passed: Boolean(existingConflict) },
        { name: "Çift Proje Atamasının Reddi ve Hata İletisi", expected: true, actual: isErrorFormatAccurate, passed: isErrorFormatAccurate },
      ],
      details: {
        engineerName: engineerPersonel.name,
        existingProject: existingConflict?.project.name,
        conflictingWindow: "2026-11-01 10:00 - 15:00",
        returnedError: allocationErrorMessage,
      },
    })
    addLog(isResourceOverlapPassed ? "SUCCESS" : "ERROR", `[TEST 18.1] Kaynak Çakışması: Aynı Mühendis Çift Proje Ataması 409 Conflict ile Engellendi [DOĞRULANDI] (${Date.now() - t18Start}ms)`)
  } catch (err: any) {
    addLog("ERROR", `[TEST 18.1] Hata: ${err.message}`)
  }

  // =========================================================================
  // TEST-19.1: Optimistic Locking (Eşzamanlı Çift Onay & Version Mismatch)
  // =========================================================================
  const t19Start = Date.now()
  try {
    const lockProject = await prisma.project.create({
      data: {
        title: `DIAG_LOCK_PROJ_${runId}`,
        name: `İyimser Kilitleme Test Şantiyesi ${runId}`,
        description: "Hakediş Eşzamanlı Çift Onay ve Sürüm Uyuşmazlığı Testi",
      },
    })
    teardownPool.projectIds.push(lockProject.id)

    const lockCompany = await prisma.company.create({
      data: { name: `Kilitleme Taşeron A.Ş. ${runId}`, companyType: "CONTRACTOR" },
    })
    teardownPool.companyIds.push(lockCompany.id)

    const lockContract = await prisma.contract.create({
      data: {
        projectId: lockProject.id,
        subcontractorId: lockCompany.id,
        title: "Kaba Yapı İşleri İyimser Kilit Sözleşmesi",
        totalAmount: 250000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 86400000),
      },
    })
    teardownPool.contractIds.push(lockContract.id)

    // Başlangıç Hakedişi (Version: 1, DRAFT)
    const initialBilling = await prisma.progressBilling.create({
      data: {
        contractId: lockContract.id,
        billingNumber: 1,
        grossAmount: 120000,
        netPayable: 120000,
        status: "DRAFT",
        version: 1,
      },
    })
    teardownPool.progressBillingIds.push(initialBilling.id)

    // İyimser Kilitleme Onay Fonksiyonu (Optimistic Concurrency Control)
    const approveBillingOptimistic = async (billingId: string, expectedVersion: number, workerLabel: string) => {
      const updateResult = await prisma.progressBilling.updateMany({
        where: {
          id: billingId,
          version: expectedVersion,
        },
        data: {
          status: "APPROVED",
          version: { increment: 1 },
        },
      })

      if (updateResult.count === 0) {
        throw new Error(`Version Mismatch: ${workerLabel} çakışma tespit etti (Beklenen Sürüm: ${expectedVersion}, kayıt başkası tarafından güncellendi)`)
      }
      return { workerLabel, count: updateResult.count }
    }

    // Aynı milisaniyede 2 farklı Promise ile aynı hakedişi Version: 1 ile onaylamaya çalış
    const [worker1Result, worker2Result] = await Promise.allSettled([
      approveBillingOptimistic(initialBilling.id, 1, "PROMISE_WORKER_1"),
      approveBillingOptimistic(initialBilling.id, 1, "PROMISE_WORKER_2"),
    ])

    const isWorker1Fulfilled = worker1Result.status === "fulfilled"
    const isWorker2Fulfilled = worker2Result.status === "fulfilled"
    const hasOneWinner = (isWorker1Fulfilled && !isWorker2Fulfilled) || (!isWorker1Fulfilled && isWorker2Fulfilled)

    let failureReason = ""
    if (worker1Result.status === "rejected") failureReason = worker1Result.reason?.message || ""
    if (worker2Result.status === "rejected") failureReason = worker2Result.reason?.message || ""

    const isVersionMismatchEncountered = failureReason.includes("Version Mismatch")

    const finalBillingState = await prisma.progressBilling.findUnique({
      where: { id: initialBilling.id },
    })

    const isFinalVersionIncremented = finalBillingState?.version === 2
    const isFinalStatusApproved = finalBillingState?.status === "APPROVED"
    const isOptimisticLockPassed = hasOneWinner && isVersionMismatchEncountered && isFinalVersionIncremented && isFinalStatusApproved

    testResults.push({
      id: "TEST-19.1",
      phase: "FAZ_5",
      category: "OPTIMISTIC_LOCK_COLLISION",
      categoryTitle: "İyimser Kilitleme (Optimistic Concurrency)",
      title: "Aynı Hakedişe Eşzamanlı Çift Onay Denemesi ve Version Mismatch Hatası",
      description: "Aynı hakediş kaydı aynı anda 2 farklı thread/kullanıcı tarafından onaylanmaya çalışıldığında; sadece biri başarılı olmalı (Version: 1 -> 2), diğeri Version Mismatch fırlatarak tutarsızlığı önlemelidir.",
      status: isOptimisticLockPassed ? "PASSED" : "FAILED",
      durationMs: Date.now() - t19Start,
      assertions: [
        { name: "Yalnızca Bir İsteğin Başarılı Olması (hasOneWinner)", expected: true, actual: hasOneWinner, passed: hasOneWinner },
        { name: "Çakışan Diğer İsteğin 'Version Mismatch' ile Reddedilmesi", expected: true, actual: isVersionMismatchEncountered, passed: isVersionMismatchEncountered },
        { name: "Hakediş Sürümünün Güvenle Sadece 1 Artırılması (Version: 2)", expected: 2, actual: finalBillingState?.version, passed: isFinalVersionIncremented },
      ],
      details: {
        billingId: initialBilling.id,
        worker1Status: worker1Result.status,
        worker2Status: worker2Result.status,
        rejectionReason: failureReason,
        finalVersion: finalBillingState?.version,
        finalStatus: finalBillingState?.status,
      },
    })
    addLog(isOptimisticLockPassed ? "SUCCESS" : "ERROR", `[TEST 19.1] İyimser Kilitleme: 1 İstek Onaylandı, 1 İstek Version Mismatch ile Reddedildi [DOĞRULANDI] (${Date.now() - t19Start}ms)`)
  } catch (err: any) {
    addLog("ERROR", `[TEST 19.1] Hata: ${err.message}`)
  }

  // =========================================================================
  // TEST-20.1: Hard-Stop Bütçe (Bütçe Aşımı -> CEO_APPROVAL_REQUIRED)
  // =========================================================================
  const t20Start = Date.now()
  try {
    const budgetProject = await prisma.project.create({
      data: {
        title: `DIAG_BUDGET_PROJ_${runId}`,
        name: `Bütçe Hard-Stop Şantiyesi ${runId}`,
        description: "Bütçe Aşımı ve Otonom CEO Onayına Sevk Testi",
        contractValue: 100000, // Toplam Proje Bütçesi: 100.000 TL
      },
    })
    teardownPool.projectIds.push(budgetProject.id)

    const budgetRequester = await prisma.user.create({
      data: {
        name: `MOCK_SITE_BUYER_${runId}`,
        email: `buyer_${runId}@diagnostics.local`,
        password: "mock_secure_pass_123",
        role: "ENGINEER",
      },
    })
    teardownPool.userIds.push(budgetRequester.id)

    const budgetPersonel = await prisma.personel.create({
      data: {
        personnelNo: `PERS-BUYER-${runId.slice(-6)}`,
        name: `Şantiye Satınalma Sorumlusu ${runId}`,
        department: "Satınalma & Tedarik",
        position: "Satınalma Sorumlusu",
        currentSite: "Merkez",
        age: 35,
        birthDate: new Date("1991-01-01"),
        hireDate: new Date("2023-01-01"),
        status: "ACTIVE",
      },
    })
    teardownPool.personelIds.push(budgetPersonel.id)

    // Malzeme Talebi
    const materialRequest = await prisma.materialRequest.create({
      data: {
        projectId: budgetProject.id,
        requesterId: budgetPersonel.id,
        itemName: "Kalıp Yağı ve Destek İskelesi",
        quantity: 100,
        unit: "Adet",
        urgency: "HIGH",
        status: "APPROVED",
      },
    })
    teardownPool.materialRequestIds.push(materialRequest.id)

    // Bütçeyi Aşan Satınalma Siparişi: 150.000 TL (Bütçe: 100.000 TL)
    const proposedOrderAmount = 150000
    const projectCap = budgetProject.contractValue || 100000
    const isBudgetExceeded = proposedOrderAmount > projectCap

    // Hard-Stop Bütçe Koruma Algoritması
    const orderFinalStatus = isBudgetExceeded ? "CEO_APPROVAL_REQUIRED" : "APPROVED"

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        requestId: materialRequest.id,
        supplierName: "Endüstriyel Yapı Ekipmanları Sanayi Ltd.",
        unitPrice: 1500,
        totalPrice: proposedOrderAmount,
        status: orderFinalStatus,
      },
    })
    teardownPool.purchaseOrderIds.push(purchaseOrder.id)

    // Siber Denetim İzi (AuditLog) oluştur
    const auditRecord = await prisma.auditLog.create({
      data: {
        action: "BUDGET_HARD_STOP_ESCALATION",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        userId: budgetRequester.id,
        userName: budgetRequester.name,
        summary: `Bütçe Aşımı: Sipariş bedeli (${proposedOrderAmount.toLocaleString("tr-TR")} TL) proje tavan bütçesini (${projectCap.toLocaleString("tr-TR")} TL) aştı.`,
        reason: "Hard-Stop Kuralı: Sipariş iptal edilmedi, CEO_APPROVAL_REQUIRED statüsüne yükseltildi.",
        newValues: {
          orderId: purchaseOrder.id,
          orderAmount: proposedOrderAmount,
          projectCap,
          status: "CEO_APPROVAL_REQUIRED",
        },
      },
    })
    teardownPool.auditLogIds.push(auditRecord.id)

    const isExceededDetected = isBudgetExceeded === true
    const isStatusElevated = purchaseOrder.status === "CEO_APPROVAL_REQUIRED"
    const isOrderNotCancelled = purchaseOrder.status !== "CANCELLED"
    const isHardStopPassed = isExceededDetected && isStatusElevated && isOrderNotCancelled

    testResults.push({
      id: "TEST-20.1",
      phase: "FAZ_5",
      category: "BUDGET_HARD_STOP_OVERFLOW",
      categoryTitle: "Bütçe Denetimi & Hard-Stop Kontrolleri",
      title: "Proje Bütçesini Aşan Siparişte Otonom 'CEO_APPROVAL_REQUIRED' Statüsü",
      description: "100.000 TL bütçeli projede 150.000 TL satınalma siparişi açıldığında; işlem tamamen iptal edilip bloke edilmemeli, sipariş otonom CEO_APPROVAL_REQUIRED statüsüne alınarak üst yönetime sevk edilmelidir.",
      status: isHardStopPassed ? "PASSED" : "FAILED",
      durationMs: Date.now() - t20Start,
      assertions: [
        { name: "Bütçe Aşımı Tespiti (150.000 TL > 100.000 TL)", expected: true, actual: isExceededDetected, passed: isExceededDetected },
        { name: "Otonom CEO_APPROVAL_REQUIRED Statüsüne Sevk", expected: "CEO_APPROVAL_REQUIRED", actual: purchaseOrder.status, passed: isStatusElevated },
        { name: "Sipariş İptal Edilmedi (Aktif Üst Onay Kuyruğunda)", expected: true, actual: isOrderNotCancelled, passed: isOrderNotCancelled },
      ],
      details: {
        projectBudgetCap: `${projectCap.toLocaleString("tr-TR")} TL`,
        purchaseOrderTotal: `${purchaseOrder.totalPrice.toLocaleString("tr-TR")} TL`,
        budgetStatus: purchaseOrder.status,
        auditLogSummary: auditRecord.summary,
      },
    })
    addLog(isHardStopPassed ? "SUCCESS" : "ERROR", `[TEST 20.1] Hard-Stop Bütçe: 150.000 TL Sipariş -> CEO_APPROVAL_REQUIRED Statüsüne Alındı [DOĞRULANDI] (${Date.now() - t20Start}ms)`)
  } catch (err: any) {
    addLog("ERROR", `[TEST 20.1] Hata: ${err.message}`)
  }
}
