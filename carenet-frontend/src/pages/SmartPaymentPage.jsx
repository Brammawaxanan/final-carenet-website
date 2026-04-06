import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import EnhancedPaymentForm from '../components/EnhancedPaymentForm'
import ApiService from '../services/api'

/**
 * Smart Payment Page - Wrapper for EnhancedPaymentForm component
 * Routes: /payment/:bookingId OR /payment/subscription
 * 
 * Gets booking details from route params and location state
 * If data not in state, fetches from backend
 * Handles both booking payments and subscription payments
 * 
 * Uses EnhancedPaymentForm with 3 payment methods:
 * - Credit Card (with save card functionality)
 * - Bank Transfer (pending verification)
 * - Cash on Delivery
 */
const SmartPaymentPage = () => {
  const { bookingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)

  // Get data from location state (passed from PaymentSummary or SubscribePage)
  const stateData = location.state || {}
  const isSubscription = bookingId === 'subscription' || stateData.paymentType === 'SUBSCRIPTION'

  // Fetch payment data if not in state
  useEffect(() => {
    // Prevent multiple fetch attempts
    let isMounted = true
    
    const fetchPaymentData = async () => {
      // For subscription, use state data directly
      if (isSubscription) {
        if (isMounted) {
          setPaymentData({
            amount: stateData.amount || 399,
            serviceType: stateData.serviceType || 'Premium Subscription',
            packageType: stateData.packageType || 'PREMIUM',
            planName: stateData.planName || 'PREMIUM',
            paymentType: 'SUBSCRIPTION'
          })
          setLoading(false)
        }
        return
      }

      // If we have amount in state, use it directly
      if (stateData.amount) {
        if (isMounted) {
          setPaymentData(stateData)
          setLoading(false)
        }
        return
      }

      // Otherwise, fetch from backend
      try {
        if (!isMounted) return
        setLoading(true)
        const summary = await ApiService.getPaymentSummary(bookingId)
        
        if (!isMounted) return
        
        // Use summary data or defaults
        setPaymentData({
          amount: summary.amount || 350.0,
          caregiverId: summary.caregiverId || stateData.caregiverId,
          serviceType: summary.serviceType || stateData.serviceType || 'Care Service',
          packageType: summary.packageType || stateData.packageType || 'Standard'
        })
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to fetch payment data:', err)
        
        // Handle different error types
        if (err.message && err.message.includes('404')) {
          setError(`Booking ID ${bookingId} not found. Please check your booking details.`)
        } else if (err.message && err.message.includes('Booking not found')) {
          setError(`Booking ID ${bookingId} not found in the system.`)
        } else {
          setError('Failed to load payment details. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (bookingId) {
      fetchPaymentData()
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
    }
  }, [bookingId, isSubscription])

  const { 
    amount = 350.0, 
    caregiverId, 
    serviceType = 'Care Service', 
    packageType = 'Standard' 
  } = paymentData || {}

  // Handle successful payment
  const handlePaymentSuccess = async (response) => {
    console.log('✅ Payment successful:', response)
    
    // If this is a subscription payment, activate the subscription
    if (isSubscription) {
      try {
        console.log('🔔 Activating subscription after payment...')
        const subscribeResponse = await ApiService.subscribe({ 
          tier: paymentData.planName || 'PREMIUM',
          paymentId: response.paymentId
        })
        console.log('✅ Subscription activated:', subscribeResponse)
        
        // Show success and navigate to dashboard
        alert(`🎉 Payment successful! Your ${paymentData.planName} subscription is now active!`)
        navigate('/user-dashboard')
      } catch (err) {
        console.error('❌ Error activating subscription:', err)
        alert(`Payment successful but subscription activation failed: ${err.message}\n\nPlease contact support.`)
        navigate('/subscribe')
      }
      return
    }
    
    // Navigate back to activity page or success page for booking payments
    const target = response.bookingId ? `/user-activity/${response.bookingId}?booking=success` : '/user-activity?booking=success'
    navigate(target)
  }

  // Validate required data
  if (!bookingId && !isSubscription) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Invalid Payment Request</h2>
          <p className="text-red-700 mb-4">Booking ID or subscription details are required to process payment.</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-4 text-pale-600">Loading payment details...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-900 mb-2">⚠️ Error Loading Payment</h2>
          <p className="text-red-700 mb-4">{error}</p>
          
          {error.includes('not found') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">💡 Troubleshooting Tips:</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Verify the booking ID is correct</li>
                <li>Check if the booking exists in your assignments</li>
                <li>Try going through the Activity page instead</li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              ← Go Back
            </button>
            <button
              onClick={() => navigate('/user-activity')}
              className="btn-primary"
            >
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <EnhancedPaymentForm
        bookingId={isSubscription ? null : parseInt(bookingId)}
        caregiverId={caregiverId}
        serviceType={serviceType}
        packageType={packageType}
        amount={amount}
        isSubscription={isSubscription}
        planName={paymentData?.planName}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default SmartPaymentPage
