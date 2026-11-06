import { redirect } from "next/navigation"

export default async function ProjectRevisionsRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/tr/admin/projects/${id}/revisions`)
}

