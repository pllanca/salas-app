import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

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
    const {
      name,
      type,
      capacity,
      description,
      location,
      building,
      floor,
      imageUrl,
      equipment,
      amenities
    } = body

    // Validation
    if (!name || !type || !capacity || !location || !building) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, capacity, location, building" },
        { status: 400 }
      )
    }

    // Validate facility type
    const validTypes = ['CLASSROOM', 'AUDITORIUM', 'LAB', 'MEETING_ROOM', 'STUDY_ROOM']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid facility type" },
        { status: 400 }
      )
    }

    // Validate capacity
    if (typeof capacity !== 'number' || capacity <= 0) {
      return NextResponse.json(
        { error: "Capacity must be a positive number" },
        { status: 400 }
      )
    }

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity.toString()),
        description: description || null,
        location,
        building,
        floor: floor ? parseInt(floor.toString()) : null,
        imageUrl: imageUrl || null,
        equipment: equipment && equipment.length > 0 ? JSON.stringify(equipment) : null,
        amenities: amenities && amenities.length > 0 ? JSON.stringify(amenities) : null,
        isActive: true
      }
    })

    // Return facility with parsed data
    const facilityWithParsedData = {
      ...facility,
      equipment: facility.equipment ? JSON.parse(facility.equipment) : [],
      amenities: facility.amenities ? JSON.parse(facility.amenities) : []
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