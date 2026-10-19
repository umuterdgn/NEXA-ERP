"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { slugify } from "@/lib/slugify"

export interface BlogPostInput {
  title: string
  slug?: string
  category: string
  targetAudience: string
  content: string
  imageUrl?: string | null
  author?: string
  language?: string
  isPublished?: boolean
}

export async function addBlogPost(data: BlogPostInput) {
  try {
    let cleanSlug = data.slug ? slugify(data.slug) : slugify(data.title)
    if (!cleanSlug) {
      cleanSlug = `yazi-${Date.now()}`
    }

    // Ensure slug uniqueness
    const existing = await prisma.blogPost.findUnique({
      where: { slug: cleanSlug },
    })
    if (existing) {
      cleanSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 7)}`
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: cleanSlug,
        category: data.category || "Case Study",
        targetAudience: data.targetAudience || "Patronlar, CFO'lar",
        content: data.content,
        imageUrl: data.imageUrl || null,
        author: data.author || "Nexa ERP",
        language: data.language || "tr",
        isPublished: data.isPublished ?? false,
      },
    })

    revalidatePath("/blog")
    revalidatePath("/admin/content-management")
    return { success: true, post }
  } catch (error: any) {
    console.error("addBlogPost error:", error)
    return { success: false, error: error.message || "İçerik kaydedilirken hata oluştu." }
  }
}

export async function updateBlogPost(id: string, data: Partial<BlogPostInput>) {
  try {
    let updateData: any = { ...data }
    if (data.slug) {
      updateData.slug = slugify(data.slug)
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath("/admin/content-management")
    return { success: true, post }
  } catch (error: any) {
    console.error("updateBlogPost error:", error)
    return { success: false, error: error.message || "İçerik güncellenirken hata oluştu." }
  }
}

export async function togglePublishBlogPost(id: string, isPublished: boolean) {
  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { isPublished },
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath("/admin/content-management")
    return { success: true, post }
  } catch (error: any) {
    console.error("togglePublishBlogPost error:", error)
    return { success: false, error: error.message || "Durum güncellenirken hata oluştu." }
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const post = await prisma.blogPost.delete({
      where: { id },
    })

    revalidatePath("/blog")
    revalidatePath("/admin/content-management")
    return { success: true, post }
  } catch (error: any) {
    console.error("deleteBlogPost error:", error)
    return { success: false, error: error.message || "İçerik silinirken hata oluştu." }
  }
}

export async function getBlogPosts(language?: string) {
  try {
    const where: any = {}
    if (language && language !== "all") {
      where.language = language
    }
    return await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("getBlogPosts error:", error)
    return []
  }
}

export async function getPublishedBlogPosts(language?: string) {
  try {
    const where: any = { isPublished: true }
    if (language && language !== "all") {
      where.language = language
    }
    return await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("getPublishedBlogPosts error:", error)
    return []
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug },
    })
  } catch (error) {
    console.error("getBlogPostBySlug error:", error)
    return null
  }
}
