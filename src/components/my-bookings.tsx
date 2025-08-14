"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string
  attendees: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  notes: string | null
  rejectionReason: string | null
  createdAt: string
  facility: {
    name: string
    type: string
    building: string
    floor: number | null
    imageUrl: string | null
  }
}

export default function MyBookings() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings/my")
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true
    if (filter === "upcoming") {
      return new Date(booking.startTime) >= new Date() && booking.status === 'APPROVED'
    }
    if (filter === "past") {
      return new Date(booking.endTime) < new Date()
    }
    return booking.status === filter.toUpperCase()
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="h-20 w-20 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "pending", label: "Pending" },
            { key: "past", label: "Past" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t made any bookings yet.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Facilities
            </Link>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const startDateTime = formatDateTime(booking.startTime)
            const endDateTime = formatDateTime(booking.endTime)
            
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Facility Image */}
                    <div className="flex-shrink-0">
                      <div className="relative h-20 w-20 bg-gray-200 rounded-md overflow-hidden">
                        {booking.facility.imageUrl ? (
                          <Image
                            src={booking.facility.imageUrl}
                            alt={booking.facility.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.facility.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {booking.facility.building} {booking.facility.floor && `- Floor ${booking.facility.floor}`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Date:</strong> {startDateTime.date}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Time:</strong> {startDateTime.time} - {endDateTime.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Purpose:</strong> {booking.purpose}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Attendees:</strong> {booking.attendees}
                          </p>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}

                      {booking.status === 'REJECTED' && booking.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-3">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {booking.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Booked on {formatDateTime(booking.createdAt).date}
                        </p>
                        
                        <div className="flex space-x-2">
                          <Link
                            href={`/facilities/${booking.facility}`}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                          >
                            View Facility
                          </Link>
                          {booking.status === 'APPROVED' && new Date(booking.startTime) > new Date() && (
                            <button className="text-red-600 hover:text-red-500 text-sm font-medium">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}