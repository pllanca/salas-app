import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const capacity = searchParams.get("capacity")
    const building = searchParams.get("building")

    const where: any = {
      isActive: true
    }

    if (type) {
      where.type = type
    }

    if (capacity) {
      where.capacity = {
        gte: parseInt(capacity)
      }
    }

    if (building) {
      where.building = {
        contains: building,
        mode: 'insensitive'
      }
    }

    const facilities = await prisma.facility.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    })

    // Parse JSON strings for equipment and amenities
    const facilitiesWithParsedData = facilities.map(facility => ({
      ...facility,
      equipment: facility.equipment ? JSON.parse(facility.equipment) : [],
      amenities: facility.amenities ? JSON.parse(facility.amenities) : []
    }))

    return NextResponse.json(facilitiesWithParsedData)
  } catch (error) {
    console.error("Error fetching facilities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}