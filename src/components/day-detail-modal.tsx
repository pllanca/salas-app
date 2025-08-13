"use client"

import { useState, useEffect } from "react"
import moment from "moment"

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string
  attendees: number
  user?: {
    name: string
  }
}

interface DayDetailModalProps {
  facilityId: string
  date: Date
  onClose: () => void
  onBookSlot?: (startTime: string) => void
}

export default function DayDetailModal({ facilityId, date, onClose, onBookSlot }: DayDetailModalProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailability()
  }, [facilityId, date])

  const fetchAvailability = async () => {
    try {
      const dateStr = moment(date).format('YYYY-MM-DD')
      const response = await fetch(`/api/facilities/${facilityId}/availability?date=${dateStr}`)
      
      if (response.ok) {
        const data = await response.json()
        setTimeSlots(data.timeSlots)
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeStr: string) => {
    return moment(timeStr).format('h:mm A')
  }

  const formatDate = (date: Date) => {
    return moment(date).format('MMMM DD, YYYY')
  }

  const getBookingForSlot = (slot: TimeSlot) => {
    return bookings.find(booking => 
      moment(booking.startTime).isSameOrBefore(slot.start) &&
      moment(booking.endTime).isAfter(slot.start)
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Availability for {formatDate(date)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-100 rounded-md">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Time Slots */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Slots (8 AM - 8 PM)</h3>
                
                {timeSlots.map((slot, index) => {
                  const booking = getBookingForSlot(slot)
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        slot.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            slot.available ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                            <span className={`ml-3 text-sm ${
                              slot.available ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {slot.available ? 'Available' : 'Booked'}
                            </span>
                          </div>
                        </div>
                        
                        {slot.available && onBookSlot && (
                          <button
                            onClick={() => onBookSlot(slot.start)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Book This Slot
                          </button>
                        )}
                      </div>
                      
                      {booking && (
                        <div className="mt-2 pl-6 text-sm text-gray-600">
                          <p><strong>Purpose:</strong> {booking.purpose}</p>
                          <p><strong>Attendees:</strong> {booking.attendees}</p>
                          <p><strong>Booked by:</strong> {booking.user?.name || 'Unknown User'}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Daily Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-green-700">
                      Available Slots: {timeSlots.filter(slot => slot.available).length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">
                      Booked Slots: {timeSlots.filter(slot => !slot.available).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Booked</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}