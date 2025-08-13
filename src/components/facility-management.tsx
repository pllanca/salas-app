"use client"

import { useState, useEffect } from "react"
import FacilityFormModal from "./facility-form-modal"

interface Facility {
  id: string
  name: string
  type: string
  capacity: number
  description: string | null
  location: string
  building: string
  floor: number | null
  imageUrl: string | null
  equipment: string[]
  amenities: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch("/api/admin/facilities")
      if (response.ok) {
        const data = await response.json()
        setFacilities(data)
      }
    } catch (error) {
      console.error("Error fetching facilities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (facilityId: string) => {
    if (!confirm("Are you sure you want to delete this facility? This action cannot be undone.")) {
      return
    }

    setActionLoading(facilityId)
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchFacilities() // Refresh the list
        alert("Facility deleted successfully")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error deleting facility:", error)
      alert("Failed to delete facility")
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility)
    setShowEditModal(true)
  }

  const formatFacilityType = (type: string) => {
    return type.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-2/3"></div>
            <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facility Management</h2>
          <p className="text-gray-600">Manage facilities, equipment, and amenities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Facility
        </button>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image */}
            <div className="h-48 bg-gray-200 relative">
              {facility.imageUrl ? (
                <img
                  src={facility.imageUrl}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {!facility.isActive && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">INACTIVE</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{facility.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFacilityTypeColor(facility.type)}`}>
                    {formatFacilityType(facility.type)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{facility.building} {facility.floor && `- Floor ${facility.floor}`}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span>Capacity: {facility.capacity} people</span>
                </div>
              </div>

              {facility.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {facility.description}
                </p>
              )}

              {/* Equipment Tags */}
              {facility.equipment.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1">
                    {facility.equipment.slice(0, 3).map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                      >
                        {item}
                      </span>
                    ))}
                    {facility.equipment.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        +{facility.equipment.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(facility)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(facility.id)}
                  disabled={actionLoading === facility.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {actionLoading === facility.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {facilities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first facility.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Add First Facility
          </button>
        </div>
      )}

      {/* Add Facility Modal */}
      <FacilityFormModal
        isOpen={showAddModal}
        mode="add"
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchFacilities()
          setShowAddModal(false)
        }}
      />

      {/* Edit Facility Modal */}
      <FacilityFormModal
        isOpen={showEditModal}
        mode="edit"
        facility={editingFacility || undefined}
        onClose={() => {
          setShowEditModal(false)
          setEditingFacility(null)
        }}
        onSuccess={() => {
          fetchFacilities()
          setShowEditModal(false)
          setEditingFacility(null)
        }}
      />
    </div>
  )
}