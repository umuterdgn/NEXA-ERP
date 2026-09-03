import SubcontractorLayoutShell from "@/components/subcontractor/SubcontractorLayoutShell"

export const dynamic = 'force-dynamic'

export default function SubcontractorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <SubcontractorLayoutShell>{children}</SubcontractorLayoutShell>
    </div>
  )
}
