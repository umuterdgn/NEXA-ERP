/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Next.js & Socket.io Custom Server
 *
 * 500+ personel için gerçek zamanlı konum akışı (Socket.io) ve
 * 1 dakikalık toplu veritabanı yazma (LocationHistory bulk insert) motoru.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Toplu Yazma (Bulk Insert) Tamponu
let locationBuffer = [];

async function flushLocationBuffer() {
  if (locationBuffer.length === 0) return;

  const batch = [...locationBuffer];
  locationBuffer = [];

  console.log(`[Socket.io Server] ⏳ Toplu Yazma: ${batch.length} adet konum kaydediliyor...`);

  try {
    await prisma.locationHistory.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`[Socket.io Server] ✅ Toplu Yazma Başarılı: ${batch.length} konum LocationHistory tablosuna işlendi.`);
  } catch (error) {
    console.error("[Socket.io Server] Toplu yazma hatası:", error.message || error);
    if (batch.length < 5000) {
      locationBuffer = [...batch, ...locationBuffer];
    }
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("HTTP Request Error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Socket.io Sunucu Entegrasyonu
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Her 1 dakikada bir (60 saniye) tamponu veritabanına toplu yaz
  setInterval(() => {
    flushLocationBuffer().catch(console.error);
  }, 60000);

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Mobil / Web İstemci Bağlandı: ${socket.id}`);

    // ADIM 2: Mobilden gelen 'updateLocation' olayını dinle
    socket.on("updateLocation", async (data) => {
      try {
        const { lat, lng, userId, projectId } = data || {};

        if (lat === undefined || lng === undefined || !userId) {
          return;
        }

        const now = data.timestamp ? new Date(data.timestamp) : new Date();
        const targetProjectId = projectId || "PRJ-2026-A";

        // 1. İŞLEM: Haritayı izleyen yöneticilere anında yayınla
        io.emit("locationUpdated", {
          userId,
          lat,
          lng,
          projectId: targetProjectId,
          speed: data.speed,
          accuracy: data.accuracy,
          timestamp: now.toISOString(),
        });

        // 2. İŞLEM: Toplu yazma tamponuna ekle
        locationBuffer.push({
          lat,
          lng,
          userId,
          projectId: targetProjectId,
          timestamp: now,
        });

        if (locationBuffer.length >= 200) {
          flushLocationBuffer().catch(console.error);
        }

        // Anlık son konumu User tablosuna yaz
        prisma.user
          .update({
            where: { id: userId },
            data: {
              currentLat: lat,
              currentLng: lng,
              lastLocationUpdate: now,
            },
          })
          .catch(() => {});
      } catch (e) {
        console.warn("[Socket.io] updateLocation hatası:", e.message);
      }
    });

    socket.on("disconnect", () => {
      // Disconnect
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} with Socket.io Real-Time Engine`);
  });
});
