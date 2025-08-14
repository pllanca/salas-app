import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { safeJsonParse, facilityUpdateSchema } from "@/lib/utils"

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
    
    // Validate input with Zod schema
    const validationResult = facilityUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const updateData = validationResult.data

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

    // Input validation is handled by Zod schema above

    // Update facility
    const updatedFacility = await prisma.facility.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.type && { type: updateData.type }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.capacity !== undefined && { capacity: updateData.capacity }),
        ...(updateData.location && { location: updateData.location }),
        ...(updateData.building && { building: updateData.building }),
        ...(updateData.floor !== undefined && { floor: updateData.floor }),
        ...(updateData.equipment !== undefined && { 
          equipment: Array.isArray(updateData.equipment) && updateData.equipment.length > 0 ? JSON.stringify(updateData.equipment) : null 
        }),
        ...(updateData.amenities !== undefined && { 
          amenities: Array.isArray(updateData.amenities) && updateData.amenities.length > 0 ? JSON.stringify(updateData.amenities) : null 
        }),
        ...(updateData.image_url !== undefined && { imageUrl: updateData.image_url }),
        ...(updateData.status !== undefined && { isActive: updateData.status !== 'INACTIVE' })
      }
    })

    // Return facility with parsed data
    const facilityWithParsedData = {
      ...updatedFacility,
      equipment: safeJsonParse<string[]>(updatedFacility.equipment, []),
      amenities: safeJsonParse<string[]>(updatedFacility.amenities, [])
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