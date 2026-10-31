/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import RequestsClient from "./RequestsClient";

export default async function PersonnelRequestsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Oturum bulunamadı</div>;
  }

  // Get the personel record for the current user
  const personel = await prisma.personel.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!personel) {
    return <div>Personel kaydı bulunamadı</div>;
  }

  // Get user's requests
  const requests = await prisma.materialRequest.findMany({
    where: {
      requesterId: personel.id,
    },
    include: {
      project: {
        select: { name: true },
      },
      purchaseOrders: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get available projects
  const projects = await prisma.project.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const formattedProjects = projects.map(p => ({
    id: p.id,
    name: p.name || "İsimsiz Proje"
  }));

  const formattedRequests = requests.map(req => ({
    ...req,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    project: {
      ...req.project,
      name: req.project.name || "İsimsiz Proje"
    },
    purchaseOrders: req.purchaseOrders.map(po => ({
      ...po,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
      orderDate: po.orderDate.toISOString(),
    })),
  }));

  return (
    <RequestsClient 
      initialRequests={formattedRequests}
      projects={formattedProjects}
      personelId={personel.id}
    />
  );
}
