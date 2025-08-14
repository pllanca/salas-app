import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeJsonParse } from "@/lib/utils"
import { FacilityType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const capacity = searchParams.get("capacity")
    const building = searchParams.get("building")

    const where: {
      isActive: boolean;
      type?: FacilityType;
      capacity?: { gte: number };
      building?: { contains: string; mode: 'insensitive' };
    } = {
      isActive: true
    }

    if (type) {
      where.type = type as FacilityType
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
      equipment: safeJsonParse<string[]>(facility.equipment, []),
      amenities: safeJsonParse<string[]>(facility.amenities, [])
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