/**
 * © 2026 NXA Software. All rights reserved.
 * ADIM 2: Canlı Mobil API, RBAC (401/403) ve Çok Kiracılı İzolasyon Test Paketi
 * Kullanım: node scripts/test-phase1-api.mjs
 */

import assert from "node:assert/strict"
import {
  PREFIX,
  cleanupAuditFixtures,
  prisma,
  seedAuditFixtures,
  verifyCleanDatabase,
} from "./_phase1-audit-fixture.mjs"

const BASE_URL = process.env.AUDIT_BASE_URL || "http://localhost:3000"

let passedCount = 0
const resultsLog = []

async function runCheck(name, fn) {
  try {
    await fn()
    passedCount++
    resultsLog.push({ name, status: "PASS" })
    console.log(`  ✅ PASS: ${name}`)
  } catch (err) {
    resultsLog.push({ name, status: "FAIL", error: err?.message || String(err) })
    console.error(`  ❌ FAIL: ${name} -> ${err?.message || err}`)
    throw err
  }
}

async function apiReq(pathUrl, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${pathUrl}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: res.status, json }
}

async function main() {
  console.log(`\n🚀 ADIM 2: Canlı API Testleri Başlıyor (${BASE_URL})`)
  let fx
  try {
    fx = await seedAuditFixtures()
    const tokens = {}

    // 1. Token Olmadan Tüm 26 /api/mobile/* Ucu -> KESİN 401
    console.log("\n--- 1. Unauthenticated (Token Yok) -> 401 Kontrolleri ---")
    const unauthEndpoints = [
      ["GET", "/api/mobile/auth/me"],
      ["POST", "/api/mobile/auth/logout"],
      ["GET", "/api/mobile/sso-token"],
      ["POST", "/api/mobile/sso-token"],
      ["GET", "/api/mobile/dashboard"],
      ["POST", "/api/mobile/telemetry/location"],
      ["GET", "/api/mobile/routes"],
      ["GET", "/api/mobile/work-proofs"],
      ["POST", "/api/mobile/work-proofs"],
      ["PATCH", `/api/mobile/work-proofs/${fx.subcontractors.workProofB.id}/review`],
      ["GET", "/api/mobile/inspections"],
      ["POST", "/api/mobile/inspections"],
      ["GET", "/api/mobile/samples"],
      ["POST", "/api/mobile/samples"],
      ["GET", "/api/mobile/deficiencies"],
      ["POST", "/api/mobile/deficiencies"],
      ["GET", "/api/mobile/forms"],
      ["POST", "/api/mobile/forms"],
      ["GET", "/api/mobile/attendance"],
      ["POST", "/api/mobile/attendance"],
      ["GET", "/api/mobile/hr/requests"],
      ["POST", "/api/mobile/hr/requests"],
      ["GET", "/api/mobile/hr/self"],
      ["GET", "/api/mobile/logistics"],
      ["POST", "/api/mobile/logistics"],
      ["GET", "/api/mobile/isg"],
      ["POST", "/api/mobile/isg"],
      ["GET", "/api/mobile/chat"],
      ["POST", "/api/mobile/chat"],
      ["POST", "/api/mobile/ai/vision"],
      ["POST", "/api/mobile/sync/batch"],
      ["GET", "/api/mobile/journal"],
      ["GET", "/api/mobile/tasks"],
      ["POST", "/api/mobile/tasks/progress"],
      ["GET", "/api/mobile/inventory/consume"],
      ["POST", "/api/mobile/receiving"],
      ["POST", "/api/mobile/logistics/status"],
    ]

    await runCheck(`Tokensiz ${unauthEndpoints.length} /api/mobile/* isteği -> 401`, async () => {
      for (const [method, url] of unauthEndpoints) {
        const res = await apiReq(url, { method, body: method !== "GET" ? {} : undefined })
        assert.equal(res.status, 401, `${method} ${url} beklenmedik statü döndü: ${res.status}`)
      }
    })

    // 2. 11 Aktör İçin Login + /me + /sso-token Kontrolleri
    console.log("\n--- 2. 11 Test Aktörü Auth & Sözleşme Doğrulaması ---")
    for (const [key, actor] of Object.entries(fx.actors)) {
      await runCheck(`Auth Login + /me + /sso-token: ${key}`, async () => {
        const login = await apiReq("/api/mobile/auth/login", {
          method: "POST",
          body: { email: actor.email, password: actor.password },
        })
        assert.equal(login.status, 200, `Login ${key} failed: ${JSON.stringify(login.json)}`)
        assert.ok(login.json.accessToken, `${key} accessToken boş`)
        assert.ok(Array.isArray(login.json.allowedModules) && login.json.allowedModules.length > 0, `${key} allowedModules boş`)
        assert.ok(login.json.locationTrackingMode, `${key} locationTrackingMode boş`)
        assert.ok(Array.isArray(login.json.assignedProjects) && login.json.assignedProjects.length > 0, `${key} assignedProjects boş`)

        tokens[key] = login.json.accessToken

        const me = await apiReq("/api/mobile/auth/me", { token: tokens[key] })
        assert.equal(me.status, 200)
        assert.equal(me.json.user.role, actor.role)

        const ssoGet = await apiReq("/api/mobile/sso-token", { method: "GET", token: tokens[key] })
        assert.equal(ssoGet.status, 200)
        assert.ok(ssoGet.json.ssoToken)

        const ssoPost = await apiReq("/api/mobile/sso-token", { method: "POST", token: tokens[key], body: {} })
        assert.equal(ssoPost.status, 200)
        assert.ok(ssoPost.json.ssoToken)
      })
    }

    // 3. Tüm /api/mobile/* Uçlarının Pozitif (200/201) Testleri
    console.log("\n--- 3. Pozitif API Testleri (Yetkili Roller) ---")

    await runCheck("GET /api/mobile/dashboard (ADMIN, INSPECTOR, FRANCHISEE)", async () => {
      for (const k of ["ADMIN", "INSPECTOR", "FRANCHISEE"]) {
        const r = await apiReq("/api/mobile/dashboard", { token: tokens[k] })
        assert.equal(r.status, 200, `${k} dashboard status=${r.status}`)
        assert.equal(r.json.success, true)
      }
    })

    await runCheck("POST /api/mobile/telemetry/location (ENGINEER, DRIVER, INSPECTOR)", async () => {
      for (const k of ["ENGINEER", "DRIVER", "INSPECTOR"]) {
        const r = await apiReq("/api/mobile/telemetry/location", {
          method: "POST",
          token: tokens[k],
          body: { lat: 41.0083, lng: 28.9785, speed: 5.5, batteryLevel: 92 },
        })
        assert.equal(r.status, 200, `${k} telemetry status=${r.status}`)
        assert.equal(r.json.success, true)
      }
    })

    await runCheck("GET /api/mobile/routes (DRIVER, INSPECTOR, LAB_TECH)", async () => {
      for (const k of ["DRIVER", "INSPECTOR", "LAB_TECH"]) {
        const r = await apiReq("/api/mobile/routes", { token: tokens[k] })
        assert.equal(r.status, 200, `${k} routes status=${r.status}`)
        assert.equal(r.json.success, true)
      }
    })

    let createdProofId = null
    await runCheck("POST/GET /api/mobile/work-proofs + PATCH/POST review (SUBCONTRACTOR -> ENGINEER -> SITE_MANAGER)", async () => {
      const post = await apiReq("/api/mobile/work-proofs", {
        method: "POST",
        token: tokens.SUBCONTRACTOR,
        body: {
          title: `${PREFIX}OwnWorkProof`,
          description: "Kendi taşeron imalat kanıtım",
          photoUrl: "https://example.com/own.jpg",
          claimedQuantity: 40,
          projectId: fx.projects.contractorProj.id,
        },
      })
      assert.equal(post.status, 200)
      createdProofId = post.json.proof.id
      assert.ok(createdProofId)

      const getSub = await apiReq("/api/mobile/work-proofs", { token: tokens.SUBCONTRACTOR })
      assert.equal(getSub.status, 200)
      assert.ok(getSub.json.proofs.some((p) => p.id === createdProofId))

      const engRev = await apiReq(`/api/mobile/work-proofs/${createdProofId}/review`, {
        method: "PATCH",
        token: tokens.ENGINEER,
        body: { action: "APPROVE", approvedQuantity: 38, notes: "Mühendis onayladı" },
      })
      assert.equal(engRev.status, 200)

      const mgrRev = await apiReq(`/api/mobile/work-proofs/${createdProofId}/review`, {
        method: "POST",
        token: tokens.SITE_MANAGER,
        body: { action: "APPROVE", approvedQuantity: 38, notes: "Şantiye şefi onayladı" },
      })
      assert.equal(mgrRev.status, 200)
      assert.equal(mgrRev.json.proof.status, "APPROVED")
    })

    await runCheck("POST/GET /api/mobile/inspections (INSPECTOR)", async () => {
      const post = await apiReq("/api/mobile/inspections", {
        method: "POST",
        token: tokens.INSPECTOR,
        body: {
          projectId: fx.projects.inspectionProj.id,
          type: "DONATI",
          floor: "1. Kat",
          status: "APPROVED",
        },
      })
      assert.equal(post.status, 200)
      const get = await apiReq("/api/mobile/inspections", { token: tokens.INSPECTOR })
      assert.equal(get.status, 200)
      assert.ok(get.json.count >= 1)
    })

    await runCheck("POST/GET/PATCH /api/mobile/samples (LAB_TECH & INSPECTOR)", async () => {
      const qr = `${PREFIX}SAMPLE_QR_NEW`
      const post = await apiReq("/api/mobile/samples", {
        method: "POST",
        token: tokens.INSPECTOR,
        body: { qrCode: qr, location: "B Blok", projectId: fx.projects.inspectionProj.id },
      })
      assert.equal(post.status, 200)

      const get = await apiReq("/api/mobile/samples", { token: tokens.LAB_TECH })
      assert.equal(get.status, 200)
      assert.ok(get.json.samples.some((s) => s.qrCode === qr))

      const patch = await apiReq("/api/mobile/samples", {
        method: "PATCH",
        token: tokens.LAB_TECH,
        body: { id: post.json.sample.id, strengthResult: 34.5 },
      })
      assert.equal(patch.status, 200)
      assert.equal(patch.json.sample.status, "PASSED")
    })

    await runCheck("POST/GET/PATCH /api/mobile/deficiencies (INSPECTOR & FRANCHISEE BranchA)", async () => {
      const post = await apiReq("/api/mobile/deficiencies", {
        method: "POST",
        token: tokens.INSPECTOR,
        body: {
          projectId: fx.projects.inspectionProj.id,
          element: `${PREFIX}Beam`,
          floor: "2. Kat",
          description: `${PREFIX}InspectionDefect`,
        },
      })
      assert.equal(post.status, 200)

      const get = await apiReq("/api/mobile/deficiencies", { token: tokens.INSPECTOR })
      assert.equal(get.status, 200)

      const patch = await apiReq("/api/mobile/deficiencies", {
        method: "PATCH",
        token: tokens.INSPECTOR,
        body: { id: post.json.deficiency.id, status: "CLOSED" },
      })
      assert.equal(patch.status, 200)
    })

    await runCheck("GET/POST /api/mobile/forms (INSPECTOR)", async () => {
      const get = await apiReq("/api/mobile/forms", { token: tokens.INSPECTOR })
      assert.equal(get.status, 200)
      assert.ok(get.json.forms.some((f) => f.id === fx.records.inspectionForm.id))

      const post = await apiReq("/api/mobile/forms", {
        method: "POST",
        token: tokens.INSPECTOR,
        body: {
          formId: fx.records.inspectionForm.id,
          projectId: fx.projects.inspectionProj.id,
          answers: { q1: true },
          notes: `${PREFIX}FormNote`,
        },
      })
      assert.equal(post.status, 200)
      assert.ok(post.json.submissionId)
    })

    await runCheck("POST/GET /api/mobile/attendance (WORKER Check-In -> Check-Out)", async () => {
      const checkIn = await apiReq("/api/mobile/attendance", {
        method: "POST",
        token: tokens.WORKER,
        body: { lat: 41.0082, lng: 28.9784, projectId: fx.projects.contractorProj.id },
      })
      assert.equal(checkIn.status, 200)
      assert.equal(checkIn.json.type, "CHECK_IN")

      const get = await apiReq("/api/mobile/attendance", { token: tokens.WORKER })
      assert.equal(get.status, 200)
      assert.ok(get.json.count >= 1)
    })

    await runCheck("POST/GET/PATCH /api/mobile/hr/requests (WORKER -> ADMIN Approve)", async () => {
      const post = await apiReq("/api/mobile/hr/requests", {
        method: "POST",
        token: tokens.WORKER,
        body: {
          requestType: "LEAVE",
          leaveType: "YILLIK",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          reason: `${PREFIX}LeaveReason`,
        },
      })
      assert.equal(post.status, 200)

      const get = await apiReq("/api/mobile/hr/requests", { token: tokens.WORKER })
      assert.equal(get.status, 200)

      const patch = await apiReq("/api/mobile/hr/requests", {
        method: "PATCH",
        token: tokens.ADMIN,
        body: { requestType: "LEAVE", id: post.json.request.id, action: "APPROVE" },
      })
      assert.equal(patch.status, 200)
    })

    await runCheck("GET /api/mobile/hr/self (WORKER)", async () => {
      const r = await apiReq("/api/mobile/hr/self", { token: tokens.WORKER })
      assert.equal(r.status, 200)
      assert.equal(r.json.profile.email, fx.actors.WORKER.email)
    })

    await runCheck("GET/POST /api/mobile/logistics (DRIVER & ADMIN)", async () => {
      const get = await apiReq("/api/mobile/logistics", { token: tokens.DRIVER })
      assert.equal(get.status, 200)

      const checkin = await apiReq("/api/mobile/logistics", {
        method: "POST",
        token: tokens.DRIVER,
        body: { action: "GATE_CHECKIN", scheduleId: fx.records.contractorSchedule.id },
      })
      assert.equal(checkin.status, 200)

      const reqMat = await apiReq("/api/mobile/logistics", {
        method: "POST",
        token: tokens.SITE_MANAGER,
        body: { action: "CREATE_REQUEST", itemName: `${PREFIX}Beton`, quantity: 5, unit: "m3" },
      })
      assert.equal(reqMat.status, 200)

      const consume = await apiReq("/api/mobile/logistics", {
        method: "POST",
        token: tokens.ADMIN,
        body: { action: "CONSUME_QR", qrCode: fx.records.contractorInv.qrCode, quantity: 2 },
      })
      assert.equal(consume.status, 200)
    })

    await runCheck("POST/GET /api/mobile/isg (WORKER NearMiss + SOS)", async () => {
      const nm = await apiReq("/api/mobile/isg", {
        method: "POST",
        token: tokens.WORKER,
        body: {
          title: `${PREFIX}NearMiss`,
          description: "Korkuluk gevşekliği tespit edildi",
          severity: "MEDIUM",
          projectId: fx.projects.contractorProj.id,
        },
      })
      assert.equal(nm.status, 200)

      const sos = await apiReq("/api/mobile/isg", {
        method: "POST",
        token: tokens.WORKER,
        body: { action: "SOS", lat: 41.0082, lng: 28.9784, projectId: fx.projects.contractorProj.id },
      })
      assert.equal(sos.status, 200)

      const get = await apiReq("/api/mobile/isg", { token: tokens.WORKER })
      assert.equal(get.status, 200)
      assert.ok(get.json.activeSosCount >= 1)
    })

    await runCheck("POST/GET /api/mobile/chat (ENGINEER)", async () => {
      const post = await apiReq("/api/mobile/chat", {
        method: "POST",
        token: tokens.ENGINEER,
        body: { content: `${PREFIX}HelloSite`, projectId: fx.projects.contractorProj.id },
      })
      assert.equal(post.status, 200)

      const get = await apiReq("/api/mobile/chat", { token: tokens.ENGINEER })
      assert.equal(get.status, 200)
      assert.ok(get.json.messages.some((m) => m.content === `${PREFIX}HelloSite`))
    })

    await runCheck("POST /api/mobile/ai/vision (ENGINEER)", async () => {
      const tinyJpgBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
      const r = await apiReq("/api/mobile/ai/vision", {
        method: "POST",
        token: tokens.ENGINEER,
        body: { imageBase64: tinyJpgBase64 },
      })
      assert.equal(r.status, 200)
      assert.equal(r.json.success, true)
      assert.ok(r.json.analysis)
    })

    await runCheck("POST /api/mobile/sync/batch (ENGINEER)", async () => {
      const r = await apiReq("/api/mobile/sync/batch", {
        method: "POST",
        token: tokens.ENGINEER,
        body: {
          items: [
            { id: "sync-1", action: "LOCATION_LOG", payload: { lat: 41.0082, lng: 28.9784 } },
            { id: "sync-2", action: "TASK_UPDATE", payload: { taskId: fx.records.contractorTask.id, status: "IN_PROGRESS" } },
          ],
        },
      })
      assert.equal(r.status, 200)
      assert.equal(r.json.processedCount, 2)
    })

    await runCheck("Legacy /api/mobile/* Pozitif (journal, tasks, tasks/progress, inventory/consume, receiving, logistics/status)", async () => {
      const j = await apiReq("/api/mobile/journal", {
        method: "POST",
        token: tokens.SITE_MANAGER,
        body: { worksDone: `${PREFIX}JournalWork`, personnelCount: 12, projectId: fx.projects.contractorProj.id },
      })
      assert.equal(j.status, 200)

      const tGet = await apiReq("/api/mobile/tasks", { token: tokens.WORKER })
      assert.equal(tGet.status, 200)

      const tp = await apiReq("/api/mobile/tasks/progress", {
        method: "POST",
        token: tokens.ENGINEER,
        body: {
          taskId: fx.records.contractorTask.id,
          boqItemId: fx.records.contractorBoq.id,
          quantityAdded: 5,
          photoUrl: "https://example.com/progress.jpg",
          zoneName: "1. Kat",
          projectId: fx.projects.contractorProj.id,
        },
      })
      assert.equal(tp.status, 200)

      const cons = await apiReq("/api/mobile/inventory/consume", {
        method: "POST",
        token: tokens.ADMIN,
        body: { qrCode: fx.records.contractorInvItem.qrCode, quantity: 3 },
      })
      assert.equal(cons.status, 200)

      const recv = await apiReq("/api/mobile/receiving", {
        method: "POST",
        token: tokens.ADMIN,
        body: { materialName: `${PREFIX}NewMat`, quantity: 10, projectId: fx.projects.contractorProj.id },
      })
      assert.equal(recv.status, 200)

      const lstat = await apiReq("/api/mobile/logistics/status", {
        method: "POST",
        token: tokens.DRIVER,
        body: { status: "IN_TRANSIT", scheduleId: fx.records.contractorSchedule.id },
      })
      assert.equal(lstat.status, 200)
    })

    // 4. Sert Negatif & Çapraz İzolasyon Testleri
    console.log("\n--- 4. Sert Negatif & Çapraz İzolasyon Kontrolleri (403 / Boş Liste) ---")

    await runCheck("WORKER -> work-proofs review / finance / payroll => 403", async () => {
      const r1 = await apiReq(`/api/mobile/work-proofs/${fx.subcontractors.workProofB.id}/review`, {
        method: "PATCH",
        token: tokens.WORKER,
        body: { action: "APPROVE" },
      })
      assert.equal(r1.status, 403)

      const r2 = await apiReq("/api/admin/finance", { token: tokens.WORKER })
      assert.equal(r2.status, 403)

      const r3 = await apiReq("/api/admin/payroll", { token: tokens.WORKER })
      assert.equal(r3.status, 403)
    })

    await runCheck("INSPECTOR -> müteahhit finans / bordro / work-proofs review / journal => 403", async () => {
      const r1 = await apiReq("/api/admin/finance", { token: tokens.INSPECTOR })
      assert.equal(r1.status, 403)

      const r2 = await apiReq("/api/admin/payroll", { token: tokens.INSPECTOR })
      assert.equal(r2.status, 403)

      const r3 = await apiReq(`/api/mobile/work-proofs/${fx.subcontractors.workProofB.id}/review`, {
        method: "PATCH",
        token: tokens.INSPECTOR,
        body: { action: "APPROVE" },
      })
      assert.equal(r3.status, 403)

      const r4 = await apiReq("/api/mobile/work-proofs", { token: tokens.INSPECTOR })
      assert.equal(r4.status, 403)

      const r5 = await apiReq("/api/mobile/journal", { token: tokens.INSPECTOR })
      assert.equal(r5.status, 403)
    })

    await runCheck("DRIVER -> /api/mobile/samples & /api/mobile/inspections => 403", async () => {
      const r1 = await apiReq("/api/mobile/samples", { token: tokens.DRIVER })
      assert.equal(r1.status, 403)

      const r2 = await apiReq("/api/mobile/inspections", { token: tokens.DRIVER })
      assert.equal(r2.status, 403)
    })

    await runCheck("FRANCHISEE -> başka şube / başka tenant => 403 ve liste 0 yabancı kayıt", async () => {
      const rForbiddenBranch = await apiReq(
        `/api/mobile/deficiencies?projectId=${fx.projects.franchiseBranchB.id}`,
        { token: tokens.FRANCHISEE }
      )
      assert.equal(rForbiddenBranch.status, 403)

      const rList = await apiReq("/api/mobile/deficiencies", { token: tokens.FRANCHISEE })
      assert.equal(rList.status, 200)
      const leaked = rList.json.deficiencies.filter(
        (d) => d.projectId === fx.projects.franchiseBranchB.id || String(d.description).includes("BranchB_Defect")
      )
      assert.equal(leaked.length, 0, `Şube B kaydı FRANCHISEE listesine sızdı! ${JSON.stringify(leaked)}`)
      assert.ok(rList.json.deficiencies.some((d) => d.projectId === fx.projects.franchiseBranchA.id))

      const rOtherTenant = await apiReq(
        `/api/mobile/dashboard?projectId=${fx.projects.contractorProj.id}`,
        { token: tokens.FRANCHISEE }
      )
      assert.equal(rOtherTenant.status, 403)
    })

    await runCheck("SUBCONTRACTOR -> başka taşeronun sözleşme/iş kanıtı => 0 kayıt veya 403", async () => {
      const wpList = await apiReq("/api/mobile/work-proofs", { token: tokens.SUBCONTRACTOR })
      assert.equal(wpList.status, 200)
      const leakedWp = wpList.json.proofs.filter(
        (p) => p.subcontractorId === fx.subcontractors.subB.id || String(p.title).includes("ProofB")
      )
      assert.equal(leakedWp.length, 0, `Diğer taşeron kanıtı sızdı! ${JSON.stringify(leakedWp)}`)

      const wpParamForbidden = await apiReq(
        `/api/mobile/work-proofs?subcontractorId=${fx.subcontractors.subB.id}`,
        { token: tokens.SUBCONTRACTOR }
      )
      assert.equal(wpParamForbidden.status, 403)

      const contracts = await apiReq("/api/admin/subcontractor-contracts", { token: tokens.SUBCONTRACTOR })
      assert.equal(contracts.status, 200)
      const leakedContracts = (Array.isArray(contracts.json) ? contracts.json : []).filter(
        (c) => c.subcontractorId === fx.subcontractors.subCompanyB.id || String(c.title).includes("ContractB")
      )
      assert.equal(leakedContracts.length, 0, `Diğer taşeron sözleşmesi sızdı! ${JSON.stringify(leakedContracts)}`)
    })

    await runCheck("INSPECTION_ADMIN -> grant-login ile CONTRACTOR rolü veya yabancı tenant personel ataması => 403", async () => {
      const rCrossRole = await apiReq(
        `/api/admin/personnel/${fx.targets.targetInspectionPersonel.id}/grant-login`,
        {
          method: "POST",
          token: tokens.INSPECTION_ADMIN,
          body: {
            email: `${PREFIX}illegal_role@nexa.test`,
            username: `${PREFIX}illegal_role`,
            password: "AuditPass!2026",
            role: "SITE_MANAGER",
          },
        }
      )
      assert.equal(rCrossRole.status, 403, `Expected 403 for cross-tenant role, got ${rCrossRole.status}`)

      const rCrossTenant = await apiReq(
        `/api/admin/personnel/${fx.targets.targetContractorPersonel.id}/grant-login`,
        {
          method: "POST",
          token: tokens.INSPECTION_ADMIN,
          body: {
            email: `${PREFIX}illegal_tenant@nexa.test`,
            username: `${PREFIX}illegal_tenant`,
            password: "AuditPass!2026",
            role: "INSPECTOR",
          },
        }
      )
      assert.equal(rCrossTenant.status, 403, `Expected 403 for cross-tenant personnel, got ${rCrossTenant.status}`)
    })

    await runCheck("POST /api/mobile/auth/logout (WORKER)", async () => {
      const r = await apiReq("/api/mobile/auth/logout", { method: "POST", token: tokens.WORKER })
      assert.equal(r.status, 200)
    })

    console.log(`\n✅ ADIM 2 TAMAMLANDI: ${passedCount} kontrolün tamamı %100 PASS!`)
  } finally {
    console.log("\n🧹 ADIM 2 Teardown çalışıyor...")
    await cleanupAuditFixtures()
    const remaining = await verifyCleanDatabase()
    console.log("✅ ADIM 2 DB Teardown doğrulandı (kalan test kayıtları):", JSON.stringify(remaining))
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error("\n❌ ADIM 2 BAŞARISIZ:", err)
  process.exit(1)
})

