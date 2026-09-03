/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.yibfProject.findMany({
      include: {
        deficiencies: {
          where: {
            status: {
              in: ["OPEN", "FIX_PENDING", "VERIFY_PENDING"],
            },
          },
        },
      },
    });

    // Calculate risk score for each project
    const projectsWithRisk = projects.map((project) => {
      const openDeficiencies = project.deficiencies;
      const criticalCount = openDeficiencies.filter((d) => d.priority === "CRITICAL").length;
      const highCount = openDeficiencies.filter((d) => d.priority === "HIGH").length;
      const mediumCount = openDeficiencies.filter((d) => d.priority === "MEDIUM").length;
      const totalCount = openDeficiencies.length;

      let riskLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
      let healthScore = 100;

      // Risk calculation logic
      if (criticalCount > 0 || totalCount > 3) {
        riskLevel = "HIGH";
        healthScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10) - (mediumCount * 5) - (totalCount * 5));
      } else if (highCount > 0 || mediumCount > 0 || totalCount > 0) {
        riskLevel = "MEDIUM";
        healthScore = Math.max(0, 100 - (highCount * 10) - (mediumCount * 5) - (totalCount * 3));
      } else {
        riskLevel = "LOW";
        healthScore = 100;
      }

      // Mock coordinates for Turkey (in real app, these would come from address geocoding)
      const coordinates = {
        lat: 39.0 + (Math.random() - 0.5) * 10, // Random lat around Turkey center
        lng: 35.0 + (Math.random() - 0.5) * 10, // Random lng around Turkey center
      };

      return {
        id: project.id,
        yibfNo: project.yibfNo,
        address: project.address,
        contractorName: project.contractorName,
        ownerName: project.ownerName,
        totalArea: project.totalArea,
        floors: project.floors,
        status: project.status,
        coordinates,
        riskLevel,
        healthScore,
        openDeficiencyCount: totalCount,
        criticalCount,
        highCount,
        mediumCount,
      };
    });

    // Sort by risk level (HIGH first) and then by health score
    projectsWithRisk.sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return a.healthScore - b.healthScore;
    });

    return NextResponse.json(projectsWithRisk);
  } catch (error) {
    console.error("Error fetching projects with risk:", error);
    return NextResponse.json(
      { error: "Projeler getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}
