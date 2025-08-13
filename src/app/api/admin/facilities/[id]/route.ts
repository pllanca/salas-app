import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
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
      amenities,
      isActive
    } = body

    // Check if facility exists
    const existingFacility = await prisma.facility.findUnique({
      where: { id }
    })

    if (!existingFacility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      )
    }

    // Validation (only if fields are provided)
    if (type) {
      const validTypes = ['CLASSROOM', 'AUDITORIUM', 'LAB', 'MEETING_ROOM', 'STUDY_ROOM']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Invalid facility type" },
          { status: 400 }
        )
      }
    }

    if (capacity !== undefined && (typeof capacity !== 'number' || capacity <= 0)) {
      return NextResponse.json(
        { error: "Capacity must be a positive number" },
        { status: 400 }
      )
    }

    // Update facility
    const updatedFacility = await prisma.facility.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(capacity !== undefined && { capacity: parseInt(capacity.toString()) }),
        ...(description !== undefined && { description: description || null }),
        ...(location && { location }),
        ...(building && { building }),
        ...(floor !== undefined && { floor: floor ? parseInt(floor.toString()) : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(equipment !== undefined && { 
          equipment: equipment && equipment.length > 0 ? JSON.stringify(equipment) : null 
        }),
        ...(amenities !== undefined && { 
          amenities: amenities && amenities.length > 0 ? JSON.stringify(amenities) : null 
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    })

    // Return facility with parsed data
    const facilityWithParsedData = {
      ...updatedFacility,
      equipment: updatedFacility.equipment ? JSON.parse(updatedFacility.equipment) : [],
      amenities: updatedFacility.amenities ? JSON.parse(updatedFacility.amenities) : []
    }

    return NextResponse.json(facilityWithParsedData)
  } catch (error) {
    console.error("Error updating facility:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if facility exists
    const existingFacility = await prisma.facility.findUnique({
      where: { id }
    })

    if (!existingFacility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      )
    }

    // Check if facility has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        facilityId: id,
        status: 'APPROVED',
        startTime: {
          gte: new Date()
        }
      }
    })

    if (activeBookings > 0) {
      // Soft delete - mark as inactive instead of hard delete
      await prisma.facility.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: "Facility deactivated due to active bookings"
      })
    } else {
      // Hard delete if no active bookings
      await prisma.facility.delete({
        where: { id }
      })

      return NextResponse.json({
        message: "Facility deleted successfully"
      })
    }
  } catch (error) {
    console.error("Error deleting facility:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}