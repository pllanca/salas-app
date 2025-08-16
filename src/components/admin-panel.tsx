"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import FacilityManagement from "./facility-management"

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string
  attendees: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  notes: string | null
  rejectionReason: string | null
  cancellationReason: string | null
  createdAt: string
  user: {
    name: string
    email: string
    role: string
  }
  facility: {
    name: string
    type: string
    building: string
    floor: number | null
  }
}

export default function AdminPanel() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'bookings' | 'facilities'>('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; bookingId: string | null }>({ isOpen: false, bookingId: null })
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchBookings()
    }
  }, [session])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings")
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

  const handleBookingAction = async (bookingId: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED', rejectionReason?: string, cancellationReason?: string) => {
    setActionLoading(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejectionReason,
          cancellationReason
        })
      })

      if (response.ok) {
        await fetchBookings() // Refresh the list
      }
    } catch (error) {
      console.error("Error updating booking:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelModal.bookingId || !cancelReason.trim()) {
      alert("Please provide a cancellation reason.")
      return
    }
    
    await handleBookingAction(cancelModal.bookingId, 'CANCELLED', undefined, cancelReason)
    setCancelModal({ isOpen: false, bookingId: null })
    setCancelReason("")
  }

  const openCancelModal = (bookingId: string) => {
    setCancelModal({ isOpen: true, bookingId })
    setCancelReason("")
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
    return booking.status === filter.toUpperCase()
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-2 w-2/3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Main Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "bookings", label: "Bookings" },
            { key: "facilities", label: "Facilities" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'bookings' | 'facilities')}
              className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Tab Content */}
      {activeTab === 'bookings' && (
        <div>
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
                { key: "cancelled", label: "Cancelled" }
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
            <p className="text-gray-500">No bookings match the current filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const startDateTime = formatDateTime(booking.startTime)
            const endDateTime = formatDateTime(booking.endTime)
            
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {booking.facility.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {booking.facility.building} {booking.facility.floor && `- Floor ${booking.facility.floor}`}
                    </p>
                  </div>
                  
                  {booking.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBookingAction(booking.id, 'APPROVED')}
                        disabled={actionLoading === booking.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        {actionLoading === booking.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Rejection reason (optional):")
                          handleBookingAction(booking.id, 'REJECTED', reason || undefined)
                        }}
                        disabled={actionLoading === booking.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        {actionLoading === booking.id ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'APPROVED' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openCancelModal(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        {actionLoading === booking.id ? "..." : "Cancel Booking"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Requested by:</strong> {booking.user.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Role:</strong> {booking.user.role}
                    </p>
                  </div>
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
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  </div>
                )}

                {booking.status === 'REJECTED' && booking.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {booking.rejectionReason}
                    </p>
                  </div>
                )}

                {booking.status === 'CANCELLED' && booking.cancellationReason && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-md mb-4">
                    <p className="text-sm text-orange-800">
                      <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Requested on {formatDateTime(booking.createdAt).date} at {formatDateTime(booking.createdAt).time}
                </div>
              </div>
            )
          })
        )}
      </div>
        </div>
      )}

      {/* Facilities Tab Content */}
      {activeTab === 'facilities' && (
        <FacilityManagement />
      )}

      {/* Cancellation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling this booking. This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              required
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setCancelModal({ isOpen: false, bookingId: null })
                  setCancelReason("")
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason.trim() || actionLoading === cancelModal.bookingId}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-400 disabled:cursor-not-allowed"
              >
                {actionLoading === cancelModal.bookingId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}