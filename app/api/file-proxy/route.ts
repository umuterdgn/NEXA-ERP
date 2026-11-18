import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function inferContentType(urlOrPath: string, upstreamType?: string | null): string {
  const clean = urlOrPath.split("?")[0].split("#")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".bmp")) return "image/bmp";
  if (clean.endsWith(".dxf")) return "application/dxf";
  if (clean.endsWith(".dwg")) return "application/acad";
  if (clean.endsWith(".ifc")) return "application/x-step";
  if (clean.endsWith(".glb")) return "model/gltf-binary";
  if (clean.endsWith(".gltf")) return "model/gltf+json";
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
    // Block SSRF targets (loopback, metadata, private ranges)
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawUrl = req.nextUrl.searchParams.get("url");
    if (!rawUrl || !rawUrl.trim()) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const decoded = rawUrl.trim();

    // 1. Local public/ file handling
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      const safeRel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
      const publicDir = path.resolve(process.cwd(), "public");
      const targetPath = path.resolve(publicDir, safeRel);
      if (!targetPath.startsWith(publicDir)) {
        return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
      }
      const buffer = await fs.readFile(targetPath);
      const contentType = inferContentType(targetPath);
      const fileName = path.basename(targetPath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 2. Remote URL handling (UploadThing, Cloudinary, S3, etc.)
    if (!isAllowedRemoteUrl(decoded)) {
      return NextResponse.json({ error: "Disallowed URL" }, { status: 400 });
    }

    const upstream = await fetch(decoded, {
      redirect: "follow",
      headers: {
        "User-Agent": "NexaERP-CADProxy/1.0",
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
    const cleanName = decoded.split("?")[0].split("/").pop() || "blueprint";

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(cleanName)}"`,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[/api/file-proxy] Error:", err);
    return NextResponse.json(
      { error: err?.message || "File proxy error" },
      { status: 500 }
    );
  }
}

