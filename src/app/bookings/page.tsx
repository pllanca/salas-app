import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import MyBookings from "@/components/my-bookings"
import Navbar from "@/components/navbar"

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Bookings
          </h1>
          <p className="text-xl text-gray-600">
            View and manage your facility reservations
          </p>
        </div>
        
        <MyBookings />
      </main>
    </div>
  )
}