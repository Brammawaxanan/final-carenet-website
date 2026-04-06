import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Star, MapPin, Clock, Shield, Calendar, Briefcase } from 'lucide-react'
import ApiService from '../services/api'

const CaregiverModal = ({ caregiver, isSubscribed, onClose }) => {
  const serviceTypes = [
    'Elder Care',
    'Child Care',
    'Pet Care',
    'Disability Support',
    'Medical Care',
    'Home Care',
    'Companionship'
  ]

  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    serviceType: serviceTypes[0],
    taskDescription: ''
  })
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const navigate = useNavigate()

  const calculateDuration = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0
    const start = new Date(bookingData.startDate)
    const end = new Date(bookingData.endDate)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  }

  const calculateTotal = () => {
    const duration = calculateDuration()
    const dailyHours = 8
    const hourlyRate = (caregiver.hourlyRateCents || 0) / 100
    return duration * dailyHours * hourlyRate
  }

  // validation part
  const handleBooking = async () => {
    if (!bookingData.serviceType) {
      alert('Please select a service type.')
      return
    }
    if (!bookingData.startDate || !bookingData.endDate) {
      alert('Please select start and end dates.')
      return
    }
    if (!isSubscribed && calculateDuration() > 1) {
      alert('Non-subscribed users can only book for 1 day.')
      return
    }
    
    // assign + tast creation + booking(api call)
    setIsBooking(true)
    try {
      const response = await ApiService.createBooking({
        caregiverId: caregiver.id,
        startDate: new Date(`${bookingData.startDate}T${bookingData.startTime}`).toISOString(),
        endDate: new Date(`${bookingData.endDate}T${bookingData.endTime}`).toISOString(),
        serviceType: bookingData.serviceType,
        taskDescription: bookingData.taskDescription || `${bookingData.serviceType} service`
      })
      
      console.log('✅ Booking successful:', response);
      console.log('📋 Assignment created:', response.assignment);
      console.log('✅ Task created:', response.task);

      const assignmentId = response.assignment?.id || response.assignmentId

      // Store the new assignment ID in localStorage
      if (assignmentId) {
        localStorage.setItem('userCurrentAssignmentId', assignmentId.toString())
        console.log('💾 Stored assignment ID:', assignmentId)
      }

      // Close modal then navigate to the payment page, passing booking details in state
      const bookingId = response.bookingId || assignmentId || null
      const amount = calculateTotal()

      onClose()

      if (bookingId) {
        navigate(`/payment/${bookingId}`, {
          state: {
            bookingId,
            caregiverId: caregiver.id,
            serviceType: bookingData.serviceType,
            packageType: bookingData.packageType || 'Standard',
            amount
          }
        })
      } else {
        // Fallback: navigate to generic payment page with state (SmartPaymentPage can fetch if needed)
        navigate('/payment', {
          state: {
            caregiverId: caregiver.id,
            serviceType: bookingData.serviceType,
            packageType: bookingData.packageType || 'Standard',
            amount
          }
        })
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-primary-600">
              {caregiver.name?.charAt(0) || 'C'}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{caregiver.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <Star className="w-4 h-4 fill-current" />
                <span>{caregiver.rating?.toFixed(1) || '5.0'}</span>
                <span className="opacity-75">({caregiver.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-pale-600">
              <Clock className="w-5 h-5" />
              <span>{caregiver.experience || 0} years experience</span>
            </div>
            <div className="flex items-center space-x-2 text-pale-600">
              <MapPin className="w-5 h-5" />
              <span>Local Area</span>
            </div>
            {caregiver.verified && (
              <div className="flex items-center space-x-2 text-green-600">
                <Shield className="w-5 h-5" />
                <span>Verified Caregiver</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {caregiver.bio && (
            <div>
              <h3 className="font-semibold text-pale-900 mb-2">About</h3>
              <p className="text-pale-600">{caregiver.bio}</p>
            </div>
          )}

          {/* Skills */}
          {caregiver.skills && (
            <div>
              <h3 className="font-semibold text-pale-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {caregiver.skills.split(',').map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Rate */}
          <div className="p-4 bg-pale-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-pale-600">Hourly Rate</span>
              <span className="text-2xl font-bold text-primary-600">
                Rs {((caregiver.hourlyRateCents || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Booking Form Toggle */}
          {!showBookingForm ? (
            <button
              onClick={() => setShowBookingForm(true)}
              className="w-full btn-primary py-3 text-lg"
            >
              Book Now
            </button>
          ) : (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-pale-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Book Service</span>
              </h3>

              {/* Service Type Selection */}
              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Service Type *
                </label>
                <select
                  value={bookingData.serviceType}
                  onChange={(e) => setBookingData({...bookingData, serviceType: e.target.value})}
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="text-xs text-pale-500 mt-1">
                  This will be added as the initial task in your Activity page
                </p>
              </div>

              {/* Task Description (Optional) */}
              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Task Description (Optional)
                </label>
                <textarea
                  value={bookingData.taskDescription}
                  onChange={(e) => setBookingData({...bookingData, taskDescription: e.target.value})}
                  placeholder={`Describe what you need for ${bookingData.serviceType}...`}
                  rows="3"
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({...bookingData, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({...bookingData, endDate: e.target.value})}
                    min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
                    className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={bookingData.endTime}
                    onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}
                    className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Summary */}
              {bookingData.startDate && bookingData.endDate && (
                <div className="p-4 bg-primary-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-pale-600">Duration</span>
                    <span className="font-medium">{calculateDuration()} day(s)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-pale-600">Service</span>
                    <span className="font-medium">{bookingData.serviceType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-pale-600">Est. Daily Hours</span>
                    <span className="font-medium">8 hours</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Estimated Total</span>
                    <span className="text-primary-600">Rs {calculateTotal().toFixed(2)}</span>
                  </div>
                  {!isSubscribed && calculateDuration() > 1 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Non-subscribed users can only book for 1 day
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-3 border border-pale-300 rounded-lg hover:bg-pale-50 transition-colors"
                  disabled={isBooking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={isBooking || !bookingData.startDate || !bookingData.endDate}
                  className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CaregiverModal