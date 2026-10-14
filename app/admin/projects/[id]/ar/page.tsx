/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin route redirect to standalone AR field view
 */

import { redirect } from "next/navigation"

export default async function AdminProjectARRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/ar/${id}`)
}
