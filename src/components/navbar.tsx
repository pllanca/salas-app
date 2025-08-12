"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              School Facilities
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Browse Facilities
              </Link>
              <Link href="/bookings" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Bookings
              </Link>
              {session?.user.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {session.user.name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session.user.role}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}