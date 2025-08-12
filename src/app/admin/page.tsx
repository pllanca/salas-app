import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import AdminPanel from "@/components/admin-panel"
import Navbar from "@/components/navbar"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  if (session.user.role !== 'ADMIN') {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-xl text-gray-600">
            Manage bookings and facility reservations
          </p>
        </div>
        
        <AdminPanel />
      </main>
    </div>
  )
}