/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { MapPin, ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import SmartCamera from "./_components/SmartCamera";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function FieldInspectionPage() {
  const router = useRouter();
  const [selectedYibf, setSelectedYibf] = useState<string>("");
  const { isOnline } = useNetworkStatus();

  // Mock data - gerçek API'den gelecek
  const todayTasks = [
    { id: "1", yibfNo: "2024-001", address: "Kadıköy/İstanbul", task: "Donatı Kontrolü", time: "09:00", status: "PENDING" },
    { id: "2", yibfNo: "2024-003", address: "Beşiktaş/İstanbul", task: "Beton Döküm Kontrolü", time: "11:00", status: "PENDING" },
    { id: "3", yibfNo: "2024-005", address: "Şişli/İstanbul", task: "Duvar Örüme Kontrolü", time: "14:00", status: "COMPLETED" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-safe">
      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="bg-orange-600 border-b border-orange-700 px-4 py-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Çevrimdışı moddasınız. Kayıtlar cihazda tutulacak</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Saha Kontrol</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Today's Tasks Header */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Bugünkü Görevlerim</h2>
        </div>

        {/* YİBF Selection */}
        <div className="space-y-3">
          {todayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedYibf(task.id)}
              className={`w-full p-4 rounded-xl border transition-all ${
                selectedYibf === task.id
                  ? "bg-blue-600/20 border-blue-500"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">YİBF {task.yibfNo}</span>
                    {task.status === "COMPLETED" && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-1">{task.address}</p>
                  <p className="text-slate-300 text-sm">{task.task}</p>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{task.time}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Smart Camera Component */}
        {selectedYibf && (
          <div className="mt-6">
            <SmartCamera yibfId={selectedYibf} />
          </div>
        )}
      </div>
    </div>
  );
}
