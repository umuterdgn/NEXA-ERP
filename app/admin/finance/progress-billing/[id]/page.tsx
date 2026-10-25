/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Hakediş Detay Sayfası (/admin/finance/progress-billing/[id])
 * BoQ (Metraj), BIM (IFC Element) ve GPS Bağlantılı Kurumsal Hakediş Denetim Motoru
 */

import { getProgressBillingDetail } from "@/app/admin/finance/actions"
import ProgressBillingDetailClient from "./ProgressBillingDetailClient"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProgressBillingDetailPage({ params }: Props) {
  const { id } = await params
  const res = await getProgressBillingDetail(id)

  return <ProgressBillingDetailClient billing={res.data} />
}
