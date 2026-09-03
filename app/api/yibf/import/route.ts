import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * YİBF Veri İçe Aktarma API Rotası
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      yibfNo,
      projectName,
      contractor,
      area,
      status,
      startDate,
      endDate,
      location,
      description,
      buildingType,
      floorCount,
      totalArea
    } = body

    // Validate required fields
    if (!yibfNo || !projectName) {
      return NextResponse.json(
        { error: 'yibfNo ve projectName zorunludur' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      )
    }

    // Upsert YİBF project (create or update based on yibfNo)
    const project = await prisma.project.upsert({
      where: {
        yibfNo: yibfNo
      },
      update: {
        name: projectName,
        contractorName: contractor || null,
        area: area || null,
        status: status || 'AKTIF',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        description: description || null,
        buildingType: buildingType || null,
        floorCount: floorCount || null,
        totalArea: totalArea || null,
        updatedAt: new Date()
      },
      create: {
        name: projectName,
        yibfNo: yibfNo,
        contractorName: contractor || null,
        area: area || null,
        status: status || 'AKTIF',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        description: description || null,
        buildingType: buildingType || null,
        floorCount: floorCount || null,
        totalArea: totalArea || null
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'YİBF verisi başarıyla aktarıldı',
        project: {
          id: project.id,
          name: project.name,
          yibfNo: project.yibfNo
        }
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    )
  } catch (error) {
    console.error('YİBF import error:', error)
    return NextResponse.json(
      { error: 'Veri aktarımı sırasında bir hata oluştu' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  )
}
