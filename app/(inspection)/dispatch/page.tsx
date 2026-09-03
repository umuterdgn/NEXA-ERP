/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Calendar, User, MapPin, Clock, Sparkles, CheckCircle, TrendingDown, Route, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import L from "leaflet";

// Dynamic import to avoid SSR issues with Leaflet
const GISMap = dynamic(() => import("./_components/DispatchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-800 flex items-center justify-center">
      <div className="text-white">Harita yükleniyor...</div>
    </div>
  ),
});

interface Task {
  id: string;
  yibfNo: string;
  address: string;
  taskType: string;
  status: string;
  orderIndex: number;
  coordinates: { lat: number; lng: number };
  estimatedTime: string;
}

export default function DispatchPage() {
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>("1");
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      yibfNo: "14582",
      address: "Kadıköy/İstanbul",
      taskType: "Donatı Kontrolü",
      status: "SCHEDULED",
      orderIndex: 1,
      coordinates: { lat: 40.9901, lng: 29.0292 },
      estimatedTime: "45 dk",
    },
    {
      id: "2",
      yibfNo: "14589",
      address: "Beşiktaş/İstanbul",
      taskType: "Beton Döküm",
      status: "SCHEDULED",
      orderIndex: 2,
      coordinates: { lat: 41.0422, lng: 29.0067 },
      estimatedTime: "30 dk",
    },
    {
      id: "3",
      yibfNo: "14595",
      address: "Şişli/İstanbul",
      taskType: "Duvar Örüme",
      status: "SCHEDULED",
      orderIndex: 3,
      coordinates: { lat: 41.0522, lng: 28.9944 },
      estimatedTime: "40 dk",
    },
    {
      id: "4",
      yibfNo: "14601",
      address: "Beyoğlu/İstanbul",
      taskType: "Tesisat Kontrolü",
      status: "SCHEDULED",
      orderIndex: 4,
      coordinates: { lat: 41.0315, lng: 28.9784 },
      estimatedTime: "35 dk",
    },
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    originalDistance: number;
    originalTime: string;
    optimizedDistance: number;
    optimizedTime: string;
    savedDistance: number;
  } | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const personnel = [
    { id: "1", name: "Ahmet Yılmaz", role: "Yapı Denetçi" },
    { id: "2", name: "Mehmet Demir", role: "Yapı Denetçi" },
    { id: "3", name: "Ali Kaya", role: "Yapı Denetçi" },
  ];

  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock optimization result
    const originalDistance = 118;
    const originalTime = "3 saat 15 dk";
    const optimizedDistance = 76;
    const optimizedTime = "2 saat 10 dk";
    const savedDistance = 42;

    setOptimizationResult({
      originalDistance,
      originalTime,
      optimizedDistance,
      optimizedTime,
      savedDistance,
    });

    // Reorder tasks (simulate optimization)
    const optimizedTasks = [...tasks];
    const [task2, task3] = [optimizedTasks[1], optimizedTasks[2]];
    optimizedTasks[1] = task3;
    optimizedTasks[2] = task2;
    optimizedTasks.forEach((task, index) => {
      task.orderIndex = index + 1;
    });
    setTasks(optimizedTasks);
    setShowRoute(true);

    setIsOptimizing(false);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Görev Dağıtımı ve Rota Optimizasyonu</h1>
          <p className="text-slate-400 text-sm mt-1">
            Denetçilere görev atama ve AI destekli rota planlama
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              defaultValue={getTodayDate()}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPersonnel}
              onChange={(e) => setSelectedPersonnel(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {personnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Task List */}
        <div className="w-1/3 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto">
          <div className="mb-6">
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {isOptimizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Optimize Ediliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>✨ AI Rota Optimizasyonu Çalıştır</span>
                </>
              )}
            </button>
          </div>

          {/* Optimization Result */}
          {optimizationResult && (
            <div className="mb-6 bg-green-900/30 border border-green-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-green-400">Optimizasyon Tamamlandı!</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Önceki Durum:</span>
                  <span className="text-white">{optimizationResult.originalDistance} km - {optimizationResult.originalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Yeni Durum:</span>
                  <span className="text-white">{optimizationResult.optimizedDistance} km - {optimizationResult.optimizedTime}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-700">
                  <span className="text-green-400 font-medium">Tasarruf:</span>
                  <span className="text-green-400 font-bold text-lg">{optimizationResult.savedDistance} km</span>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Route className="w-5 h-5" />
              Bugünkü Görevler
            </h2>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                        {task.orderIndex}
                      </span>
                      <div>
                        <h3 className="font-medium text-white">YİBF {task.yibfNo}</h3>
                        <p className="text-slate-400 text-xs">{task.address}</p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{task.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{task.taskType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1">
          <GISMap tasks={tasks} showRoute={showRoute} />
        </div>
      </div>
    </div>
  );
}
