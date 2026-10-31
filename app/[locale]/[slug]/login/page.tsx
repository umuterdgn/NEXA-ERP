/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * White-Label (Firmaya Özel) Multi-Tenant Giriş Rotası (Server Component)
 * 
 * Dinamik Rota: /[slug]/login (Örn: /ronesans/login, /zirveyapi/login)
 * Eğer slug Company tablosunda bulunamazsa kullanıcıyı ana /login sayfasına yönlendirir.
 */

import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TenantLoginClient from "./TenantLoginClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const company = await prisma.company.findFirst({
    where: {
      slug: {
        equals: slug,
        mode: "insensitive",
      },
    },
    select: {
      name: true,
    },
  });

  if (!company) {
    return {
      title: "Giriş Yap | NEXA ERP",
    };
  }

  return {
    title: `${company.name} | Kurumsal Giriş Portalı`,
    description: `${company.name} personeli ve yetkilileri için kurumsal Nexa ERP giriş terminali.`,
  };
}

export default async function TenantLoginPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug || slug === "login" || slug === "admin" || slug === "api") {
    redirect("/login");
  }

  const company = await prisma.company.findFirst({
    where: {
      slug: {
        equals: slug,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      themeColor: true,
      companyType: true,
    },
  });

  if (!company) {
    // Firma bulunamazsa ana /login sayfasına yönlendir
    redirect("/login");
  }

  return <TenantLoginClient company={company} />;
}
