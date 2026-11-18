"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * High-DPI Interactive 2D CAD Vector Viewport (DWG / DXF / Vector PDF)
 * Features:
 * - Instant 60fps HTML5 Canvas rendering of real AutoCAD/PDF vectors in metric coordinates
 * - Auto-Zoom Extents on mount (never blank or black)
 * - Smooth cursor-centered wheel zoom & click-drag pan
 * - Real-time metric coordinates (meters) & 2-point metric ruler
 * - Real AutoCAD Layer Manager (toggle individual layers on/off)
 * - Dark CAD vs White Blueprint paper toggle
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Ruler,
  Layers,
  Sun,
  Moon,
  RotateCcw,
} from "lucide-react"
import type { CadExtractionResult } from "@/lib/cad-metric-extractor"

interface Interactive2DCadCanvasProps {
  data: CadExtractionResult
}

export default function Interactive2DCadCanvas({ data }: Interactive2DCadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isWhiteBg, setIsWhiteBg] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(true)
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    ;(data.layers || []).forEach((l) => {
      map[l.name] = true
    })
    return map
  })

  // View transform: world (meters) -> screen (px)
  // screenX = canvasW/2 + (worldX + panX) * scale
  // screenY = canvasH/2 - (worldY + panY) * scale
  const viewRef = useRef({ scale: 12, panX: 0, panY: 0 })
  const [zoomPercent, setZoomPercent] = useState(100)
  const baseScaleRef = useRef(12)

  // Panning state
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origPanX: number; origPanY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
  })

  // Cursor metric readout
  const [cursorMeters, setCursorMeters] = useState<{ x: number; y: number } | null>(null)

  // 2-point metric measurement tool
  const [measureMode, setMeasureMode] = useState(false)
  const [measurePts, setMeasurePts] = useState<Array<{ x: number; y: number }>>([])

  const measuredDistM = useMemo(() => {
    if (measurePts.length < 2) return null
    const dx = measurePts[1].x - measurePts[0].x
    const dy = measurePts[1].y - measurePts[0].y
    return Math.hypot(dx, dy)
  }, [measurePts])

  // Keep visibleLayers synced when new data arrives
  useEffect(() => {
    const map: Record<string, boolean> = {}
    ;(data.layers || []).forEach((l) => {
      map[l.name] = true
    })
    setVisibleLayers(map)
  }, [data])

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = container.getBoundingClientRect()
    const w = Math.max(300, Math.floor(rect.width))
    const h = Math.max(300, Math.floor(rect.height))

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.scale(dpr, dpr)

    // 1. Background
    ctx.fillStyle = isWhiteBg ? "#f8fafc" : "#0a0f1e"
    ctx.fillRect(0, 0, w, h)

    const { scale, panX, panY } = viewRef.current
    const toScreenX = (wx: number) => w / 2 + (wx + panX) * scale
    const toScreenY = (wy: number) => h / 2 - (wy + panY) * scale

    // 2. Adaptive Metric Grid
    const targetGridPx = 70
    const rawStepM = targetGridPx / Math.max(0.001, scale)
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawStepM)))
    const norm = rawStepM / pow10
    const gridStepM = (norm < 2 ? 1 : norm < 5 ? 2 : 5) * pow10

    const worldLeft = -w / 2 / scale - panX
    const worldRight = w / 2 / scale - panX
    const worldBottom = -h / 2 / scale - panY
    const worldTop = h / 2 / scale - panY

    const startGx = Math.floor(worldLeft / gridStepM) * gridStepM
    const startGy = Math.floor(worldBottom / gridStepM) * gridStepM

    ctx.lineWidth = 1
    ctx.strokeStyle = isWhiteBg ? "rgba(148,163,184,0.28)" : "rgba(51,65,85,0.4)"
    ctx.beginPath()
    for (let gx = startGx; gx <= worldRight; gx += gridStepM) {
      const sx = Math.round(toScreenX(gx)) + 0.5
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
    }
    for (let gy = startGy; gy <= worldTop; gy += gridStepM) {
      const sy = Math.round(toScreenY(gy)) + 0.5
      ctx.moveTo(0, sy)
      ctx.lineTo(w, sy)
    }
    ctx.stroke()

    // Origin crosshairs (0,0)
    ctx.strokeStyle = isWhiteBg ? "rgba(37,99,235,0.35)" : "rgba(56,189,248,0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    const ox = toScreenX(0)
    const oy = toScreenY(0)
    ctx.moveTo(ox, 0)
    ctx.lineTo(ox, h)
    ctx.moveTo(0, oy)
    ctx.lineTo(w, oy)
    ctx.stroke()

    // 3. Draw CAD Lines grouped by color for maximum performance
    const byColor = new Map<string, typeof data.vectors2D.lines>()
    for (const line of data.vectors2D.lines || []) {
      if (visibleLayers[line.layer] === false) continue
      let strokeColor = line.color || "#e2e8f0"
      if (isWhiteBg && (strokeColor === "#e2e8f0" || strokeColor === "#cbd5e1")) {
        strokeColor = "#1e293b"
      }
      const arr = byColor.get(strokeColor)
      if (arr) arr.push(line)
      else byColor.set(strokeColor, [line])
    }

    ctx.lineCap = "round"
    for (const [color, segs] of byColor.entries()) {
      ctx.strokeStyle = color
      ctx.lineWidth = color === "#f97316" || color === "#3b82f6" ? 1.8 : 1.15
      ctx.beginPath()
      for (const s of segs) {
        ctx.moveTo(toScreenX(s.x1), toScreenY(s.y1))
        ctx.lineTo(toScreenX(s.x2), toScreenY(s.y2))
      }
      ctx.stroke()
    }

    // 4. Draw Circles
    for (const c of data.vectors2D.circles || []) {
      if (visibleLayers[c.layer] === false) continue
      const rPx = Math.max(1.5, c.r * scale)
      ctx.strokeStyle = isWhiteBg && c.color === "#e2e8f0" ? "#1e293b" : c.color
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(toScreenX(c.cx), toScreenY(c.cy), rPx, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 5. Draw Arcs
    for (const a of data.vectors2D.arcs || []) {
      if (visibleLayers[a.layer] === false) continue
      const rPx = Math.max(1.5, a.r * scale)
      ctx.strokeStyle = isWhiteBg && a.color === "#e2e8f0" ? "#1e293b" : a.color
      ctx.lineWidth = 1.2
      ctx.beginPath()
      // Flip Y axis for CAD CCW arcs on screen canvas
      ctx.arc(toScreenX(a.cx), toScreenY(a.cy), rPx, -a.endAngle, -a.startAngle)
      ctx.stroke()
    }

    // 6. Draw Texts (when zoomed enough to be legible)
    if (scale > 4) {
      ctx.font = "600 11px ui-monospace, SFMono-Regular, monospace"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      for (const t of data.vectors2D.texts || []) {
        if (visibleLayers[t.layer] === false) continue
        ctx.fillStyle = isWhiteBg ? "#0f172a" : "#cbd5e1"
        ctx.fillText(t.text.slice(0, 36), toScreenX(t.x), toScreenY(t.y))
      }
    }

    // 7. Draw Active Measurement Ruler
    if (measurePts.length > 0) {
      ctx.strokeStyle = "#22d3ee"
      ctx.fillStyle = "#22d3ee"
      ctx.lineWidth = 2
      for (const p of measurePts) {
        ctx.beginPath()
        ctx.arc(toScreenX(p.x), toScreenY(p.y), 5, 0, Math.PI * 2)
        ctx.fill()
      }
      if (measurePts.length === 2) {
        const ax = toScreenX(measurePts[0].x)
        const ay = toScreenY(measurePts[0].y)
        const bx = toScreenX(measurePts[1].x)
        const by = toScreenY(measurePts[1].y)
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.setLineDash([])

        const dist = Math.hypot(
          measurePts[1].x - measurePts[0].x,
          measurePts[1].y - measurePts[0].y
        )
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2 - 12
        const label = `${dist.toFixed(2)} m`
        ctx.font = "bold 12px ui-monospace, monospace"
        const tw = ctx.measureText(label).width + 14
        ctx.fillStyle = "rgba(15,23,42,0.92)"
        ctx.fillRect(mx - tw / 2, my - 11, tw, 22)
        ctx.strokeStyle = "#22d3ee"
        ctx.lineWidth = 1
        ctx.strokeRect(mx - tw / 2, my - 11, tw, 22)
        ctx.fillStyle = "#22d3ee"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(label, mx, my)
      }
    }

    // 8. Scale Bar (Bottom-Left)
    const barPx = gridStepM * scale
    if (barPx > 25 && barPx < 240) {
      const bx = 18
      const by = h - 18
      ctx.strokeStyle = isWhiteBg ? "#0f172a" : "#94a3b8"
      ctx.fillStyle = isWhiteBg ? "#0f172a" : "#cbd5e1"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx, by - 5)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx + barPx, by)
      ctx.lineTo(bx + barPx, by - 5)
      ctx.stroke()
      ctx.font = "600 11px ui-monospace, monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${gridStepM >= 1 ? gridStepM.toFixed(0) : gridStepM.toFixed(2)} m`, bx + barPx / 2, by - 6)
    }

    ctx.restore()
  }, [data, isWhiteBg, visibleLayers, measurePts])

  const fitToExtents = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const w = Math.max(300, rect.width)
    const h = Math.max(300, rect.height)

    const spanX = Math.max(1, data.metrics.widthM || 10)
    const spanY = Math.max(1, data.metrics.heightM || 10)
    const fitScale = Math.min((w * 0.84) / spanX, (h * 0.82) / spanY)

    baseScaleRef.current = fitScale
    viewRef.current = { scale: fitScale, panX: 0, panY: 0 }
    setZoomPercent(100)
    drawScene()
  }, [data.metrics.widthM, data.metrics.heightM, drawScene])

  // Auto-fit on mount & resize
  useEffect(() => {
    const t = setTimeout(fitToExtents, 40)
    const onResize = () => drawScene()
    window.addEventListener("resize", onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", onResize)
    }
  }, [fitToExtents, drawScene])

  useEffect(() => {
    drawScene()
  }, [drawScene])

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const { scale, panX, panY } = viewRef.current
    return {
      x: (sx - rect.width / 2) / scale - panX,
      y: -(sy - rect.height / 2) / scale - panY,
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const { scale, panX, panY } = viewRef.current
    const worldBeforeX = (mx - rect.width / 2) / scale - panX
    const worldBeforeY = -(my - rect.height / 2) / scale - panY

    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18
    const nextScale = Math.min(Math.max(scale * factor, baseScaleRef.current * 0.1), baseScaleRef.current * 40)

    const nextPanX = (mx - rect.width / 2) / nextScale - worldBeforeX
    const nextPanY = -(my - rect.height / 2) / nextScale - worldBeforeY

    viewRef.current = { scale: nextScale, panX: nextPanX, panY: nextPanY }
    setZoomPercent(Math.round((nextScale / Math.max(0.001, baseScaleRef.current)) * 100))
    drawScene()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (measureMode) {
      const pt = screenToWorld(e.clientX, e.clientY)
      setMeasurePts((prev) => (prev.length >= 2 ? [pt] : [...prev, pt]))
      return
    }
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: viewRef.current.panX,
      origPanY: viewRef.current.panY,
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCursorMeters(screenToWorld(e.clientX, e.clientY))
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    viewRef.current.panX = dragRef.current.origPanX + dx / viewRef.current.scale
    viewRef.current.panY = dragRef.current.origPanY - dy / viewRef.current.scale
    drawScene()
  }

  const handleMouseUp = () => {
    dragRef.current.active = false
  }

  const zoomBy = (factor: number) => {
    const nextScale = Math.min(
      Math.max(viewRef.current.scale * factor, baseScaleRef.current * 0.1),
      baseScaleRef.current * 40
    )
    viewRef.current.scale = nextScale
    setZoomPercent(Math.round((nextScale / Math.max(0.001, baseScaleRef.current)) * 100))
    drawScene()
  }

  const toggleLayer = (name: string) => {
    setVisibleLayers((prev) => ({ ...prev, [name]: prev[name] === false }))
  }

  return (
    <div className="flex flex-col w-full h-full min-h-[480px] bg-slate-950 overflow-hidden">
      {/* Compact Non-Overlapping CAD Sub-Toolbar */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Uzaklaş"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-200 min-w-[46px] text-center">%{zoomPercent}</span>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Yakınlaş"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={fitToExtents}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
            title="Çizimi Ekrana Sığdır"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Ekrana Sığdır</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={() => {
              setMeasureMode((v) => !v)
              setMeasurePts([])
            }}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 whitespace-nowrap border transition-colors cursor-pointer ${
              measureMode
                ? "bg-cyan-600 text-white border-cyan-400"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
            title="İki nokta arası gerçek metrik mesafe ölç"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{measureMode ? "Ölçüm Açık" : "Metrik Cetvel"}</span>
          </button>

          {measurePts.length > 0 && (
            <button
              type="button"
              onClick={() => setMeasurePts([])}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
              title="Ölçümü Temizle"
            >
              <RotateCcw className="w-3 h-3" />
              {measuredDistM !== null && (
                <span className="font-mono font-bold text-cyan-300">{measuredDistM.toFixed(2)} m</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsWhiteBg((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 whitespace-nowrap cursor-pointer"
            title="Koyu CAD / Beyaz Pafta Arka Planı"
          >
            {isWhiteBg ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isWhiteBg ? "Koyu CAD" : "Beyaz Pafta"}</span>
          </button>
        </div>

        {/* Real Metric Readout + Layer Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
            <span className="text-cyan-400 font-bold">
              {data.metrics.widthM.toFixed(1)}m × {data.metrics.heightM.toFixed(1)}m
            </span>
            <span className="text-slate-600">|</span>
            <span>{data.metrics.footprintAreaM2.toFixed(0)} m²</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300">{data.metrics.totalEntities} Obje</span>
          </div>

          <button
            type="button"
            onClick={() => setShowLayerPanel((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap border transition-colors cursor-pointer ${
              showLayerPanel
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katmanlar ({data.layers.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Area: Canvas + Optional Docked Layer Sidebar (Zero Overlap!) */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        <div ref={containerRef} className="flex-1 min-w-0 h-full relative overflow-hidden">
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={fitToExtents}
            className={`block w-full h-full ${
              measureMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
            }`}
          />

          {/* Compact Non-Intrusive Coordinate HUD (Bottom-Right) */}
          {cursorMeters && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-slate-200 pointer-events-none shadow-lg">
              X: <span className="text-cyan-400">{cursorMeters.x.toFixed(2)} m</span> &nbsp;
              Y: <span className="text-amber-400">{cursorMeters.y.toFixed(2)} m</span>
            </div>
          )}
        </div>

        {/* Docked CAD Layer Manager */}
        {showLayerPanel && data.layers.length > 0 && (
          <div className="w-60 shrink-0 bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                CAD Katmanları
              </span>
              <span className="text-[10px] font-mono text-slate-400">{data.metrics.unitLabel}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {data.layers.map((layer) => {
                const isOn = visibleLayers[layer.name] !== false
                return (
                  <button
                    key={layer.name}
                    type="button"
                    onClick={() => toggleLayer(layer.name)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isOn
                        ? "bg-slate-800/80 border-slate-700 text-slate-100"
                        : "bg-slate-950/50 border-slate-800/50 text-slate-500 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-xs font-medium truncate" title={layer.name}>
                        {layer.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{layer.count}</span>
                  </button>
                )
              })}
            </div>
            <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-[10.5px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Duvar Uzunluğu:</span>
                <span className="font-mono text-amber-300">{data.metrics.totalWallLengthM.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between">
                <span>3D Eleman Adayı:</span>
                <span className="font-mono text-cyan-300">{data.metrics.extracted3DCount} adet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

