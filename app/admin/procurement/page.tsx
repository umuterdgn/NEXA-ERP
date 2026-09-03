/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import ProcurementClient from "./ProcurementClient";

export const dynamic = 'force-dynamic'

export default async function ProcurementPage() {
  const requests = await prisma.materialRequest.findMany({
    include: {
      project: {
        select: { name: true },
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
      ...req.project,
      name: req.project.name || "İsimsiz Proje"
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
