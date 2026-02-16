import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodGeni Education - Plateforme Éducative',
  description: 'Plateforme éducative complète pour administrateurs, professeurs et élèves',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
