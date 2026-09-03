"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useEffect, useRef, useState } from "react"
import { IfcViewerAPI } from "web-ifc-viewer"
import * as THREE from "three"
// import { ARButton } from "three/examples/jsm/webxr/ARButton"
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

interface BimViewerProps {
  ifcUrl?: string
  projectId?: string
}

export default function BimViewer({ ifcUrl, projectId }: BimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<IfcViewerAPI | null>(null)
  const arButtonRef = useRef<HTMLDivElement>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelOpacity, setModelOpacity] = useState(0.8)
  const [isARSupported, setIsARSupported] = useState(false)
  const [isARActive, setIsARActive] = useState(false)
  const [isMeasurementMode, setIsMeasurementMode] = useState(false)
  const [measurementPoints, setMeasurementPoints] = useState<THREE.Vector3[]>([])
  const [measurements, setMeasurements] = useState<Array<{ pointA: THREE.Vector3, pointB: THREE.Vector3, distance: number }>>([])
  const raycasterRef = useRef<THREE.Raycaster | null>(null)
  const mouseRef = useRef<THREE.Vector2 | null>(null)
  
  // Snagging state
  const [isSnaggingMode, setIsSnaggingMode] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [selectedPinPosition, setSelectedPinPosition] = useState<THREE.Vector3 | null>(null)
  const [issueForm, setIssueForm] = useState({ title: "", description: "", imageUrl: "" })
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [pins, setPins] = useState<any[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize IFC Viewer
    const viewer = new IfcViewerAPI({
      container: containerRef.current,
      backgroundColor: new THREE.Color(0x1e293b), // Slate-900
    })

    // Setup scene
    viewer.axes.setAxes()
    viewer.grid.setGrid()

    // Enable WebXR on renderer
    const renderer = viewer.context.getRenderer()
    renderer.xr.enabled = true

    // Check WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported)
      })
    }

    // Initialize raycaster for measurement
    raycasterRef.current = new THREE.Raycaster()
    mouseRef.current = new THREE.Vector2()

    viewerRef.current = viewer

    // Load IFC model if URL is provided
    if (ifcUrl) {
      loadIfcModel(viewer, ifcUrl)
    }

    // Setup click handler for object selection
    // viewer.IFC.selector.selectionPicker.on("ifc-model-loaded", () => {
    //   console.log("IFC model loaded")
    // })

    // viewer.IFC.selector.selectionPicker.on("ifc-selection", (event: any) => {
    //   // Disable object selection when in measurement mode
    //   if (isMeasurementMode) return
    //   
    //   const expressID = event.expressID
    //   if (expressID) {
    //     const properties = viewer.IFC.getProperties(0, expressID, true)
    //     setSelectedObject(properties)
    //   }
    // })

    // Create AR button
    // if (arButtonRef.current) {
    //   const arButton = ARButton.createButton(renderer, {
    //     requiredFeatures: ['hit-test'],
    //     optionalFeatures: ['dom-overlay'],
    //     domOverlay: { root: document.body }
    //   })
    //   arButtonRef.current.appendChild(arButton)
    // }

    return () => {
      viewer.dispose()
    }
  }, [isMeasurementMode, ifcUrl])

  // Setup measurement click handler separately
  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) return

    const handleMeasurementClick = (event: MouseEvent) => {
      if (!isMeasurementMode || !containerRef.current || !raycasterRef.current || !mouseRef.current || !viewerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const scene = viewerRef.current.context.getScene()
      raycasterRef.current.setFromCamera(mouseRef.current, viewerRef.current.context.getCamera())

      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const point = intersects[0].point
        setMeasurementPoints(prev => {
          const newPoints = [...prev, point]
          
          // When we have 2 points, create a measurement
          if (newPoints.length === 2) {
            const distance = newPoints[0].distanceTo(newPoints[1])
            const distanceInMeters = distance / 1000 // Convert mm to meters (IFC default)
            setMeasurements(prev => [...prev, {
              pointA: newPoints[0],
              pointB: newPoints[1],
              distance: distanceInMeters
            }])
            return [] // Reset for next measurement
          }
          
          return newPoints
        })
      }
    }

    containerRef.current.addEventListener('click', handleMeasurementClick)

    return () => {
      containerRef.current?.removeEventListener('click', handleMeasurementClick)
    }
  }, [isMeasurementMode])

  // Setup snagging click handler
  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) return

    const handleSnaggingClick = (event: MouseEvent) => {
      if (!isSnaggingMode || !containerRef.current || !raycasterRef.current || !mouseRef.current || !viewerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const scene = viewerRef.current.context.getScene()
      raycasterRef.current.setFromCamera(mouseRef.current, viewerRef.current.context.getCamera())

      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const point = intersects[0].point
        setSelectedPinPosition(point)
        setShowIssueForm(true)
      }
    }

    containerRef.current.addEventListener('click', handleSnaggingClick)

    return () => {
      containerRef.current?.removeEventListener('click', handleSnaggingClick)
    }
  }, [isSnaggingMode])

  // Load existing BIM issues from database
  useEffect(() => {
    if (!projectId) return

    const loadIssues = async () => {
      try {
        const response = await fetch(`/api/bim-issues?projectId=${projectId}`)
        if (response.ok) {
          const issues = await response.json()
          setPins(issues)
        }
      } catch (error) {
        console.error("Failed to load BIM issues:", error)
      }
    }

    loadIssues()
  }, [projectId])

  const loadIfcModel = async (viewer: IfcViewerAPI, url: string) => {
    setLoading(true)
    setError(null)
    try {
      await viewer.IFC.loadIfcUrl(url)
    } catch (err) {
      console.error("Failed to load IFC model:", err)
      setError("IFC modeli yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  // Update model opacity
  useEffect(() => {
    if (viewerRef.current) {
      const scene = viewerRef.current.context.getScene()
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.material.transparent = true
          child.material.opacity = modelOpacity
        }
      })
    }
  }, [modelOpacity])

  // Render measurement lines and labels
  useEffect(() => {
    if (!viewerRef.current) return

    const scene = viewerRef.current.context.getScene()
    
    // Remove old measurement visualizations
    const oldMeasurements = scene.children.filter((child: any) => child.userData?.isMeasurement)
    oldMeasurements.forEach((child: any) => scene.remove(child))

    // Draw new measurements
    measurements.forEach((measurement, index) => {
      const { pointA, pointB, distance } = measurement

      // Draw line between points
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([pointA, pointB])
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      line.userData = { isMeasurement: true }
      scene.add(line)

      // Draw point markers (spheres)
      const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16)
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      
      const sphereA = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphereA.position.copy(pointA)
      sphereA.userData = { isMeasurement: true }
      scene.add(sphereA)

      const sphereB = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphereB.position.copy(pointB)
      sphereB.userData = { isMeasurement: true }
      scene.add(sphereB)
    })

    // Draw current measurement points (in progress)
    measurementPoints.forEach((point) => {
      const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16)
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.copy(point)
      sphere.userData = { isMeasurement: true }
      scene.add(sphere)
    })
  }, [measurements, measurementPoints])

  // Render snagging pins
  useEffect(() => {
    if (!viewerRef.current) return

    const scene = viewerRef.current.context.getScene()
    
    // Remove old pins
    const oldPins = scene.children.filter((child: any) => child.userData?.isPin)
    oldPins.forEach((child: any) => scene.remove(child))

    // Draw pins
    pins.forEach((pin) => {
      const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16)
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.set(pin.positionX, pin.positionY, pin.positionZ)
      sphere.userData = { isPin: true, issue: pin }
      scene.add(sphere)
    })
  }, [pins])

  const clearMeasurements = () => {
    setMeasurements([])
    setMeasurementPoints([])
  }

  return (
    <div className="relative h-full w-full">
      {/* 3D Viewer Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[600px]"
        style={{ background: "#0f172a" }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
          <div className="text-white text-lg">IFC Modeli Yükleniyor...</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      )}

      {/* Object Properties Panel */}
      {selectedObject && (
        <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Obje Bilgileri</h3>
            <button
              onClick={() => setSelectedObject(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {selectedObject.Name && (
              <div>
                <span className="text-xs text-slate-400">İsim:</span>
                <p className="text-sm text-white">{selectedObject.Name.value}</p>
              </div>
            )}

            {selectedObject.Description && (
              <div>
                <span className="text-xs text-slate-400">Açıklama:</span>
                <p className="text-sm text-white">{selectedObject.Description.value}</p>
              </div>
            )}

            {selectedObject.GlobalId && (
              <div>
                <span className="text-xs text-slate-400">Global ID:</span>
                <p className="text-sm text-white font-mono">{selectedObject.GlobalId.value}</p>
              </div>
            )}

            {selectedObject.Type && (
              <div>
                <span className="text-xs text-slate-400">Tip:</span>
                <p className="text-sm text-white">{selectedObject.Type.value}</p>
              </div>
            )}

            {/* Property Sets */}
            {selectedObject.psets && selectedObject.psets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-white mb-2">Özellik Setleri</h4>
                {selectedObject.psets.map((pset: any, idx: number) => (
                  <div key={idx} className="mb-3">
                    <span className="text-xs text-purple-400">{pset.Name.value}</span>
                    <div className="mt-1 space-y-1">
                      {pset.HasProperties?.map((prop: any, pIdx: number) => (
                        <div key={pIdx} className="flex justify-between">
                          <span className="text-xs text-slate-400">{prop.Name.value}:</span>
                          <span className="text-xs text-white">{prop.NominalValue?.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedObject && !loading && !error && (
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 px-4 py-2">
          <p className="text-sm text-slate-300">
            {isSnaggingMode
              ? "Model üzerinde kusur işaretlemek için tıklayın"
              : isMeasurementMode 
              ? "İki noktaya tıklayarak ölçüm yapın" 
              : "Model üzerindeki objeye tıklayarak detayları görüntüleyin"}
          </p>
        </div>
      )}

      {/* Issue Form Modal */}
      {showIssueForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Kusur Bildirimi</h3>
              <button
                onClick={() => {
                  setShowIssueForm(false)
                  setSelectedPinPosition(null)
                  setIssueForm({ title: "", description: "", imageUrl: "" })
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Başlık</label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Duvar çatlağı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Açıklama</label>
                <textarea
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Kusur detaylarını açıklayın..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Fotoğraf</label>
                <UploadButton<OurFileRouter, "dailyReportImage">
                  endpoint="dailyReportImage"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setIssueForm({ ...issueForm, imageUrl: res[0].url })
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Yükleme hatası: ${error.message}`)
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowIssueForm(false)
                    setSelectedPinPosition(null)
                    setIssueForm({ title: "", description: "", imageUrl: "" })
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    if (!selectedPinPosition || !projectId) return
                    
                    const response = await fetch("/api/bim-issues", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId,
                        title: issueForm.title,
                        description: issueForm.description,
                        imageUrl: issueForm.imageUrl,
                        positionX: selectedPinPosition.x,
                        positionY: selectedPinPosition.y,
                        positionZ: selectedPinPosition.z,
                        status: "OPEN"
                      })
                    })

                    if (response.ok) {
                      const newIssue = await response.json()
                      setPins(prev => [...prev, newIssue])
                      setShowIssueForm(false)
                      setSelectedPinPosition(null)
                      setIssueForm({ title: "", description: "", imageUrl: "" })
                      alert("Kusur başarıyla kaydedildi!")
                    } else {
                      alert("Kusur kaydedilirken hata oluştu")
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                  disabled={!issueForm.title || !issueForm.description}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Kusur Detayları</h3>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400">Başlık:</span>
                <p className="text-white font-medium">{selectedIssue.title}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Açıklama:</span>
                <p className="text-white">{selectedIssue.description}</p>
              </div>

              {selectedIssue.imageUrl && (
                <div>
                  <span className="text-xs text-slate-400">Fotoğraf:</span>
                  <img
                    src={selectedIssue.imageUrl}
                    alt="Kusur fotoğrafı"
                    className="mt-2 rounded-lg w-full h-48 object-cover"
                  />
                </div>
              )}

              <div>
                <span className="text-xs text-slate-400">Durum:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedIssue.status === "OPEN" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}>
                  {selectedIssue.status === "OPEN" ? "AÇIK" : "ÇÖZÜLDÜ"}
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Kapat
                </button>
                {selectedIssue.status === "OPEN" && (
                  <button
                    onClick={async () => {
                      const response = await fetch(`/api/bim-issues/${selectedIssue.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "RESOLVED" })
                      })

                      if (response.ok) {
                        setPins(prev => prev.map(p => p.id === selectedIssue.id ? { ...p, status: "RESOLVED" } : p))
                        setSelectedIssue(null)
                        alert("Kusur çözüldü olarak işaretlendi!")
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Çözüldü İşaretle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AR Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-3">
        {/* Snagging Toggle Button */}
        <button
          onClick={() => setIsSnaggingMode(!isSnaggingMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSnaggingMode
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isSnaggingMode ? "📍 Kusur İşaretleme Aktif" : "📍 Kusur İşaretle"}
        </button>

        {/* Measurement Toggle Button */}
        <button
          onClick={() => setIsMeasurementMode(!isMeasurementMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isMeasurementMode
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {isMeasurementMode ? "Ölçüm Modu Aktif" : "📏 Ölçüm Yap"}
        </button>

        {/* Clear Measurements Button */}
        {measurements.length > 0 && (
          <button
            onClick={clearMeasurements}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Ölçümleri Temizle
          </button>
        )}

        {/* AR Button Container */}
        <div ref={arButtonRef} className="flex justify-end">
          {!isARSupported && (
            <div className="bg-red-900/50 text-red-400 px-3 py-2 rounded-lg text-sm border border-red-700">
              AR Desteklenmiyor
            </div>
          )}
        </div>

        {/* Opacity Slider */}
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 p-3 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300">Model Şeffaflık</span>
            <span className="text-xs text-white font-mono">{Math.round(modelOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={modelOpacity}
            onChange={(e) => setModelOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Measurements List Overlay */}
      {measurements.length > 0 && (
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 max-w-xs max-h-[60vh] overflow-y-auto">
          <h4 className="text-sm font-semibold text-white mb-3">Ölçümler</h4>
          <div className="space-y-2">
            {measurements.map((measurement, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-800 rounded-lg p-2">
                <span className="text-xs text-slate-400">Ölçüm {index + 1}</span>
                <span className="text-sm font-mono text-green-400">{measurement.distance.toFixed(2)}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
