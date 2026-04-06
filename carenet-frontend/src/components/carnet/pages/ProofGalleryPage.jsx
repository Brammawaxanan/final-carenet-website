import React, { useState, useEffect } from 'react'
import { Camera, Calendar, User, Download, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import ApiService from '../services/api'

const ProofGalleryPage = () => {
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('all') // all, recent, specific-assignment

  useEffect(() => {
    fetchProofs()
  }, [filter])

  const fetchProofs = async () => {
    try {
      setLoading(true)
      // Fetch real data from backend - NO MOCK DATA
      // Get all assignments and collect proofs from their tasks
      const assignments = await ApiService.getMyAssignments()
      const allProofs = []
      
      for (const assignment of assignments) {
        const activityData = await ApiService.getActivityOverview(assignment.id)
        if (activityData.tasks) {
          activityData.tasks.forEach(task => {
            if (task.proofs && task.proofs.length > 0) {
              task.proofs.forEach(proof => {
                allProofs.push({
                  ...proof,
                  taskTitle: task.title,
                  assignmentId: assignment.id,
                  caregiverName: assignment.caregiverName || 'Caregiver',
                  imageUrl: proof.fileUrl,
                  verified: task.status === 'VERIFIED'
                })
              })
            }
          })
        }
      }
      
      setProofs(allProofs)
    } catch (err) {
      console.error('Error fetching proofs:', err)
      alert('Failed to load proof gallery. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = (proof) => {
    // Mock download
    console.log('Downloading:', proof.imageUrl)
    alert('Image download started!')
  }

  const openLightbox = (proof) => {
    setSelectedImage(proof)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateLightbox = (direction) => {
    const currentIndex = proofs.findIndex(p => p.id === selectedImage.id)
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % proofs.length 
      : (currentIndex - 1 + proofs.length) % proofs.length
    setSelectedImage(proofs[newIndex])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-pale-900 mb-2">Proof Gallery</h1>
            <p className="text-pale-600">Visual documentation of completed tasks</p>
          </div>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-primary-600" />
            <span className="text-lg font-semibold text-pale-900">{proofs.length} Photos</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFilter('all')}
            className={`filter-pill ${filter === 'all' ? 'filter-pill-active' : ''}`}
          >
            All Photos
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`filter-pill ${filter === 'recent' ? 'filter-pill-active' : ''}`}
          >
            Recent
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`filter-pill ${filter === 'verified' ? 'filter-pill-active' : ''}`}
          >
            Verified Only
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {proofs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {proofs.map(proof => (
            <div key={proof.id} className="card group hover:shadow-xl transition-all duration-200 p-0 overflow-hidden">
              {/* Image */}
              <div className="relative aspect-video bg-pale-100 overflow-hidden">
                <img
                  src={proof.imageUrl}
                  alt={proof.taskTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                    <button
                      onClick={() => openLightbox(proof)}
                      className="p-2 bg-white rounded-lg hover:bg-pale-100 transition-colors"
                      title="View Full Size"
                    >
                      <Maximize2 className="w-5 h-5 text-pale-900" />
                    </button>
                    <button
                      onClick={() => handleDownload(proof)}
                      className="p-2 bg-white rounded-lg hover:bg-pale-100 transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-pale-900" />
                    </button>
                  </div>
                </div>

                {/* Verified Badge */}
                {proof.verified && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <span>✓</span>
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-pale-900 mb-2">{proof.taskTitle}</h3>
                <div className="space-y-1 text-sm text-pale-600">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{proof.caregiverName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(proof.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Camera className="w-16 h-16 text-pale-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-pale-900 mb-2">No proof images yet</h3>
          <p className="text-pale-600">Proof photos uploaded by caregivers will appear here</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={() => navigateLightbox('prev')}
            className="absolute left-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => navigateLightbox('next')}
            className="absolute right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Image */}
          <div className="max-w-5xl max-h-[90vh] flex flex-col">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.taskTitle}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            
            {/* Image Info */}
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-pale-900 mb-2">{selectedImage.taskTitle}</h3>
              <div className="flex items-center justify-between text-sm text-pale-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{selectedImage.caregiverName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedImage.uploadedAt)}</span>
                  </span>
                </div>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProofGalleryPage
