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
      status,
      startDate,
      endDate,
      location,
      description,
      buildingType
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
        title: projectName,
        name: projectName,
        clientName: contractor || null,
        status: status || 'AKTIF',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location: location || null,
        description: description || null,
        category: buildingType || null,
        updatedAt: new Date()
      },
      create: {
        title: projectName,
        name: projectName,
        yibfNo: yibfNo,
        clientName: contractor || null,
        status: status || 'AKTIF',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location: location || null,
        description: description || null,
        category: buildingType || null
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
