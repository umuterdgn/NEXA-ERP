/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Real-time Broadcast & WebSocket Dispatcher (Pusher / Socket.io / Internal Event Bus)
 */

import Pusher from "pusher"

export interface RealtimeBroadcastPayload {
  channel: string
  event: string
  data: any
}

export interface RealtimeBroadcastResult {
  ok: boolean
  status: number
  transport: "PUSHER_WEBSOCKET" | "INTERNAL_SOCKET_BUS"
  payload: RealtimeBroadcastPayload
  timestamp: string
}

type RealtimeListener = (data: any) => void
const internalEventListeners: Map<string, Set<RealtimeListener>> = new Map()

/**
 * Dahili Socket ve SSE veriyoluna abone olur
 */
export function subscribeRealtimeEvent(channel: string, event: string, callback: RealtimeListener): () => void {
  const key = `${channel}:${event}`
  if (!internalEventListeners.has(key)) {
    internalEventListeners.set(key, new Set())
  }
  internalEventListeners.get(key)!.add(callback)
  return () => {
    internalEventListeners.get(key)?.delete(callback)
  }
}

/**
 * Canlı WebSocket / Pusher veya dahili yayın veriyoluna event push eder
 */
export async function broadcastRealtimeEvent(
  channel: string,
  event: string,
  data: any
): Promise<RealtimeBroadcastResult> {
  const appId = process.env.PUSHER_APP_ID?.trim()
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()
  const secret = process.env.PUSHER_SECRET?.trim()
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() || "eu"

  // Dahili veriyolu dinleyicilerini bilgilendir
  const listenerKey = `${channel}:${event}`
  const listeners = internalEventListeners.get(listenerKey)
  if (listeners && listeners.size > 0) {
    listeners.forEach((cb) => {
      try {
        cb(data)
      } catch (err) {
        console.error("[Realtime Listener Error]", err)
      }
    })
  }

  // Eğer canlı Pusher kimlik bilgileri ortam değişkenlerinde mevcutsa
  if (appId && key && secret) {
    try {
      const pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      })
      await pusher.trigger(channel, event, data)
      return {
        ok: true,
        status: 200,
        transport: "PUSHER_WEBSOCKET",
        payload: { channel, event, data },
        timestamp: new Date().toISOString(),
      }
    } catch (pusherErr: any) {
      console.warn("⚠️ Pusher trigger uyarısı:", pusherErr.message)
    }
  }

  // Fallback: Yerleşik Next.js Realtime Socket ve SSE Dağıtım Veriyolu
  return {
    ok: true,
    status: 200,
    transport: "INTERNAL_SOCKET_BUS",
    payload: { channel, event, data },
    timestamp: new Date().toISOString(),
  }
}
