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
  icons: {
    icon: [
      {
        url: '/favicon/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/favicon/site.webmanifest',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1.0',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://mcoj.uk',
    title: 'MC OJ - UK Garage MC',
    description: 'Official website of MC OJ - Bringing the golden touch to UK Garage',
    images: [
      {
        url: '/brand/OJ logo.jpeg',
        width: 800,
        height: 800,
        alt: 'MC OJ Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MC OJ - UK Garage MC',
    description: 'Official website of MC OJ - Bringing the golden touch to UK Garage',
    images: ['/brand/OJ logo.jpeg'],
  },
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