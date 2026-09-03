/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server";

import { prisma } from "@/lib/prisma";

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "URGENT";
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Notification creation error:", error);
    return { success: false, error: "Bildirim oluşturma hatası" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Notification update error:", error);
    return { success: false, error: "Bildirim güncelleme hatası" };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Bulk notification update error:", error);
    return { success: false, error: "Toplu bildirim güncelleme hatası" };
  }
}

export async function getUserNotifications(userId: string, unreadOnly: boolean = false) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error("Notification fetch error:", error);
    return { success: false, error: "Bildirim çekme hatası", notifications: [] };
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Notification count error:", error);
    return { success: false, error: "Bildirim sayısı hatası", count: 0 };
  }
}
