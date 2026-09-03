/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, ToggleLeft, ToggleRight, Check, AlertTriangle, Clock, DollarSign, FileText, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationSetting {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "new-deficiency",
      label: "Yeni Eksiklik Açıldığında",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Yeni uygunsuzluk tespit edildiğinde bildirim al",
      enabled: true,
    },
    {
      id: "control-delay",
      label: "Kontrol Geciktiğinde",
      icon: <Clock className="w-5 h-5" />,
      description: "Planlanan kontrol zamanı aşıldığında uyarı al",
      enabled: true,
    },
    {
      id: "payment-approved",
      label: "Hakediş Onaylandığında",
      icon: <DollarSign className="w-5 h-5" />,
      description: "Hakediş onaylandığında bildirim al",
      enabled: true,
    },
    {
      id: "document-uploaded",
      label: "Yeni Evrak Yüklendiğinde",
      icon: <FileText className="w-5 h-5" />,
      description: "Yapı dosyasına yeni evrak yüklendiğinde bildirim al",
      enabled: false,
    },
    {
      id: "safety-alert",
      label: "İSG Uyarılarında",
      icon: <Shield className="w-5 h-5" />,
      description: "İş güvenliği riskleri ve uyarıları için bildirim al",
      enabled: true,
    },
  ]);

  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    whatsapp: false,
  });

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const toggleChannel = (channel: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Geri Dön</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bildirim Ayarları</h1>
              <p className="text-slate-400 text-sm mt-1">
                Hangi durumlarda bildirim almak istediğinizi seçin
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Notification Triggers */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Bildirim Tetikleyicileri
          </h2>
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${setting.enabled ? "bg-blue-600/20" : "bg-slate-700"}`}>
                    <div className={setting.enabled ? "text-blue-400" : "text-slate-400"}>
                      {setting.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{setting.label}</h3>
                    <p className="text-slate-400 text-sm mt-1">{setting.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(setting.id)}
                  className="flex-shrink-0"
                >
                  {setting.enabled ? (
                    <ToggleRight className="w-6 h-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Settings */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Kanal Ayarları
          </h2>
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${channels.inApp ? "bg-blue-600/20" : "bg-slate-700"}`}>
                  <Smartphone className={`w-5 h-5 ${channels.inApp ? "text-blue-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Uygulama İçi Bildirim (Push)</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Uygulama içinde anlık bildirimler alın
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel("inApp")}
                className="flex-shrink-0"
              >
                {channels.inApp ? (
                  <ToggleRight className="w-6 h-6 text-blue-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${channels.email ? "bg-green-600/20" : "bg-slate-700"}`}>
                  <Mail className={`w-5 h-5 ${channels.email ? "text-green-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <h3 className="font-medium text-white">E-Posta</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Önemli bildirimleri e-posta olarak alın
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel("email")}
                className="flex-shrink-0"
              >
                {channels.email ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${channels.whatsapp ? "bg-green-600/20" : "bg-slate-700"}`}>
                  <MessageSquare className={`w-5 h-5 ${channels.whatsapp ? "text-green-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">WhatsApp Bildirimleri</h3>
                    <span className="px-2 py-0.5 bg-purple-600/30 text-purple-400 text-xs rounded-full border border-purple-700">
                      Beta
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    WhatsApp üzerinden anlık bildirimler alın (Demo için)
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel("whatsapp")}
                className="flex-shrink-0"
              >
                {channels.whatsapp ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Check className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Özet</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {settings.filter((s) => s.enabled).length}
              </p>
              <p className="text-slate-400 text-xs mt-1">Aktif Bildirim</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {Object.values(channels).filter((c) => c).length}
              </p>
              <p className="text-slate-400 text-xs mt-1">Aktif Kanal</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {settings.filter((s) => s.enabled).length * Object.values(channels).filter((c) => c).length}
              </p>
              <p className="text-slate-400 text-xs mt-1">Toplam Bildirim</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
            Ayarları Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
