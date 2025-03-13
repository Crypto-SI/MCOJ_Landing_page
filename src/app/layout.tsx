import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import '../styles/globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'MC OJ - UK Garage MC',
  description: 'Official website of MC OJ - Bringing the golden touch to UK Garage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable}`}>
      <body className="min-h-screen bg-brand-black">
        {children}
      </body>
    </html>
  )
} 