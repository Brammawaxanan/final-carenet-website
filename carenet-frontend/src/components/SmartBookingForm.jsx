import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import ApiService from '../services/api'

/**
 * SMART BOOKING FORM with Auto-Scheduling & Conflict Detection
 * Features:
 * - Checks caregiver availability before booking
 * - Shows time conflicts
 * - Suggests alternative slots
 * - Auto-generates QR code on confirmation
 */
const SmartBookingForm = ({ caregiver, serviceType = 'Elderly Care', packageType = 'Weekly' }) => {
  const [selectedTime, setSelectedTime] = useState({
    date: '',
    startTime: '',
    endTime: ''
  })
  
  const [checking, setChecking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateTimes = () => {
    const newErrors = {}
    
    if (!selectedTime.date) {
      newErrors.date = 'Please select a date'
    }
    if (!selectedTime.startTime) {
      newErrors.startTime = 'Please select start time'
    }
    if (!selectedTime.endTime) {
      newErrors.endTime = 'Please select end time'
    }
    
    // Check if end time is after start time
    if (selectedTime.startTime && selectedTime.endTime) {
      const start = new Date(`${selectedTime.date}T${selectedTime.startTime}`)
      const end = new Date(`${selectedTime.date}T${selectedTime.endTime}`)
      
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatDateTime = (date, time) => {
    return new Date(`${date}T${time}:00`).toISOString()
  }

  const checkAvailability = async () => {
    if (!validateTimes()) return
    
    setChecking(true)
    setConflict(null)
    
    try {
      const startTime = formatDateTime(selectedTime.date, selectedTime.startTime)
      const endTime = formatDateTime(selectedTime.date, selectedTime.endTime)
      
      const response = await ApiService.request('/bookings/checkSchedule', {
        method: 'POST',
        body: JSON.stringify({
          caregiverId: caregiver.id,
          startTime,
          endTime
        })
      })

      if (response.hasConflict) {
        setConflict(response)
        setShowConflictModal(true)
        showToast('⚠️ Caregiver not available at this time', 'warning')
      } else {
        showToast('✅ Caregiver is available!', 'success')
        // Auto-proceed to confirmation
        setTimeout(() => confirmBooking(), 1000)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      showToast('❌ Error checking availability', 'error')
    } finally {
      setChecking(false)
    }
  }

  const confirmBooking = async () => {
    if (!validateTimes()) return
    
    setConfirming(true)
    
    try {
      const startTime = formatDateTime(selectedTime.date, selectedTime.startTime)
      const endTime = formatDateTime(selectedTime.date, selectedTime.endTime)
      
      const response = await ApiService.request('/bookings/confirm', {
        method: 'POST',
        body: JSON.stringify({
          caregiverId: caregiver.id,
          serviceType,
          packageType,
          startTime,
          endTime
        })
      })

      if (response.success) {
        showToast('✅ Booking confirmed with QR code!', 'success')
        
        console.log('✅ Booking confirmed:', {
          bookingId: response.bookingId,
          assignmentId: response.assignmentId,
          qrGenerated: !!response.qrCode
        })
        
        // Navigate to payment with booking details
        navigate('/payment', {
          state: {
            bookingId: response.bookingId,
            caregiverId: caregiver.id,
            serviceType,
            packageType,
            amount: calculateAmount(),
            qrCode: response.qrCode,
            verificationKey: response.verificationKey
          }
        })
      }
    } catch (error) {
      console.error('Booking error:', error)
      showToast('❌ Booking failed: ' + error.message, 'error')
    } finally {
      setConfirming(false)
    }
  }

  const selectSuggestedSlot = (slot) => {
    // Parse the suggested slot time
    const slotStart = new Date(slot.startTime)
    const slotEnd = new Date(slot.endTime)
    
    setSelectedTime({
      date: slotStart.toISOString().split('T')[0],
      startTime: slotStart.toTimeString().substring(0, 5),
      endTime: slotEnd.toTimeString().substring(0, 5)
    })
    
    setShowConflictModal(false)
    setConflict(null)
    showToast('✅ Alternative slot selected', 'info')
  }

  const calculateAmount = () => {
    // Calculate based on package type
    const rates = {
      'Hourly': 25,
      'Weekly': 800,
      'Monthly': 3000
    }
    return rates[packageType] || 350
  }

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-yellow-500' :
      'bg-blue-500'
    } text-white font-medium animate-fade-in-down`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 4000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-8 h-8 text-primary-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Booking</h2>
            <p className="text-sm text-gray-600">Smart conflict detection enabled</p>
          </div>
        </div>

        {/* Caregiver Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
          <p className="text-sm font-medium text-gray-700">Booking with:</p>
          <p className="text-lg font-bold text-gray-900">{caregiver.name}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>⭐ Rating: {caregiver.rating || '4.8'}</span>
            <span>💼 {serviceType}</span>
            <span>📦 {packageType} Package</span>
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="space-y-4 mb-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedTime.date}
              onChange={(e) => setSelectedTime({ ...selectedTime, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={selectedTime.startTime}
                onChange={(e) => setSelectedTime({ ...selectedTime, startTime: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={selectedTime.endTime}
                onChange={(e) => setSelectedTime({ ...selectedTime, endTime: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-6">
          <p className="text-sm font-medium text-purple-900 mb-2">✨ Smart Features:</p>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>✅ Automatic availability checking</li>
            <li>🔍 Time conflict detection</li>
            <li>💡 Alternative slot suggestions</li>
            <li>📱 QR code generation on confirmation</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={checkAvailability}
          disabled={checking || confirming}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {checking ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking Availability...
            </span>
          ) : confirming ? (
            'Confirming Booking...'
          ) : (
            'Check Availability & Book'
          )}
        </button>
      </div>

      {/* Conflict Modal */}
      {showConflictModal && conflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-900">Time Conflict Detected</h3>
                </div>
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conflict Details */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-yellow-900 mb-2">
                  ⚠️ Caregiver is not available at the selected time.
                </p>
                <p className="text-sm text-yellow-700">
                  Found {conflict.conflictCount} conflicting booking(s)
                </p>
              </div>

              {/* Suggested Slots */}
              {conflict.suggestedSlots && conflict.suggestedSlots.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">✨ Suggested Available Slots:</h4>
                  <div className="space-y-2">
                    {conflict.suggestedSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestedSlot(slot)}
                        className="w-full p-4 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border border-green-200 rounded-lg text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 text-gray-900 font-medium">
                              <Clock className="w-4 h-4 text-green-600" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Duration: {slot.duration}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Choose Different Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartBookingForm
