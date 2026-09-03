/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import L from "leaflet";

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

interface DispatchMapProps {
  tasks: Task[];
  showRoute: boolean;
}

// Custom marker icon
const createCustomIcon = (orderIndex: number) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
      ">
        ${orderIndex}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function DispatchMap({ tasks, showRoute }: DispatchMapProps) {
  // Calculate route coordinates (sorted by orderIndex)
  const routeCoordinates: [number, number][] = tasks
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((task) => [task.coordinates.lat, task.coordinates.lng]);

  return (
    <MapContainer
      center={[41.0, 29.0]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route Polyline */}
      {showRoute && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          color="#3b82f6"
          weight={4}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}

      {/* Task Markers */}
      {tasks.map((task) => (
        <Marker
          key={task.id}
          position={[task.coordinates.lat, task.coordinates.lng]}
          icon={createCustomIcon(task.orderIndex)}
        >
          <Popup>
            <div className="bg-slate-900 text-white p-4 rounded-lg min-w-[250px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  {task.orderIndex}
                </span>
                <h3 className="font-bold">YİBF {task.yibfNo}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{task.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{task.taskType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Tahmini Süre: {task.estimatedTime}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
