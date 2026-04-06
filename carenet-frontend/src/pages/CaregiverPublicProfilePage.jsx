import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, MapPin, Clock, Shield, Calendar, CheckCircle, AlertCircle, Briefcase, User, ArrowLeft, Filter, Upload, X, Image as ImageIcon } from 'lucide-react'
import ApiService from '../services/api'
import CaregiverModal from '../components/CaregiverModal'

const CaregiverPublicProfilePage = () => {
  const { caregiverId } = useParams()
  const [caregiverData, setCaregiverData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [activeTab, setActiveTab] = useState('about') // 'about' or 'activity'
  const [selectedClient, setSelectedClient] = useState('all') // Filter by client
  const [uploadingTaskId, setUploadingTaskId] = useState(null)
  const [completingTaskId, setCompletingTaskId] = useState(null)

  useEffect(() => {
    if (caregiverId) {
      fetchCaregiverProfile()
    }
  }, [caregiverId])

  const fetchCaregiverProfile = async () => {
    try {
      setLoading(true)
      console.log('Fetching caregiver profile:', caregiverId)
      const data = await ApiService.getCaregiverProfile(caregiverId)
      console.log('Caregiver profile data:', data)
      setCaregiverData(data)
    } catch (error) {
      console.error('Error fetching caregiver profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { color: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-700', label: 'In Progress' },
      COMPLETED: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    }
    const config = statusConfig[status] || statusConfig.SCHEDULED
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get unique clients from assignments
  const getUniqueClients = () => {
    if (!caregiverData?.assignments) return []
    const clientMap = new Map()
    caregiverData.assignments.forEach(assignment => {
      if (!clientMap.has(assignment.clientId)) {
        clientMap.set(assignment.clientId, {
          id: assignment.clientId,
          name: assignment.clientName
        })
      }
    })
    return Array.from(clientMap.values())
  }

  // Filter assignments by selected client
  const getFilteredAssignments = () => {
    if (!caregiverData?.assignments) return []
    if (selectedClient === 'all') return caregiverData.assignments
    return caregiverData.assignments.filter(a => a.clientId === parseInt(selectedClient))
  }

  // Check if task has proof uploaded
  const hasProofUploaded = (task) => {
    return task.proofs && task.proofs.length > 0
  }

  // Handle proof upload
  const handleProofUpload = async (taskId, file) => {
    if (!file) return
    
    try {
      setUploadingTaskId(taskId)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('taskId', taskId)
      
      await ApiService.uploadTaskProof(taskId, formData)
      alert('✅ Proof uploaded successfully!')
      
      // Refresh caregiver profile to get updated data
      await fetchCaregiverProfile()
    } catch (error) {
      console.error('Error uploading proof:', error)
      alert('❌ Failed to upload proof. Please try again.')
    } finally {
      setUploadingTaskId(null)
    }
  }

  // Handle mark as completed
  const handleMarkComplete = async (taskId) => {
    try {
      setCompletingTaskId(taskId)
      await ApiService.updateTaskStatus(taskId, 'COMPLETED')
      alert('✅ Task marked as completed!')
      
      // Refresh caregiver profile
      await fetchCaregiverProfile()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('❌ Failed to complete task. Please try again.')
    } finally {
      setCompletingTaskId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!caregiverData || !caregiverData.caregiver) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-pale-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-pale-900 mb-2">Caregiver Not Found</h3>
        <p className="text-pale-600 mb-4">The caregiver you're looking for doesn't exist.</p>
        <Link to="/service" className="btn-primary">
          Back to Service Page
        </Link>
      </div>
    )
  }

  const { caregiver, assignments, totalAssignments, isSubscribed } = caregiverData

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/service" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to All Caregivers
      </Link>

      {/* Header Card */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-primary-600 shadow-lg">
              {caregiver.name?.charAt(0) || 'C'}
            </div>
            
            {/* Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{caregiver.name}</h1>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold">{caregiver.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-white/75">({caregiver.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{caregiver.experience || 0} years exp</span>
                </div>
              </div>
              {caregiver.verified && (
                <div className="flex items-center space-x-1 mt-2 text-green-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Verified Caregiver</span>
                </div>
              )}
            </div>
          </div>

          {/* Hourly Rate & Book Button */}
          <div className="text-right">
            <div className="text-4xl font-bold mb-2">
              Rs {((caregiver.hourlyRateCents || 0) / 100).toFixed(2)}
            </div>
            <div className="text-white/75 mb-4">per hour</div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-pale-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'about'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-pale-600 hover:text-pale-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'activity'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-pale-600 hover:text-pale-900'
            }`}
          >
            Activity
            {totalAssignments > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs">
                {totalAssignments}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' ? (
        <div className="space-y-6">
          {/* Bio */}
          {caregiver.bio && (
            <div className="card">
              <h2 className="text-xl font-semibold text-pale-900 mb-4">About</h2>
              <p className="text-pale-700 leading-relaxed">{caregiver.bio}</p>
            </div>
          )}

          {/* Skills & Services */}
          {caregiver.skills && (
            <div className="card">
              <h2 className="text-xl font-semibold text-pale-900 mb-4">Skills & Services</h2>
              <div className="flex flex-wrap gap-2">
                {caregiver.skills.split(',').map((skill, idx) => (
                  <span key={idx} className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service Types */}
          {caregiver.serviceTypes && (
            <div className="card">
              <h2 className="text-xl font-semibold text-pale-900 mb-4">Service Types</h2>
              <div className="flex flex-wrap gap-2">
                {caregiver.serviceTypes.split(',').map((type, idx) => (
                  <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {type.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Activity Tab
        <div className="space-y-6">
          <div className="card">
            {/* Header with Filter */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pale-900">Assignments</h2>
                <p className="text-pale-600 mt-1">
                  {getFilteredAssignments().length > 0 
                    ? `${getFilteredAssignments().length} assignment${getFilteredAssignments().length > 1 ? 's' : ''} ${selectedClient !== 'all' ? 'for selected client' : 'total'}`
                    : 'No assignments yet'}
                </p>
              </div>
              
              {/* Client Filter */}
              {getUniqueClients().length > 1 && (
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-pale-500" />
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="px-4 py-2 border border-pale-300 rounded-lg text-sm font-medium text-pale-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Clients ({totalAssignments})</option>
                    {getUniqueClients().map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Assignments List */}
            {getFilteredAssignments() && getFilteredAssignments().length > 0 ? (
              <div className="space-y-4">
                {getFilteredAssignments().map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-pale-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-pale-900">
                            Assignment #{assignment.id}
                          </h3>
                          {getStatusBadge(assignment.status)}
                          {assignment.active && (
                            <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-pale-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{assignment.clientName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{assignment.serviceType || 'General Service'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(assignment.scheduledAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks */}
                    {assignment.tasks && assignment.tasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-pale-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-pale-700">
                            Tasks ({assignment.taskCount})
                          </h4>
                        </div>
                        <div className="space-y-4">
                          {assignment.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="border border-pale-200 p-4 bg-white rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-pale-900">
                                      {task.title}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      task.status === 'VERIFIED' || task.status === 'LOCKED'
                                        ? 'bg-green-100 text-green-700'
                                        : task.status === 'COMPLETED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : task.status === 'AWAITING_PROOF'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-pale-600">{task.description}</p>
                                  )}
                                  {task.dueAt && (
                                    <div className="text-xs text-pale-500 mt-1">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      Due: {formatDate(task.dueAt)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Proof Upload Section */}
                              {task.status !== 'COMPLETED' && task.status !== 'VERIFIED' && task.status !== 'LOCKED' && (
                                <div className="mt-3 pt-3 border-t border-pale-100">
                                  {hasProofUploaded(task) ? (
                                    // Proof already uploaded
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">Proof uploaded</span>
                                      </div>
                                      {task.proofs && task.proofs.length > 0 && (
                                        <div className="flex items-center space-x-2">
                                          <ImageIcon className="w-4 h-4 text-pale-400" />
                                          <a 
                                            href={task.proofs[0].fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-600 hover:underline"
                                          >
                                            View proof
                                          </a>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => handleMarkComplete(task.id)}
                                        disabled={completingTaskId === task.id}
                                        className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center space-x-2"
                                      >
                                        {completingTaskId === task.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Completing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Mark as Completed</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    // Upload proof
                                    <div className="space-y-2">
                                      <label className="block">
                                        <div className="flex items-center space-x-2 text-sm font-medium text-pale-700 mb-2">
                                          <Upload className="w-4 h-4" />
                                          <span>Upload Proof (Required)</span>
                                        </div>
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleProofUpload(task.id, file)
                                          }}
                                          disabled={uploadingTaskId === task.id}
                                          className="w-full px-4 py-2 border border-pale-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                      </label>
                                      {uploadingTaskId === task.id && (
                                        <div className="flex items-center space-x-2 text-primary-600 text-sm">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                          <span>Uploading...</span>
                                        </div>
                                      )}
                                      <p className="text-xs text-pale-500">
                                        Upload proof before marking as completed (Image or PDF)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Completed Status */}
                              {(task.status === 'COMPLETED' || task.status === 'VERIFIED' || task.status === 'LOCKED') && (
                                <div className="mt-3 pt-3 border-t border-pale-100">
                                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-medium">Task Completed</span>
                                  </div>
                                  {task.proofs && task.proofs.length > 0 && (
                                    <div className="flex items-center space-x-2 mt-2">
                                      <ImageIcon className="w-4 h-4 text-pale-400" />
                                      <a 
                                        href={task.proofs[0].fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:underline"
                                      >
                                        View proof
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-pale-100">
                      <div className="flex items-center justify-between text-xs text-pale-500">
                        <span>Created: {formatDate(assignment.createdAt)}</span>
                        {assignment.startedAt && <span>Started: {formatDate(assignment.startedAt)}</span>}
                        {assignment.completedAt && <span>Completed: {formatDate(assignment.completedAt)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-pale-50 rounded-lg border-2 border-dashed border-pale-200">
                <Calendar className="w-12 h-12 text-pale-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-pale-900 mb-2">No assignments available</h3>
                <p className="text-pale-600 mb-4">
                  This caregiver hasn't received any bookings yet. Be the first to book!
                </p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="btn-primary"
                >
                  Book This Caregiver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <CaregiverModal
          caregiver={caregiver}
          isSubscribed={isSubscribed}
          onClose={() => {
            setShowBookingModal(false)
            // Refresh assignments after booking
            fetchCaregiverProfile()
          }}
        />
      )}
    </div>
  )
}

export default CaregiverPublicProfilePage
