/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import DeductionsClient from "./DeductionsClient";

export const dynamic = 'force-dynamic'

export default async function SubcontractorDeductionsPage() {
  const deductions = await prisma.deduction.findMany({
    include: {
      subcontractor: true,
      project: true,
    },
    orderBy: {
      date: 'desc',
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

  // Calculate KPI data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = deductions
    .filter(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    })
    .reduce((sum, d) => sum + d.amount, 0);

  const formattedDeductions = deductions.map(d => ({
    ...d,
    date: d.date.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    project: d.project ? {
      id: d.project.id,
      name: d.project.name || "İsimsiz Proje"
    } : null,
  }));

  const subcontractorTotals = formattedDeductions.reduce((acc, d) => {
    acc[d.subcontractor.name] = (acc[d.subcontractor.name] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);

  const topPenalizedSubcontractor = Object.entries(subcontractorTotals)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <DeductionsClient 
      initialDeductions={formattedDeductions}
      subcontractors={subcontractors}
      projects={formattedProjects}
      monthlyTotal={monthlyTotal}
      topPenalizedSubcontractor={topPenalizedSubcontractor}
    />
  );
}
