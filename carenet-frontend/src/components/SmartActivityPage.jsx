import React, { useState, useEffect } from 'react'
import { QrCode, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import ApiService from '../services/api'

/**
 * SMART ACTIVITY PAGE with QR Code Display
 * Features:
 * - Displays QR codes for each assignment
 * - Generate QR on demand
 * - Verify QR codes
 * - Shows assignment status
 */
const SmartActivityPage = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingQR, setGeneratingQR] = useState({})
  const [verificationResult, setVerificationResult] = useState(null)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const userId = ApiService.getUserId()
      const response = await ApiService.request(`/assignments/user/${userId}`)
      setAssignments(response || [])
      console.log('✅ Loaded', response.length, 'assignments')
    } catch (error) {
      console.error('Error fetching assignments:', error)
      // Fallback to sample data for demo
      setAssignments([
        {
          id: 1,
          bookingId: 1729512000000,
          serviceType: 'Elderly Care',
          status: 'SCHEDULED',
          active: true,
          qrCode: null,
          verificationKey: null
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (assignmentId) => {
    setGeneratingQR({ ...generatingQR, [assignmentId]: true })
    
    try {
      const response = await ApiService.request(`/assignments/generateQR/${assignmentId}`, {
        method: 'POST'
      })

      if (response.success) {
        // Update assignment with new QR code
        setAssignments(assignments.map(a =>
          a.id === assignmentId
            ? { 
                ...a, 
                qrCode: response.qrCode,
                verificationKey: response.verificationKey,
                qrCodePath: response.qrCodePath
              }
            : a
        ))
        
        showToast('✅ QR Code generated successfully!', 'success')
        console.log('✅ QR generated for Assignment #' + assignmentId)
      }
    } catch (error) {
      console.error('QR generation error:', error)
      showToast('❌ Failed to generate QR code', 'error')
    } finally {
      setGeneratingQR({ ...generatingQR, [assignmentId]: false })
    }
  }

  const verifyQRCode = async (verificationKey) => {
    try {
      const response = await ApiService.request(`/assignments/verify/${verificationKey}`, {
        method: 'POST'
      })

      setVerificationResult(response)
      
      if (response.valid) {
        showToast('✅ QR Code verified successfully!', 'success')
      } else {
        showToast('❌ Invalid QR code', 'error')
      }
    } catch (error) {
      showToast('❌ Verification failed', 'error')
    }
  }

  const downloadQRCode = (assignment) => {
    // Create download link for QR code image
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${assignment.qrCode}`
    link.download = `Assignment_${assignment.id}_QRCode.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast('📥 QR Code downloaded', 'info')
  }

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-700',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
      'VERIFIED': 'bg-purple-100 text-purple-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4" />
      case 'COMPLETED':
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    } text-white font-medium animate-fade-in-down`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 4000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
        <p className="text-gray-600">View and manage your care assignments with QR verification</p>
      </div>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No assignments found</p>
          <p className="text-gray-400 text-sm mt-2">Book a caregiver to see assignments here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card hover:shadow-xl transition-shadow">
              {/* Assignment Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Assignment #{assignment.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Booking #{assignment.bookingId}
                  </p>
                </div>
                <span className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                  {getStatusIcon(assignment.status)}
                  <span>{assignment.status}</span>
                </span>
              </div>

              {/* Service Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Service Type</p>
                <p className="font-medium text-gray-900">{assignment.serviceType || 'Care Service'}</p>
              </div>

              {/* QR Code Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {assignment.qrCode ? (
                  <div className="space-y-3">
                    {/* QR Code Display */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
                      <div className="flex justify-center mb-3">
                        <img
                          src={`data:image/png;base64,${assignment.qrCode}`}
                          alt="Assignment QR Code"
                          className="w-40 h-40 border-4 border-white rounded-lg shadow-lg"
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          📱 Scan to verify this assignment
                        </p>
                        {assignment.verificationKey && (
                          <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">
                            {assignment.verificationKey}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* QR Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadQRCode(assignment)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      
                      <button
                        onClick={() => verifyQRCode(assignment.verificationKey)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Generate QR Button */
                  <button
                    onClick={() => generateQRCode(assignment.id)}
                    disabled={generatingQR[assignment.id]}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingQR[assignment.id] ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        <span>Generate QR Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Info Note */}
              {assignment.qrCode && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  💡 Share this QR code with your caregiver for task verification
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Verification Result Modal */}
      {verificationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              {verificationResult.valid ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    ✅ QR Code Verified!
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg text-left mb-4">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Assignment ID:</strong> {verificationResult.assignmentId}
                    </p>
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Booking ID:</strong> {verificationResult.bookingId}
                    </p>
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Status:</strong> {verificationResult.status}
                    </p>
                    <p className="text-sm text-green-800">
                      <strong>Service:</strong> {verificationResult.serviceType}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    ❌ Invalid QR Code
                  </h3>
                  <p className="text-red-700 mb-4">
                    {verificationResult.message || 'This QR code could not be verified'}
                  </p>
                </>
              )}
              
              <button
                onClick={() => setVerificationResult(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Info Card */}
      <div className="mt-8 card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-3">✨ Smart QR Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-700">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Unique QR code for each assignment</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Secure verification system</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Download and share QR codes</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Track assignment authenticity</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartActivityPage
