"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Set up the localizer
const localizer = momentLocalizer(moment)

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose?: string
  attendees?: number
  user?: {
    name: string
  }
}

interface BookingCalendarProps {
  facilityId: string
  bookings: Booking[]
  onDateClick?: (date: Date) => void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking
}

export default function BookingCalendar({ facilityId, bookings, onDateClick }: BookingCalendarProps) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set())

  // Convert bookings to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      title: `${booking.purpose} (${booking.attendees} people)`,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      resource: booking
    }))
  }, [bookings])

  // Calculate fully booked dates
  useEffect(() => {
    const calculateFullyBookedDates = () => {
      const dateBookingCounts = new Map<string, number>()
      
      bookings.forEach(booking => {
        const bookingDate = moment(booking.startTime).format('YYYY-MM-DD')
        const startHour = moment(booking.startTime).hour()
        const endHour = moment(booking.endTime).hour()
        const duration = endHour - startHour
        
        const currentCount = dateBookingCounts.get(bookingDate) || 0
        dateBookingCounts.set(bookingDate, currentCount + duration)
      })

      // Consider a day fully booked if more than 8 hours are booked (8 AM - 8 PM = 12 hours total)
      const fullyBooked = new Set<string>()
      dateBookingCounts.forEach((bookedHours, date) => {
        if (bookedHours >= 8) { // More than 8 hours booked = mostly unavailable
          fullyBooked.add(date)
        }
      })

      setFullyBookedDates(fullyBooked)
    }

    calculateFullyBookedDates()
  }, [bookings])

  // Custom day cell renderer to gray out fully booked days
  const dayPropGetter = (date: Date) => {
    const dateStr = moment(date).format('YYYY-MM-DD')
    const isFullyBooked = fullyBookedDates.has(dateStr)
    
    return {
      className: isFullyBooked ? 'fully-booked-day' : '',
      style: isFullyBooked ? {
        backgroundColor: '#f3f4f6',
        color: '#9ca3af',
        opacity: 0.6
      } : {}
    }
  }

  // Custom event style
  const eventPropGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px'
      }
    }
  }

  // Handle date selection
  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (onDateClick) {
      onDateClick(start)
    }
  }

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    const booking = event.resource
    const startTime = moment(booking.startTime).format('MMM DD, YYYY h:mm A')
    const endTime = moment(booking.endTime).format('h:mm A')
    
    alert(`Booking Details:
    
Purpose: ${booking.purpose}
Attendees: ${booking.attendees}
Booked by: ${booking.user?.name || 'Unknown User'}
Time: ${startTime} - ${endTime}`)
  }

  return (
    <div className="bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Booking Calendar</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
            <span>Fully Booked</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Booking</span>
          </div>
        </div>
      </div>

      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={true}
          dayPropGetter={dayPropGetter}
          eventPropGetter={eventPropGetter}
          popup={true}
          step={60}
          timeslots={1}
          min={new Date(2024, 0, 1, 8, 0)} // 8 AM
          max={new Date(2024, 0, 1, 20, 0)} // 8 PM
          formats={{
            timeGutterFormat: 'h:mm A',
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`
          }}
          className="rbc-calendar-custom"
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>• Click on a date to see detailed availability</p>
        <p>• Click on a booking to see details</p>
        <p>• Gray dates indicate mostly unavailable times</p>
      </div>
    </div>
  )
}