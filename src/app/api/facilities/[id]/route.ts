import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
      equipment: facility.equipment ? JSON.parse(facility.equipment) : [],
      amenities: facility.amenities ? JSON.parse(facility.amenities) : []
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