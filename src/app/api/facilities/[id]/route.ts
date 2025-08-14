import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeJsonParse } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: 'APPROVED',
            startTime: {
              gte: new Date()
            }
          },
          include: {
            user: true
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    })

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      )
    }

    // Parse JSON strings for equipment and amenities
    const facilityWithParsedData = {
      ...facility,
      equipment: safeJsonParse<string[]>(facility.equipment, []),
      amenities: safeJsonParse<string[]>(facility.amenities, [])
    }

    return NextResponse.json(facilityWithParsedData)
  } catch (error) {
    console.error("Error fetching facility:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}