/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // BIM Model Uploader - Only .ifc files, max 128MB
  bimModelUploader: f({
    "application/octet-stream": { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(() => {
      // Add authentication middleware here if needed
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.url }
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
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
