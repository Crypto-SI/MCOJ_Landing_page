import type { Metadata } from 'next'
import '../../styles/globals.css'
import AdminNavigation from '@/components/AdminNavigation'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Admin Dashboard - MC OJ',
  description: 'Admin dashboard for MC OJ website',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col min-h-screen">
        <header className="bg-black text-yellow-400 p-4 shadow-md border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image 
                src="/brand/OJ logo.jpeg" 
                alt="MC OJ Logo" 
                fill
                className="object-contain rounded-md"
              />
            </div>
            <h1 className="text-2xl font-bold">MC OJ Admin</h1>
          </div>
        </header>
        <AdminNavigation />
        <main className="flex-grow p-6">
          {children}
        </main>
        <footer className="bg-black text-yellow-400 p-4 text-center border-t border-gray-800">
          <p className="text-sm">© {new Date().getFullYear()} MC OJ - Admin Panel</p>
        </footer>
      </div>
    </div>
  )
} 