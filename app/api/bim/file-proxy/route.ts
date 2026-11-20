import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function inferContentType(urlOrPath: string, upstreamType?: string | null): string {
  const clean = urlOrPath.split("?")[0].split("#")[0].toLowerCase();
  if (clean.endsWith(".glb")) return "model/gltf-binary";
  if (clean.endsWith(".gltf")) return "model/gltf+json";
  if (clean.endsWith(".ifc")) return "application/x-step";
  if (clean.endsWith(".dxf")) return "application/dxf";
  if (clean.endsWith(".dwg")) return "application/acad";
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (upstreamType && upstreamType !== "application/octet-stream") {
    return upstreamType;
  }
  return "application/octet-stream";
}

function isAllowedRemoteUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host.startsWith("169.254.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url");
    if (!rawUrl || !rawUrl.trim()) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const decoded = rawUrl.trim();

    // 1. Local public/ file handling (e.g. /models/hotel.glb, /models/bina.glb)
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      const safeRel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
      const publicDir = path.resolve(process.cwd(), "public");
      const targetPath = path.resolve(publicDir, safeRel);
      if (!targetPath.startsWith(publicDir)) {
        return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
      }

      try {
        const buffer = await fs.readFile(targetPath);
        const contentType = inferContentType(targetPath);
        const fileName = path.basename(targetPath);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch (readErr: any) {
        return NextResponse.json({ error: "File not found locally" }, { status: 404 });
      }
    }

    // 2. Remote URL handling (UploadThing, CDN, AWS S3, etc.)
    if (!isAllowedRemoteUrl(decoded)) {
      return NextResponse.json({ error: "Disallowed URL" }, { status: 400 });
    }

    const upstream = await fetch(decoded, {
      redirect: "follow",
      headers: {
        "User-Agent": "NexaERP-BIMProxy/2.0",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned HTTP ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = inferContentType(decoded, upstream.headers.get("content-type"));
    const cleanName = decoded.split("?")[0].split("/").pop() || "model.glb";

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(cleanName)}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[/api/bim/file-proxy] Error:", err);
    return NextResponse.json(
      { error: err?.message || "BIM file proxy error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

