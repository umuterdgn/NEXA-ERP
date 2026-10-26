/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/lib/auth'
import { syncToGlobalArchive } from '@/lib/services/archive-sync'

// Vercel'de timeout olmaması için süreyi uzatıyoruz (Opsiyonel ama hayat kurtarır)
export const maxDuration = 60

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    const session = await auth().catch(() => null)
    const effectiveTenantId = (formData.get('tenantId') as string) || (session?.user as any)?.tenantId || null
    const projectId = (formData.get('projectId') as string) || null
    const sourceModule = (formData.get('sourceModule') as string) || "BIM"

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // .glb ve .gltf için KRİTİK HACK: Dosyayı 'image' olarak yüklüyoruz.
    // Bu sayede Cloudinary CDN CORS (erişim) engelini otomatik kaldırıyor.
    const resourceType = 'image'
    
    const extension = file.name.split('.').pop()
    const isGLB = extension === 'glb' || extension === 'gltf'
    const customPublicId = isGLB ? `model_${Date.now()}` : undefined // Cloudinary 'image' tipinde uzantıyı kendi ekler.

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: resourceType, 
          folder: 'nexa_erp',
          ...(customPublicId && { public_id: customPublicId })
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    const fileUrl = (result as any).secure_url

    // 🌟 Global Arşiv ve Kota Senkronizasyonu
    const syncRes = await syncToGlobalArchive({
      title: file.name,
      fileUrl,
      fileSizeBytes: file.size,
      sourceModule: sourceModule,
      category: isGLB ? "BIM_MODEL" : "IMAGE",
      tenantId: effectiveTenantId,
      projectId: projectId,
      uploadedById: session?.user?.id || null
    })

    return NextResponse.json({ 
      url: fileUrl,
      fileSizeMB: syncRes?.fileSizeMB || Number((file.size / (1024 * 1024)).toFixed(3)),
      archived: true
    })
  } catch (error: any) {
    console.error("🚨 Cloudinary Yükleme Hatası:", error)
    return NextResponse.json({ 
      error: error.message || 'Yükleme başarısız',
      details: error.toString()
    }, { status: 500 })
  }
}
