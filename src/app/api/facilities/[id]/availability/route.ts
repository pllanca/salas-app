import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all approved bookings for this facility on this date
    const bookings = await prisma.booking.findMany({
      where: {
        facilityId: id,
        status: 'APPROVED',
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Generate time slots (8 AM to 8 PM, hourly)
    const timeSlots = []
    for (let hour = 8; hour < 20; hour++) {
      const slotStart = new Date(startOfDay)
      slotStart.setHours(hour, 0, 0, 0)
      
      const slotEnd = new Date(startOfDay)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      // Check if this slot conflicts with any booking
      const isBooked = bookings.some(booking => 
        (slotStart >= booking.startTime && slotStart < booking.endTime) ||
        (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
        (slotStart <= booking.startTime && slotEnd >= booking.endTime)
      )

      timeSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBooked
      })
    }

    return NextResponse.json({ timeSlots, bookings })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}