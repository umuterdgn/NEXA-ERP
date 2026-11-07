import React from "react"
import "@/app/globals.css"

export const metadata = {
  title: "Nexa ERP Admin",
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C] text-slate-900 dark:text-white">
        {children}
      </body>
    </html>
  )
}

