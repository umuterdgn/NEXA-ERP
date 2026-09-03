/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { AlertTriangle, ShieldCheck, TrendingDown, MapPin, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import L from "leaflet";

// Custom marker icons based on risk level
const createCustomIcon = (riskLevel: "HIGH" | "MEDIUM" | "LOW") => {
  const color =
    riskLevel === "HIGH"
      ? "#ef4444" // red-500
      : riskLevel === "MEDIUM"
      ? "#f97316" // orange-500
      : "#22c55e"; // green-500

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface Project {
  id: string;
  yibfNo: string;
  address: string;
  contractorName: string;
  ownerName: string;
  totalArea: number;
  floors: number;
  status: string;
  coordinates: { lat: number; lng: number };
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  healthScore: number;
  openDeficiencyCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

interface GISMapProps {
  projects: Project[];
}

export default function GISMap({ projects }: GISMapProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const highRiskProjects = projects.filter((p) => p.riskLevel === "HIGH").slice(0, 5);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "HIGH": return "text-red-400 bg-red-900/30 border-red-700";
      case "MEDIUM": return "text-orange-400 bg-orange-900/30 border-orange-700";
      case "LOW": return "text-green-400 bg-green-900/30 border-green-700";
      default: return "text-slate-400 bg-slate-900/30 border-slate-700";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="relative h-[calc(100vh-73px)]">
      {/* Map */}
      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {projects.map((project) => (
          <Marker
            key={project.id}
            position={[project.coordinates.lat, project.coordinates.lng]}
            icon={createCustomIcon(project.riskLevel)}
            eventHandlers={{
              click: () => setSelectedProject(project),
            }}
          >
            <Popup>
              <div className="bg-slate-900 text-white p-4 rounded-lg min-w-[250px]">
                <h3 className="font-bold text-lg mb-2">YİBF {project.yibfNo}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{project.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{project.contractorName}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Health Score:</span>
                    <span className={`font-bold ${getHealthScoreColor(project.healthScore)}`}>
                      {project.healthScore}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Açık Eksiklik:</span>
                    <span className="font-bold text-white">{project.openDeficiencyCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/inspection/yibf/${project.id}`)}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Projeye Git
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Risk Radar Sidebar */}
      <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-800 p-4 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-bold text-lg">Risk Radarı</h2>
        </div>

        {highRiskProjects.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Yüksek riskli proje yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {highRiskProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-white">YİBF {project.yibfNo}</h3>
                    <p className="text-slate-400 text-xs">{project.address}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(project.riskLevel)}`}>
                    YÜKSEK
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Health Score:</span>
                  <span className={`font-bold ${getHealthScoreColor(project.healthScore)}`}>
                    {project.healthScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-slate-400">Kritik: {project.criticalCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-slate-400">Yüksek: {project.highCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Risk Seviyeleri</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-400">Yüksek Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm text-slate-400">Orta Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-400">Düşük Risk</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Genel İstatistikler</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Toplam Proje:</span>
              <span className="text-white font-medium">{projects.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Yüksek Risk:</span>
              <span className="text-red-400 font-medium">{projects.filter((p) => p.riskLevel === "HIGH").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Orta Risk:</span>
              <span className="text-orange-400 font-medium">{projects.filter((p) => p.riskLevel === "MEDIUM").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Düşük Risk:</span>
              <span className="text-green-400 font-medium">{projects.filter((p) => p.riskLevel === "LOW").length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
