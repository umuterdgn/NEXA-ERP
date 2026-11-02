/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Arka Plan Canlı Konum Socket.io İstemcisi
 *
 * 500+ personel sahadayken HTTP istekleri yerine doğrudan WebSocket üzerinden
 * socket.emit('updateLocation', ...) ile koordinatları akıtır.
 */

import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../lib/api";

export interface SocketLocationPayload {
  userId: string;
  lat: number;
  lng: number;
  projectId?: string;
  speed?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  timestamp?: number;
}

class LocationSocketClient {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  private getSocketUrl(): string {
    // API_BASE_URL: http://10.0.2.2:3000/api -> http://10.0.2.2:3000
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }

  /**
   * Socket.io bağlantısını açar veya mevcut olanı döner
   */
  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true;
      const url = this.getSocketUrl();

      console.log(`[LocationSocket] Bağlantı kuruluyor: ${url}`);
      this.socket = io(url, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      this.socket.on("connect", () => {
        console.log(`[LocationSocket] WebSocket bağlandı (ID: ${this.socket?.id})`);
        this.isConnecting = false;
      });

      this.socket.on("connect_error", (err) => {
        console.warn(`[LocationSocket] Bağlantı uyarısı:`, err.message);
        this.isConnecting = false;
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[LocationSocket] Bağlantı kesildi: ${reason}`);
      });
    }

    return this.socket!;
  }

  /**
   * ADIM 2: socket.emit('updateLocation', { lat, lng, userId })
   */
  public emitLocation(payload: SocketLocationPayload): boolean {
    try {
      const s = this.connect();

      if (s && s.connected) {
        s.emit("updateLocation", payload);
        console.log(
          `[LocationSocket] 🛰️ Canlı konum Socket.io ile iletildi: ${payload.lat.toFixed(
            5
          )}, ${payload.lng.toFixed(5)}`
        );
        return true;
      } else {
        // Socket henüz bağlanmamışsa emit kuyruğu veya tek seferlik emit
        s.emit("updateLocation", payload);
        return true;
      }
    } catch (err) {
      console.warn("[LocationSocket] emitLocation hatası:", err);
      return false;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const locationSocket = new LocationSocketClient();
