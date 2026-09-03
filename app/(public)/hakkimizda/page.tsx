/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import AboutClient from "@/components/AboutClient"

export const dynamic = 'force-dynamic'

async function getAboutContent() {
  try {
    const about = await prisma.about.findFirst()
    return about
  } catch (error) {
    console.error("Error fetching about content:", error)
    // Return fallback data if database fails
    return {
      title: "Hakkımızda",
      content: "Mahir Bakay Mühendislik olarak 20 yılı aşkın tecrübemizle inşaat sektöründe yenilikçi ve sürdürülebilir çözümler sunuyoruz."
    }
  }
}

export default async function HakkimizdaPage() {
  const about = await getAboutContent()

  return (
    <AboutClient 
      title={about?.title || "Hakkımızda"}
      content={about?.content || "Mahir Bakay Mühendislik olarak 20 yılı aşkın tecrübemizle inşaat sektöründe yenilikçi ve sürdürülebilir çözümler sunuyoruz."}
    />
  )
}