/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // BIM Model Uploader - IFC files and blobs, max 128MB
  bimModelUploader: f({
    blob: { maxFileSize: "128MB", maxFileCount: 1 },
    "application/octet-stream": { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Gerekirse yetkilendirme kodları...
      return { userId: "admin" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("UploadThing Core: Upload complete for", metadata.userId);
      // UFS URL kullanımı (Deprecation uyarısını önler)
      const safeUrl = (file as any).ufsUrl || (file as any).url; 
      console.log("UploadThing Core: File URL", safeUrl);
      return { uploadedBy: metadata.userId, url: safeUrl, name: file.name };
    }),

  // Drone Video Uploader - Video files, max 256MB
  droneVideoUploader: f({
    video: { maxFileSize: "256MB", maxFileCount: 10 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.url }
    }),

  // Daily Report Images - Multiple images, max 8MB each
  dailyReportImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 20 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.url }
    }),

  // Blog / CMS Image Uploader - Cover images, max 8MB
  blogImageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(() => {
      return { user: "admin" }
    })
    .onUploadComplete(({ file }) => {
      const safeUrl = (file as any).ufsUrl || (file as any).url
      return { url: safeUrl }
    }),

  // Project Document Uploader - PDF, DWG, DOCX, etc., max 64MB
  projectDocumentUploader: f({
    "application/pdf": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/octet-stream": { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.url }
    }),

  // Core Sample / Concrete Test Lab Report Uploader - PDF or Image
  coreSampleReportUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      const safeUrl = (file as any).ufsUrl || (file as any).url
      return { url: safeUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
