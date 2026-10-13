/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"

function parseExcelDate(rawDate: any): Date | null {
  if (!rawDate) return null;
  
  // Eğer Excel'den seri numarası olarak geliyorsa (örn: 45000)
  if (typeof rawDate === 'number') {
    return new Date(Math.round((rawDate - 25569) * 86400 * 1000));
  }
  
  // Eğer string olarak "GG.AA.YYYY" formatında geliyorsa
  if (typeof rawDate === 'string') {
    const parts = rawDate.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS'de aylar 0'dan başlar
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    // Farklı bir string formatıysa normal parse etmeyi dene
    return new Date(rawDate);
  }
  
  return null;
}

export async function uploadMenuExcel(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string

    if (!projectId) {
      return { success: false, error: "Lütfen Excel yüklemeden önce bir proje seçiniz" }
    }

    if (!file) {
      return { success: false, error: "Dosya seçilmedi" }
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
    
    // Skip header row, process data rows
    let count = 0
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row[0] || !row[1]) continue // Skip empty rows
      
      // Parse date using the helper function
      const date = parseExcelDate(row[0])
      
      // Skip if date is invalid
      if (!date || isNaN(date.getTime())) {
        console.warn(`Invalid date in row ${i + 1}:`, row[0])
        continue
      }
      
      // Get menu items
      const items = row[1].toString().trim()
      if (!items) continue
      
      // Upsert to database (unique per project and date)
      await prisma.foodMenu.upsert({
        where: {
          projectId_date: {
            projectId,
            date
          }
        },
        update: { items },
        create: { date, items, projectId }
      })
      
      count++
    }

    revalidatePath("/admin/food-menu")
    return { success: true, count }
  } catch (error) {
    console.error("Excel upload error:", error)
    return { success: false, error: "Excel dosyası işlenirken hata oluştu" }
  }
}

export async function createFoodMenu(projectId: string, dateStr: string, items: string) {
  try {
    if (!projectId) {
      return { success: false, error: "Proje seçimi zorunludur" }
    }
    if (!dateStr || !items) {
      return { success: false, error: "Tarih ve menü içeriği zorunludur" }
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return { success: false, error: "Geçersiz tarih" }
    }

    const menu = await prisma.foodMenu.upsert({
      where: {
        projectId_date: {
          projectId,
          date
        }
      },
      update: { items: items.trim() },
      create: {
        projectId,
        date,
        items: items.trim()
      }
    })

    revalidatePath("/admin/food-menu")
    return { success: true, menu }
  } catch (error) {
    console.error("Create food menu error:", error)
    return { success: false, error: "Menü kaydedilirken hata oluştu" }
  }
}

export async function updateFoodMenu(id: string, newItems: string) {
  try {
    await prisma.foodMenu.update({
      where: { id },
      data: { items: newItems.trim() }
    })
    revalidatePath("/admin/food-menu")
    return { success: true }
  } catch (error) {
    console.error("Update food menu error:", error)
    return { success: false, error: "Güncelleme başarısız" }
  }
}

export async function deleteFoodMenuAction(id: string) {
  try {
    await prisma.foodMenu.delete({
      where: { id }
    })
    revalidatePath("/admin/food-menu")
    return { success: true }
  } catch (error) {
    console.error("Delete food menu error:", error)
    return { success: false, error: "Silme başarısız" }
  }
}
