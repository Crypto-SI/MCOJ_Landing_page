import type { Metadata, Viewport } from 'next'
import { Montserrat, Teko } from 'next/font/google'
import '../styles/globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
})

const teko = Teko({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-teko',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mcoj.uk'),
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

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${teko.variable}`}>
      <body className="min-h-screen bg-brand-black">
        {children}
      </body>
    </html>
  )
} 