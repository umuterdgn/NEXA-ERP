/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProcurementClient from "./ProcurementClient";

export const dynamic = 'force-dynamic'

export default async function ProcurementPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  if (!session?.user || (!tenantId && !isSuperAdmin)) {
    redirect("/login");
  }

  const tenantFilter = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {};

  const requests = await prisma.materialRequest.findMany({
    where: tenantFilter,
    include: {
      project: {
        select: { title: true, name: true },
      },
      requester: {
        select: { name: true },
      },
      purchaseOrders: true,
    },
    orderBy: [
      { urgency: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const formattedRequests = requests.map(req => ({
    ...req,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    project: {
      name: (req.project as any)?.title || (req.project as any)?.name || "İsimsiz Proje"
    },
    requester: {
      ...req.requester,
      surname: "" // Default empty surname since Personel doesn't have surname field
    },
    purchaseOrders: req.purchaseOrders.map(po => ({
      ...po,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
      orderDate: po.orderDate.toISOString(),
    })),
  }));

  return (
    <ProcurementClient initialRequests={formattedRequests} />
  );
}
