/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Global BIM State Store & Event Bus
 * Synchronizes 3D BIM Viewer element selection and highlighting (IFC GUID / Element ID)
 */

"use client"

import { useSyncExternalStore } from "react"

export interface BimState {
  selectedElementId: string | null
  selectedElementName?: string | null
  category?: string | null
  highlightColor?: string // hex color string, default "#ef4444" (red)
  lastUpdated: number
}

let currentState: BimState = {
  selectedElementId: null,
  selectedElementName: null,
  category: null,
  highlightColor: "#ef4444",
  lastUpdated: Date.now(),
}

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export const bimStore = {
  getState: (): BimState => currentState,

  getSelectedElementId: (): string | null => currentState.selectedElementId,

  /**
   * Set the selected BIM element ID to highlight and focus in 3D viewer
   * @param elementId - BIM Element ID / IFC Guid (e.g. "COL-K-11-FL1")
   * @param options - Additional metadata (name, category, custom highlight color)
   */
  setSelectedElementId: (
    elementId: string | null,
    options?: { name?: string; category?: string; color?: string }
  ) => {
    currentState = {
      selectedElementId: elementId,
      selectedElementName: options?.name ?? null,
      category: options?.category ?? null,
      highlightColor: options?.color ?? "#ef4444", // Kırmızı vurgu
      lastUpdated: Date.now(),
    }

    emitChange()

    // Dispatch global CustomEvent for non-React or cross-frame 3D engines
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("nexa:bim:select-element", {
          detail: {
            elementId,
            name: options?.name,
            category: options?.category,
            color: options?.color ?? "#ef4444",
          },
        })
      )
    }
  },

  clearSelection: () => {
    currentState = {
      selectedElementId: null,
      selectedElementName: null,
      category: null,
      highlightColor: "#ef4444",
      lastUpdated: Date.now(),
    }
    emitChange()

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexa:bim:clear-selection"))
    }
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/**
 * React Hook for consuming the active selected BIM element ID
 */
export function useSelectedBimElement(): string | null {
  return useSyncExternalStore(
    bimStore.subscribe,
    bimStore.getSelectedElementId,
    () => null
  )
}

/**
 * React Hook for consuming full BIM state
 */
export function useBimState(): BimState {
  return useSyncExternalStore(
    bimStore.subscribe,
    bimStore.getState,
    () => ({
      selectedElementId: null,
      selectedElementName: null,
      category: null,
      highlightColor: "#ef4444",
      lastUpdated: 0,
    })
  )
}
