import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { facilityId, startTime, endTime, purpose, attendees, notes } = await request.json()

    // Validate required fields
    if (!facilityId || !startTime || !endTime || !purpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Validate time range
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // Check for conflicts with existing approved bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        facilityId,
        status: 'APPROVED',
        AND: [
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: start } },
                  { endTime: { gt: start } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: end } },
                  { endTime: { gte: end } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: start } },
                  { endTime: { lte: end } }
                ]
              }
            ]
          }
        ]
      }
    })

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "This time slot conflicts with existing bookings" },
        { status: 409 }
      )
    }

    // Determine booking status based on user role
    const status = session.user.role === 'FACULTY' || session.user.role === 'STAFF' ? 'APPROVED' : 'PENDING'

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        facilityId,
        startTime: start,
        endTime: end,
        purpose,
        attendees: parseInt(attendees?.toString() || '1'),
        notes: notes || null,
        status
      },
      include: {
        facility: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}