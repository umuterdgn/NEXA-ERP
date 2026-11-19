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
      <head>
        {/* Google Tag Manager (GTM-TX8QS94J) */}
        <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-TX8QS94J" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C] text-slate-900 dark:text-white">
        {children}
      </body>
    </html>
  )
}

