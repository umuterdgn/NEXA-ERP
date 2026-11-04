/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Yüksek Performanslı Canlı Konum Socket.io Sunucusu & Toplu Yazma (Bulk Insert)
 *
 * 500+ personelin harita üzerindeki hareketlerini veritabanını yormadan anlık aktarır.
 * Konum hareketleri bellekteki tamponda toplanır ve her 1 dakikada bir LocationHistory tablosuna
 * createMany ile toplu olarak yazılır.
 */

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { prisma } from "../prisma";

export interface LocationUpdatePayload {
  userId: string;
  lat: number;
  lng: number;
  projectId?: string;
  speed?: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number | string;
}

// Toplu Yazma (Bulk Insert) Tamponu
let locationBuffer: Array<{
  lat: number;
  lng: number;
  userId: string;
  projectId: string;
  timestamp: Date;
}> = [];

let flushIntervalTimer: any = null;
let ioInstance: SocketIOServer | null = null;

/**
 * Bellekte biriken konum verilerini LocationHistory tablosuna toplu (createMany) işler.
 */
export async function flushLocationBuffer() {
  if (locationBuffer.length === 0) return;

  const batch = [...locationBuffer];
  locationBuffer = []; // Tamponu sıfırla

  console.log(`[Socket.io Location] Toplu Yazma Başladı: ${batch.length} adet konum hareketi kaydediliyor...`);

  try {
    await prisma.locationHistory.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`[Socket.io Location] Toplu Yazma Başarılı: ${batch.length} adet LocationHistory yazıldı.`);
  } catch (error: any) {
    console.error("[Socket.io Location] Toplu yazma hatası:", error);
    // Hata durumunda verileri tekrar tamponun başına ekle (veri kaybını önleme)
    if (batch.length < 5000) {
      locationBuffer = [...batch, ...locationBuffer];
    }
  }
}

/**
 * Socket.io Sunucusunu Başlatır ve Olay Dinleyicilerini Kurar
 */
export function initLocationSocketServer(httpServer: HTTPServer) {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

  // Her 1 dakikada bir (60.000 ms) tamponu veritabanına toplu yaz
  if (!flushIntervalTimer) {
    flushIntervalTimer = setInterval(() => {
      flushLocationBuffer().catch((e) =>
        console.error("[Socket.io Location] Interval flush hatası:", e)
      );
    }, 60000); // 1 dakika
  }

  io.on("connection", (socket) => {
    console.log(`[Socket.io Location] Yeni istemci bağlandı: ${socket.id}`);

    // ADIM 2: Mobilden gelen 'updateLocation' olayını dinle
    socket.on("updateLocation", async (data: LocationUpdatePayload) => {
      try {
        const { lat, lng, userId, projectId } = data;

        if (lat === undefined || lng === undefined || !userId) {
          return;
        }

        const now = data.timestamp ? new Date(data.timestamp) : new Date();
        const targetProjectId = projectId || "PRJ-2026-A";

        // 1. İŞLEM: Haritayı izleyen yöneticilere anında yayınla (io.emit)
        io.emit("locationUpdated", {
          userId,
          lat,
          lng,
          projectId: targetProjectId,
          speed: data.speed,
          accuracy: data.accuracy,
          timestamp: now.toISOString(),
        });

        // 2. İŞLEM: Toplu yazma tamponuna ekle (LocationHistory için)
        locationBuffer.push({
          lat,
          lng,
          userId,
          projectId: targetProjectId,
          timestamp: now,
        });

        // Tampon 250 kaydı aşarsa beklemeden hemen flush et
        if (locationBuffer.length >= 250) {
          flushLocationBuffer().catch(console.error);
        }

        // Kullanıcının anlık son konumunu hafif asenkron güncelle
        prisma.user
          .update({
            where: { id: userId },
            data: {
              currentLat: lat,
              currentLng: lng,
              lastLocationUpdate: now,
            },
          })
          .catch(() => {
            // Sessizce yut veya logla
          });
      } catch (err) {
        console.error("[Socket.io] updateLocation işleme hatası:", err);
      }
    });

    // ADIM 3: Şantiye İç Haberleşme (iMessage & Telsiz) Olayları
    socket.on("sendMessage", async (data: any) => {
      try {
        const { channelId, content, audioUrl, imageUrl, senderId, senderName, senderRole } = data || {};
        if (!channelId || !senderId) return;

        let savedMsg: any;
        try {
          savedMsg = await prisma.message.create({
            data: {
              content: content || null,
              audioUrl: audioUrl || null,
              imageUrl: imageUrl || null,
              channelId,
              senderId,
            },
            include: {
              sender: {
                select: { id: true, name: true, role: true, profileImage: true },
              },
            },
          });
        } catch (dbErr: any) {
          console.warn("[Socket.io] DB Mesaj kaydı uyarısı (fallback kullanılıyor):", dbErr.message);
          savedMsg = {
            id: "msg_" + Date.now(),
            content: content || null,
            audioUrl: audioUrl || null,
            imageUrl: imageUrl || null,
            channelId,
            senderId,
            createdAt: new Date().toISOString(),
            sender: {
              id: senderId,
              name: senderName || "Personel",
              role: senderRole || "ENGINEER",
            },
          };
        }

        console.log(`[Socket.io Chat] 💬 Mesaj Yayınlandı [Kanal: ${channelId}]:`, content || (audioUrl ? "🎙️ Telsiz Ses Kaydı" : "Fotoğraf"));
        io.emit("receiveMessage", savedMsg);
      } catch (err: any) {
        console.error("[Socket.io Chat] sendMessage hatası:", err.message);
      }
    });

    socket.on("disconnect", () => {
      // Bağlantı koptu
    });
  });

  console.log("✓ Socket.io Canlı Konum Sunucusu başlatıldı.");
  return io;
}

export function getLocationSocketIO(): SocketIOServer | null {
  return ioInstance;
}
