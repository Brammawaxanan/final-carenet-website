import React, { useState, useEffect } from 'react'
import { Download, CreditCard, CheckCircle, Clock, AlertCircle, RefreshCw, Mail } from 'lucide-react'
import ApiService from '../../services/api'
import eventBus from '../../lib/events'
import { useNavigate } from 'react-router-dom'

/**
 * Unified Payment Summary Component for Activity Pages
 * Works for both CLIENT and CAREGIVER roles
 * 
 * @param {Object} props
 * @param {number} props.bookingId - The booking ID to display payment for
 * @param {string} props.role - User role: 'CLIENT' or 'CAREGIVER'
 */
const PaymentSummary = ({ bookingId, role }) => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()

  // Fetch payment summary
  const fetchSummary = async () => {
    if (!bookingId) {
      console.warn('⚠️ No bookingId provided to PaymentSummary')
      setError('No booking ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching payment summary for bookingId:', bookingId)
      
      const response = await ApiService.request(`/api/payments/summary?bookingId=${bookingId}`)
      
      console.log('✅ Payment summary loaded:', response)
      setSummary(response)
      
    } catch (err) {
      console.error('❌ Failed to load payment summary:', err)
      
      // Provide helpful error messages
      if (err.message && err.message.includes('404')) {
        setError(`Booking ${bookingId} not found. Please check if this booking exists in your assignments.`)
      } else if (err.message && err.message.includes('Booking not found')) {
        setError(`Booking ${bookingId} not found in the system.`)
      } else {
        setError(err.message || 'Failed to load payment information')
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (bookingId) {
      fetchSummary()
    }
  }, [bookingId])

  // Listen for payment confirmation events to auto-refresh
  useEffect(() => {
    const unsubscribe = eventBus.on('payment:confirmed', (data) => {
      if (data.bookingId === bookingId) {
        console.log('💰 Payment confirmed event received, refreshing summary...')
        fetchSummary()
      }
    })

    return unsubscribe
  }, [bookingId])

  // Resend receipt email
  const handleResendReceipt = async () => {
    if (!summary?.paymentId) return

    setResending(true)
    try {
      const response = await ApiService.request(
        `/api/payments/resend-receipt/${summary.paymentId}`,
        { method: 'POST' }
      )

      if (response.success) {
        showToast('Receipt email resent successfully! ✅', 'success')
        // Refresh summary to update email status
        fetchSummary()
      } else {
        showToast('Failed to resend receipt: ' + response.message, 'error')
      }
    } catch (err) {
      console.error('Failed to resend receipt:', err)
      showToast('Failed to resend receipt email', 'error')
    } finally {
      setResending(false)
    }
  }

  // Navigate to payment form
  const handlePayNow = () => {
    // Navigate to SmartPaymentPage with all required data
    navigate(`/payment/${bookingId}`, {
      state: { 
        bookingId,
        amount: summary?.amount || 350.0, // Default amount if not set
        caregiverId: summary?.caregiverId,
        serviceType: summary?.serviceType,
        packageType: summary?.packageType || 'Standard'
      }
    })
  }

  // Download receipt
  const handleDownloadReceipt = () => {
    if (summary?.paymentId) {
      window.open(`${ApiService.baseURL}/api/payments/receipt/${summary.paymentId}`, '_blank')
      showToast('📄 Downloading receipt...', 'info')
    }
  }

  // Toast notification helper
  const showToast = (message, type = 'info') => {
    // Simple console logging for now - integrate with your toast system
    console.log(`[${type.toUpperCase()}] ${message}`)
    
    // If you have a toast library, call it here
    // e.g., toast[type](message)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Failed to Load Payment</h3>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={fetchSummary}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state (should not happen if booking exists)
  if (!summary) {
    return (
      <div className="card border-gray-200 bg-gray-50">
        <div className="text-center py-6">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No payment information available</p>
        </div>
      </div>
    )
  }

  const { status, amount, method, paidAt, receiptPath, emailQueued, hasSubscription, nextBilling, viewerRole } = summary
  const isClient = viewerRole === 'CLIENT' || role === 'CLIENT'

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
        <CreditCard className="w-6 h-6 text-blue-600" />
      </div>

      {/* Status-based display */}
      {status === 'PAID' ? (
        <>
          {/* PAID Status */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Payment Completed</h3>
                <p className="text-sm text-green-700">
                  This booking has been paid in full
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Amount Paid</span>
              <span className="font-bold text-green-700 text-lg">Rs. {amount?.toFixed(2)}</span>
            </div>

            {method && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Payment Method</span>
                <span className="font-medium text-gray-900">{method}</span>
              </div>
            )}

            {paidAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Paid On</span>
                <span className="font-medium text-gray-700">{formatDate(paidAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Download Receipt */}
            {receiptPath && (
              <button
                onClick={handleDownloadReceipt}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Receipt</span>
              </button>
            )}

            {/* Email Status & Resend (Client only) */}
            {isClient && (
              <>
                {emailQueued === false && receiptPath && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2 mb-2">
                      <Mail className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800 font-medium">Email delivery pending</p>
                        <p className="text-xs text-yellow-700 mt-1">Receipt email may not have been sent</p>
                      </div>
                    </div>
                    <button
                      onClick={handleResendReceipt}
                      disabled={resending}
                      className="w-full btn-secondary text-sm flex items-center justify-center space-x-2 mt-2"
                    >
                      {resending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Resend Receipt Email</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </>
      ) : status === 'PENDING' ? (
        <>
          {/* PENDING Status */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">Payment Pending</h3>
                <p className="text-sm text-amber-700">
                  {isClient ? 'Complete payment to confirm this booking' : 'Awaiting client payment'}
                </p>
              </div>
            </div>
          </div>

          {/* Pay Now Button (Client only) */}
          {isClient && (
            <button
              onClick={handlePayNow}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Pay Now</span>
            </button>
          )}

          {/* Caregiver view - read-only message */}
          {!isClient && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Payment will be processed by the client
            </div>
          )}
        </>
      ) : status === 'REFUNDED' ? (
        <>
          {/* REFUNDED Status */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-1">Payment Refunded</h3>
                <p className="text-sm text-purple-700">
                  This payment has been refunded
                </p>
              </div>
            </div>
          </div>

          {/* Refund Details */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Refunded Amount</span>
              <span className="font-semibold text-purple-700">Rs. {amount?.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Unknown payment status
        </div>
      )}

      {/* Subscription Info (if applicable) */}
      {hasSubscription && nextBilling && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Active Subscription</p>
                <p className="text-xs text-blue-700 mt-1">
                  Next charge on {formatDate(nextBilling)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentSummary
