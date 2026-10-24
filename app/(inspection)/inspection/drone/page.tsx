/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim OS - 3D BIM Web-IFC Viewer & Drone Hava Gözlem Terminali (/inspection/drone & /inspection/drone-bim)
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Box,
  Layers,
  Eye,
  Camera,
  Maximize2,
  Minimize2,
  Upload,
  RefreshCw,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Info,
  X,
  FileText,
  MapPin,
  Sparkles,
  Plane,
  Building2,
  ShieldCheck,
  Video,
  Battery,
  Wind,
  Navigation,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SelectedElementInfo {
  id: string;
  name: string;
  category: "STATIK" | "MIMARI" | "MEKANIK" | "ELEKTRIK";
  ifcType: string;
  storey: string;
  dimensions: string;
  material: string;
  status: string;
  vizeStatus: "APPROVED" | "PENDING" | "REJECTED";
}

interface DroneFlight {
  id: string;
  flightDate: string;
  pilotName: string;
  droneModel: string;
  altitudeMeters: number;
  batteryLevel: number;
  areaCoverageM2: number;
  resolutionCmPerPx: number;
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";
  videoThumbnail: string;
}

const SAMPLE_DRONE_FLIGHTS: DroneFlight[] = [
  {
    id: "FLIGHT-2026-081",
    flightDate: "Bugün, 10:45",
    pilotName: "Serkan Çelik (SHGM İHA-1)",
    droneModel: "DJI Matrice 350 RTK / Zenmuse P1",
    altitudeMeters: 65,
    batteryLevel: 88,
    areaCoverageM2: 12500,
    resolutionCmPerPx: 1.2,
    status: "COMPLETED",
    videoThumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "FLIGHT-2026-080",
    flightDate: "Dün, 15:20",
    pilotName: "Murat Acar (SHGM İHA-1)",
    droneModel: "DJI Inspire 3 / 8K Cinema",
    altitudeMeters: 90,
    batteryLevel: 94,
    areaCoverageM2: 24000,
    resolutionCmPerPx: 2.1,
    status: "COMPLETED",
    videoThumbnail: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80",
  },
];

export default function DroneBimPage() {
  const [activeModuleTab, setActiveModuleTab] = useState<"BIM" | "DRONE">("BIM");

  // Three.js Canvas Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Interactive controls
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [activeDiscipline, setActiveDiscipline] = useState<"ALL" | "STATIK" | "MIMARI" | "MEKANIK">("ALL");
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState("Nexa-Plaza-A-Blok-Statik.ifc");

  // Scene Objects Container
  const modelGroupRef = useRef<THREE.Group>(new THREE.Group());
  const statikGroupRef = useRef<THREE.Group>(new THREE.Group());
  const mimariGroupRef = useRef<THREE.Group>(new THREE.Group());
  const mekanikGroupRef = useRef<THREE.Group>(new THREE.Group());
  const rebarGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ phi: Math.PI / 4, theta: Math.PI / 4, radius: 45 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 5, 0));

  // Update Camera Orbit Position
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { phi, theta, radius } = cameraRotationRef.current;
    const target = cameraTargetRef.current;

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  }, []);

  // Build Procedural 3D BIM Model
  const buildProceduralBimModel = useCallback(() => {
    statikGroupRef.current.clear();
    mimariGroupRef.current.clear();
    mekanikGroupRef.current.clear();
    rebarGroupRef.current.clear();
    modelGroupRef.current.clear();

    const concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.65,
      metalness: 0.1,
      transparent: true,
      opacity: xrayMode ? 0.35 : 1.0,
    });

    const slabMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.15,
      transparent: true,
      opacity: xrayMode ? 0.25 : 1.0,
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.8,
      transparent: true,
      opacity: xrayMode ? 0.2 : 0.85,
    });

    const mepMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x0891b2,
      emissiveIntensity: 0.2,
    });

    const rebarMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.8,
      roughness: 0.2,
    });

    // 1. Foundation Slab
    const raftGeom = new THREE.BoxGeometry(26, 1.2, 26);
    const raftMesh = new THREE.Mesh(raftGeom, slabMaterial);
    raftMesh.position.set(0, -0.6, 0);
    raftMesh.castShadow = true;
    raftMesh.receiveShadow = true;
    raftMesh.userData = {
      id: "ELM-RAFT-01",
      name: "Radye Temel (H=120cm)",
      category: "STATIK",
      ifcType: "IfcSlab / BASESLAB",
      storey: "Temel Kotu (-3.00)",
      dimensions: "26.0m x 26.0m x 1.2m (C35/45)",
      material: "C35/45 Hazır Beton / B420C Çelik",
      status: "Döküm Tamamlandı, Vize Onaylı",
      vizeStatus: "APPROVED",
    };
    statikGroupRef.current.add(raftMesh);

    // 2. Multi-Storey Columns & Slabs
    const stories = 3;
    const storyHeight = 4.0;
    const gridSpacing = 6;
    const colSize = 0.7;

    for (let s = 0; s < stories; s++) {
      const yBase = s * storyHeight;

      // Slab for each floor
      const slabGeom = new THREE.BoxGeometry(24, 0.4, 24);
      const floorSlab = new THREE.Mesh(slabGeom, slabMaterial);
      floorSlab.position.set(0, yBase + storyHeight, 0);
      floorSlab.castShadow = true;
      floorSlab.receiveShadow = true;
      floorSlab.userData = {
        id: `ELM-SLAB-L${s + 1}`,
        name: `${s + 1}. Kat Kaset Döşeme`,
        category: "STATIK",
        ifcType: "IfcSlab / FLOOR",
        storey: `${s + 1}. Normal Kat`,
        dimensions: "24.0m x 24.0m x 0.4m",
        material: "C35/45 Betonarme",
        status: s === 0 ? "Vize Verildi" : "Kalıp Aşamasında",
        vizeStatus: s === 0 ? "APPROVED" : "PENDING",
      };
      statikGroupRef.current.add(floorSlab);

      // Columns Grid (4x4)
      for (let x = -9; x <= 9; x += gridSpacing) {
        for (let z = -9; z <= 9; z += gridSpacing) {
          const colGeom = new THREE.BoxGeometry(colSize, storyHeight, colSize);
          const colMesh = new THREE.Mesh(colGeom, concreteMaterial);
          colMesh.position.set(x, yBase + storyHeight / 2, z);
          colMesh.castShadow = true;
          colMesh.receiveShadow = true;
          colMesh.userData = {
            id: `ELM-COL-L${s + 1}-(${x},${z})`,
            name: `Taşıyıcı Kolon S${Math.abs(x) + Math.abs(z) + 1}`,
            category: "STATIK",
            ifcType: "IfcColumn",
            storey: `${s + 1}. Kat`,
            dimensions: `${colSize * 100}cm x ${colSize * 100}cm x ${storyHeight}m`,
            material: "C35/45 Hazır Beton / Φ20 Donatı",
            status: s === 0 ? "Demir Donatı Vizesi Tamam" : "Donatı Bağlanıyor",
            vizeStatus: s === 0 ? "APPROVED" : "PENDING",
          };
          statikGroupRef.current.add(colMesh);

          // Internal Rebar visualization (Visible in X-Ray)
          if (xrayMode) {
            const rebarGeom = new THREE.CylinderGeometry(0.04, 0.04, storyHeight - 0.2, 6);
            for (let ro = -0.22; ro <= 0.22; ro += 0.44) {
              for (let rz = -0.22; rz <= 0.22; rz += 0.44) {
                const rebarMesh = new THREE.Mesh(rebarGeom, rebarMaterial);
                rebarMesh.position.set(x + ro, yBase + storyHeight / 2, z + rz);
                rebarGroupRef.current.add(rebarMesh);
              }
            }
          }
        }
      }

      // Exterior Architectural Walls
      const wallGeomX = new THREE.BoxGeometry(23.8, storyHeight - 0.4, 0.25);
      const wallMesh1 = new THREE.Mesh(wallGeomX, wallMaterial);
      wallMesh1.position.set(0, yBase + storyHeight / 2, 11.9);
      mimariGroupRef.current.add(wallMesh1);

      // MEP Piping (Air conditioning & plumbing)
      const pipeGeom = new THREE.CylinderGeometry(0.18, 0.18, 22, 12);
      const pipeMesh = new THREE.Mesh(pipeGeom, mepMaterial);
      pipeMesh.rotation.z = Math.PI / 2;
      pipeMesh.position.set(0, yBase + storyHeight - 0.5, 3);
      pipeMesh.userData = {
        id: `ELM-MEP-PIPE-L${s + 1}`,
        name: `Yangın Sprinkler & Temiz Su Hattı`,
        category: "MEKANIK",
        ifcType: "IfcPipeSegment",
        storey: `${s + 1}. Kat Asma Tavan`,
        dimensions: "DN150 Galvaniz Çelik Boru",
        material: "Sismik Askılı Çelik Hat",
        status: "Sızdırmazlık Testi Başarılı",
        vizeStatus: "APPROVED",
      };
      mekanikGroupRef.current.add(pipeMesh);
    }

    modelGroupRef.current.add(statikGroupRef.current);
    modelGroupRef.current.add(mimariGroupRef.current);
    modelGroupRef.current.add(mekanikGroupRef.current);
    if (xrayMode) {
      modelGroupRef.current.add(rebarGroupRef.current);
    }
  }, [xrayMode]);

  // Discipline Filter Visibility
  useEffect(() => {
    if (activeDiscipline === "ALL") {
      statikGroupRef.current.visible = true;
      mimariGroupRef.current.visible = true;
      mekanikGroupRef.current.visible = true;
    } else if (activeDiscipline === "STATIK") {
      statikGroupRef.current.visible = true;
      mimariGroupRef.current.visible = false;
      mekanikGroupRef.current.visible = false;
    } else if (activeDiscipline === "MIMARI") {
      statikGroupRef.current.visible = false;
      mimariGroupRef.current.visible = true;
      mekanikGroupRef.current.visible = false;
    } else if (activeDiscipline === "MEKANIK") {
      statikGroupRef.current.visible = false;
      mimariGroupRef.current.visible = false;
      mekanikGroupRef.current.visible = true;
    }
  }, [activeDiscipline]);

  // Three.js Initialization
  useEffect(() => {
    if (activeModuleTab !== "BIM") return;
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // slate-950
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    canvasRef.current.innerHTML = "";
    canvasRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(30, 50, 30);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-30, 20, -30);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(60, 60, 0x1e293b, 0x0f172a);
    grid.position.y = -1.2;
    scene.add(grid);

    // Build Model
    buildProceduralBimModel();
    scene.add(modelGroupRef.current);

    // Animation Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
    };
  }, [activeModuleTab, buildProceduralBimModel, updateCameraPosition]);

  // Mouse Controls (Rotate & Zoom)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraRotationRef.current.theta -= deltaX * 0.008;
    cameraRotationRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.phi - deltaY * 0.008)
    );

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraRotationRef.current.radius = Math.max(
      15,
      Math.min(90, cameraRotationRef.current.radius + e.deltaY * 0.04)
    );
    updateCameraPosition();
  };

  // Raycasting for Element Selection
  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(modelGroupRef.current.children, true);

    if (intersects.length > 0) {
      const topMesh = intersects[0].object as THREE.Mesh;
      if (topMesh.userData?.id) {
        setSelectedElement(topMesh.userData as SelectedElementInfo);
        toast.success(`Eleman Seçildi: ${topMesh.userData.name}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              YAPI DENETİM & İLERİ TEKNOLOJİ
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-400 text-xs font-mono">WEB-IFC & İHA SİSTEMİ</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Box className="w-6 h-6 text-blue-400" />
            3D BIM Web-IFC Viewer & Drone Hava Gözlemi
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            4708 yapı denetim projelerini 3 boyutlu statik model üzerinde denetleyin, İHA uçuş kayıtlarını ve ortofoto haritalarını inceleyin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveModuleTab("BIM")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeModuleTab === "BIM"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D BIM Web-IFC</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModuleTab("DRONE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeModuleTab === "DRONE"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>İHA & Drone Gözlem</span>
          </button>
        </div>
      </div>

      {activeModuleTab === "BIM" ? (
        /* BIM 3D Viewer Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main 3D Canvas Container (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium mr-1">Disiplin:</span>
                {(["ALL", "STATIK", "MIMARI", "MEKANIK"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDiscipline(d)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      activeDiscipline === d
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setXrayMode(!xrayMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    xrayMode
                      ? "bg-purple-600/20 text-purple-300 border-purple-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>{xrayMode ? "X-Ray: Aktif (Donatı Açık)" : "X-Ray Modu"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cameraRotationRef.current = { phi: Math.PI / 4, theta: Math.PI / 4, radius: 45 };
                    updateCameraPosition();
                    toast.success("Kamera açısı sıfırlandı.");
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Açıyı Sıfırla"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3D WebGL Canvas */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl h-[540px]">
              <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleClick}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />

              {/* HUD Overlay Stats */}
              <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] font-mono space-y-1 pointer-events-none">
                <div className="text-blue-400 font-bold">{loadedFileName}</div>
                <div className="text-slate-400">FPS: 60 | Çizilen Eleman: 184</div>
                <div className="text-slate-500">Çevirmek: Sol Tık + Sürükle | Yakınlaş: Tekerlek</div>
              </div>

              {/* Vize / Status Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 p-2 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-300">C35/45 Betonarme</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Mimari Duvar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Mekanik Sprinkler</span>
                </div>
                {xrayMode && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-red-300">İç Donatı (B420C)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Element Inspector & Vize Decision (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Yapı Elemanı Özellikleri (IFC)</span>
                </div>
                {selectedElement && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedElement.ifcType}
                  </span>
                )}
              </div>

              {selectedElement ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Eleman Adı & Kod</div>
                    <div className="text-sm font-bold text-white mt-0.5">{selectedElement.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{selectedElement.id}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bulunduğu Kat:</span>
                      <span className="text-slate-200 font-medium">{selectedElement.storey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Boyutlar / Kesit:</span>
                      <span className="text-slate-200 font-mono">{selectedElement.dimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Malzeme Kalitesi:</span>
                      <span className="text-slate-200">{selectedElement.material}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Vize Durumu:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          selectedElement.vizeStatus === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {selectedElement.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        toast.success(`Eleman Vizesi Onaylandı: [${selectedElement.name}] beton dökümüne uygundur.`)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bu Elemana Kalıp / Donatı Vizesi Ver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toast.error(`Kusur Bildirildi: [${selectedElement.name}] için şantiye şefine DÖF açıldı.`)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Kusurlu İşaretle (DÖF Bildir)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <Box className="w-8 h-8 mx-auto text-slate-600" />
                  <div>Model üzerinden herhangi bir kolon, döşeme veya boruya tıklayarak parametrelerini inceleyin.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Drone & Aerial Workspace */
        <div className="space-y-6">
          {/* Drone Flights List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_DRONE_FLIGHTS.map((flight) => (
              <div
                key={flight.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{flight.id}</div>
                      <div className="text-[11px] text-slate-400">{flight.flightDate}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {flight.status}
                  </span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 group">
                  <img
                    src={flight.videoThumbnail}
                    alt="Drone Footages"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      <span>4K Hava Gözlem & Fotogrametri Kaydı</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Uçuş İrtifası</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{flight.altitudeMeters} m</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Taranan Alan</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{(flight.areaCoverageM2 / 1000).toFixed(1)}k m²</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Piksel Hassasiyeti</div>
                    <div className="font-semibold text-emerald-400 font-mono mt-0.5">{flight.resolutionCmPerPx} cm/px</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-mono">Pilot: {flight.pilotName}</span>
                  <button
                    type="button"
                    onClick={() => toast.success("Ortofoto haritası ve nokta bulutu CBS katmanına aktarıldı.")}
                    className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Haritaya Eşitle</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
