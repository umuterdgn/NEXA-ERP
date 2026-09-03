/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import DocumentsClient from "./DocumentsClient";

export const dynamic = 'force-dynamic'

export default async function SubcontractorDocumentsPage() {
  const workerDocuments = await prisma.workerDocument.findMany({
    include: {
      subcontractor: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const subcontractors = await prisma.company.findMany({
    where: {
      type: 'SUBCONTRACTOR',
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <DocumentsClient 
      initialDocuments={workerDocuments} 
      subcontractors={subcontractors}
    />
  );
}
