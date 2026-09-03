/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { S3Client } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
  endpoint: process.env.STORJ_ENDPOINT,
  region: 'global',
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY || '',
    secretAccessKey: process.env.STORJ_SECRET_KEY || '',
  },
  forcePathStyle: true,
})
