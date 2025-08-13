"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import BookingForm from "./booking-form"
import BookingCalendar from "./booking-calendar"
import DayDetailModal from "./day-detail-modal"

interface Facility {
  id: string
  name: string
  type: string
  capacity: number
  description: string
  location: string
  building: string
  floor: number | null
  imageUrl: string | null
  equipment: string[]
  amenities: string[]
  bookings: Array<{
    id: string
    startTime: string
    endTime: string
    user: { name: string }
  }>
}

interface FacilityDetailProps {
  facilityId: string
}

export default function FacilityDetail({ facilityId }: FacilityDetailProps) {
  const { data: session } = useSession()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)

  useEffect(() => {
    fetchFacility()
  }, [facilityId])

  const fetchFacility = async () => {
    try {
      const response = await fetch(`/api/facilities/${facilityId}`)
      if (response.ok) {
        const data = await response.json()
        setFacility(data)
      } else if (response.status === 404) {
        // Handle not found
      }
    } catch (error) {
      console.error("Error fetching facility:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFacilityTypeColor = (type: string) => {
    const colors = {
      CLASSROOM: "bg-blue-100 text-blue-800",
      LAB: "bg-green-100 text-green-800",
      AUDITORIUM: "bg-purple-100 text-purple-800",
      MEETING_ROOM: "bg-orange-100 text-orange-800",
      STUDY_ROOM: "bg-gray-100 text-gray-800"
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatFacilityType = (type: string) => {
    return type.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayDetail(true)
  }

  const handleBookSlot = (startTime: string) => {
    // Close day detail modal and open booking form with pre-selected time
    setShowDayDetail(false)
    setShowBookingForm(true)
    // Note: We would need to modify BookingForm to accept pre-selected date/time
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-6">
          <div className="h-4 w-20 bg-gray-300 rounded mr-2"></div>
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
          <div className="h-4 w-32 bg-gray-300 rounded ml-2"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-96 bg-gray-300"></div>
          <div className="p-8">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Facility not found</h3>
        <Link href="/" className="text-blue-600 hover:text-blue-500">
          ← Back to facilities
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Facilities</Link>
        <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-gray-900">{facility.name}</span>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        <div className="relative h-96 bg-gray-200">
          {facility.imageUrl ? (
            <Image
              src={facility.imageUrl}
              alt={facility.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">
                  {facility.name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFacilityTypeColor(facility.type)}`}>
                  {formatFacilityType(facility.type)}
                </span>
              </div>
              <p className="text-xl text-gray-600">
                {facility.description}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowBookingForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Book This Space
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{facility.building} {facility.floor && `- Floor ${facility.floor}`}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span>Capacity: {facility.capacity} people</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Available 8 AM - 8 PM daily</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {facility.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {facility.amenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {facility.amenities.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Booking Calendar */}
          <BookingCalendar
            facilityId={facility.id}
            bookings={facility.bookings}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          facility={facility}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            setShowBookingForm(false)
            fetchFacility() // Refresh facility data
          }}
        />
      )}

      {/* Day Detail Modal */}
      {showDayDetail && selectedDate && (
        <DayDetailModal
          facilityId={facility.id}
          date={selectedDate}
          onClose={() => setShowDayDetail(false)}
          onBookSlot={handleBookSlot}
        />
      )}
    </div>
  )
}