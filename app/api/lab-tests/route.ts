import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - List all lab tests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const labTests = await prisma.labDocument.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      },
      orderBy: {
        testDate: "desc"
      }
    })

    return NextResponse.json(labTests)
  } catch (error) {
    console.error("Failed to fetch lab tests:", error)
    return NextResponse.json(
      { error: "Laboratuvar testleri yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST - Create new lab test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      documentNo,
      sampleType,
      testType,
      result,
      testResult,
      testDate,
      imageUrl,
      notes,
      projectId
    } = body

    // Validation
    if (!title || !documentNo || !sampleType || !testResult || !testDate || !projectId) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      )
    }

    const labTest = await prisma.labDocument.create({
      data: {
        title,
        documentNo,
        sampleType,
        testType: testType || null,
        result: result || null,
        testResult,
        testDate: new Date(testDate),
        imageUrl: imageUrl || null,
        notes: notes || null,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(labTest, { status: 201 })
  } catch (error) {
    console.error("Failed to create lab test:", error)
    return NextResponse.json(
      { error: "Laboratuvar testi oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
