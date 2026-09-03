/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle, Check, ExternalLink } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "URGENT";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "URGENT":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "ERROR":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "SUCCESS":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "URGENT":
      case "ERROR":
        return "border-red-700 bg-red-900/20";
      case "WARNING":
        return "border-orange-700 bg-orange-900/20";
      case "SUCCESS":
        return "border-green-700 bg-green-900/20";
      default:
        return "border-blue-700 bg-blue-900/20";
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true })
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  return (
    <div className="relative z-[60]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bildirimler"
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-950/30 backdrop-blur-[1px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-2 top-20 z-[100] mx-auto max-h-[calc(100vh-6rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-[70vh] sm:w-72 sm:max-w-none sm:rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Bildirimler</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="min-h-[32px] text-xs text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Tümünü Okundu İşaretle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[calc(100vh-15rem)] overflow-y-auto sm:max-h-[65vh]">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Yükleniyor...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto mb-2 h-12 w-12 text-slate-400 dark:text-slate-600" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Bildirim bulunmuyor</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                        !notification.isRead ? "bg-slate-100 dark:bg-slate-800/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg border p-2 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">{notification.title}</h4>
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="flex min-h-[28px] min-w-[28px] items-center justify-center rounded transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notification.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-500">{formatTime(notification.createdAt)}</span>
                            {notification.link && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <ExternalLink className="h-3 w-3" />
                                <span>Görüntüle</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
              <Link
                href="/admin/notifications"
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg px-3 py-2 text-center text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Tüm Bildirimleri Gör
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
