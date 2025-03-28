'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNavigation() {
  const pathname = usePathname()
  
  // Only render the navigation if we're in the admin section
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return null
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/gallery', label: 'Gallery Management' },
    { href: '/admin/events', label: 'Events Management' },
    { href: '/admin/videos', label: 'Videos Management' },
    { href: '/admin/bookings', label: 'Booking Requests' },
    { href: '/admin/debug', label: 'Debug Tools' },
  ]

  return (
    <nav className="bg-black text-yellow-400 py-2 px-4 border-b border-gray-800">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 ${
                    isActive
                      ? 'text-yellow-500 border-b-2 border-yellow-500 font-bold'
                      : 'text-yellow-300 hover:text-yellow-400'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div>
            <Link
              href="/"
              className="text-yellow-300 hover:text-yellow-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Website
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 