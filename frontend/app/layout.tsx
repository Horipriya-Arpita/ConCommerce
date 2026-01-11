import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConCommerce - AI Product Assistant',
  description: 'Compare products from StarTech & Daraz with AI-powered recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
