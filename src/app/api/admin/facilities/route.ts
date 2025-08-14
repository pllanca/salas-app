import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { safeJsonParse, facilityCreateSchema } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const facilities = await prisma.facility.findMany({
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input with Zod schema
    const validationResult = facilityCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const {
      name,
      type,
      description,
      capacity,
      location,
      building,
      floor,
      equipment,
      amenities,
      image_url,
      status
    } = validationResult.data

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        description,
        capacity,
        location,
        building,
        floor,
        equipment: Array.isArray(equipment) && equipment.length > 0 ? JSON.stringify(equipment) : null,
        amenities: Array.isArray(amenities) && amenities.length > 0 ? JSON.stringify(amenities) : null,
        imageUrl: image_url || null,
        isActive: status !== 'INACTIVE'
      }
    })

    // Return facility with parsed data
    const facilityWithParsedData = {
      ...facility,
      equipment: safeJsonParse<string[]>(facility.equipment, []),
      amenities: safeJsonParse<string[]>(facility.amenities, [])
    }

    return NextResponse.json(facilityWithParsedData, { status: 201 })
  } catch (error) {
    console.error("Error creating facility:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}