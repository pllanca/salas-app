import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import FacilityDetail from "@/components/facility-detail"
import Navbar from "@/components/navbar"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FacilityPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <FacilityDetail facilityId={id} />
      </main>
    </div>
  )
}