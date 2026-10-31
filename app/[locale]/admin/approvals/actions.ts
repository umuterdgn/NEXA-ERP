/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Merkezi ApprovalRequest Onaylama / Reddetme
export async function updateApprovalRequest(formData: FormData) {
  const session = await auth();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "APPROVED" | "REJECTED";
  const reviewerNote = formData.get("reviewerNote") as string | null;

  if (!id || !status) {
    throw new Error("Geçersiz talep parametresi");
  }

  const userId = session?.user?.id || "admin-system";
  const userName = session?.user?.name || "Sistem Yöneticisi";

  try {
    // 1. Talebi getir
    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!request) {
      throw new Error("Onay talebi bulunamadı");
    }

    // 2. Durumu güncelle
    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes: reviewerNote ? `${request.notes || ""}\n[İnceleme Notu]: ${reviewerNote}`.trim() : request.notes
      }
    });

    // 3. AuditLog tablosuna kayıt düş
    const actionText = status === "APPROVED" ? "onaylandı" : "reddedildi";
    await prisma.auditLog.create({
      data: {
        projectId: request.projectId,
        userId,
        userName,
        action: status === "APPROVED" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
        entityType: "ApprovalRequest",
        entityId: request.id,
        summary: `[${request.requestType}] "${request.title}" başlıklı talep ${userName} tarafından ${actionText}.`,
        newValues: {
          status,
          reviewedBy: userId,
          reviewedAt: new Date(),
          requestType: request.requestType,
          amount: request.amount
        }
      }
    });

    revalidatePath("/admin/approvals");
  } catch (error) {
    console.error("ApprovalRequest işlem hatası:", error);
    throw error;
  }
}

// İzin Onay / Ret
export async function approveLeave(formData: FormData) {
  const id = formData.get("id") as string;

  try {
    await prisma.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidatePath("/admin/approvals");
  } catch (error) {
    console.error("İzin onaylama işlemi başarısız oldu:", error);
    throw error;
  }
}

export async function rejectLeave(formData: FormData) {
  const id = formData.get("id") as string;

  try {
    await prisma.leaveRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
    revalidatePath("/admin/approvals");
  } catch (error) {
    console.error("İzin reddetme işlemi başarısız oldu:", error);
    throw error;
  }
}

// Avans Onay / Ret
export async function approveAdvance(formData: FormData) {
  const id = formData.get("id") as string;

  try {
    await prisma.personelPayment.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    revalidatePath("/admin/approvals");
  } catch (error) {
    console.error("Avans onaylama işlemi başarısız oldu:", error);
    throw error;
  }
}

export async function rejectAdvance(formData: FormData) {
  const id = formData.get("id") as string;

  try {
    await prisma.personelPayment.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    revalidatePath("/admin/approvals");
  } catch (error) {
    console.error("Avans reddetme işlemi başarısız oldu:", error);
    throw error;
  }
}
