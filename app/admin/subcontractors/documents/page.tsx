/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export const dynamic = 'force-dynamic'

export default async function SubcontractorDocumentsPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  if (!session?.user || (!tenantId && !isSuperAdmin)) {
    redirect("/login");
  }

  const tenantFilter = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {};

  const workerDocuments = await prisma.workerDocument.findMany({
    where: tenantFilter,
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
      ...tenantFilter,
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
