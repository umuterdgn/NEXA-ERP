/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
