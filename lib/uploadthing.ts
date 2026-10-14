/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Official UploadThing Client Components & Helpers
 */

import {
  generateUploadButton,
  generateUploadDropzone,
  generateUploader,
} from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
export const Uploader = generateUploader<OurFileRouter>()
