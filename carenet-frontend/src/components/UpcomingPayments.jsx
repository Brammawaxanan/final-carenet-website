import React, { useState, useEffect } from 'react'
import { Calendar, DollarSign, CreditCard, X } from 'lucide-react'
import ApiService from '../services/api'

/**
 * Upcoming Subscription Payments Component
 * Fetches from: GET /api/payments/upcoming
 */
const UpcomingPayments = () => {
  const [upcomingPayments, setUpcomingPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingPayments()
  }, [])

  const fetchUpcomingPayments = async () => {
    setLoading(true)
    try {
      const userId = ApiService.getUserId()
      const response = await ApiService.request(`/api/payments/upcoming?userId=${userId}`)
      
      setUpcomingPayments(response.upcomingPayments || [])
      console.log('✅ Loaded', response.count, 'upcoming payments')
    } catch (error) {
      console.error('Error fetching upcoming payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelAutoPay = (subscriptionId) => {
    // Stub for now
    console.log('Cancel auto-pay for subscription:', subscriptionId)
    showToast('Auto-pay cancellation is not yet implemented', 'info')
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getBadgeColor = (billingCycle) => {
    switch (billingCycle) {
      case 'MONTHLY':
        return 'bg-blue-100 text-blue-700'
      case 'QUARTERLY':
        return 'bg-purple-100 text-purple-700'
      case 'YEARLY':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments</h3>
        <Calendar className="w-5 h-5 text-primary-600" />
      </div>

      {upcomingPayments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No upcoming payments</p>
          <p className="text-gray-400 text-sm">You don't have any active subscriptions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingPayments.map((payment) => (
            <div
              key={payment.subscriptionId}
              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{payment.plan} Plan</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(payment.billingCycle)}`}>
                      {payment.billingCycle}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>Next billing: {formatDate(payment.nextBillingDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-green-700">
                        Rs. {payment.amount?.toFixed(2)}
                      </span>
                    </div>
                    
                    {payment.paymentMethod && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CreditCard className="w-4 h-4" />
                        <span>{payment.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => cancelAutoPay(payment.subscriptionId)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancel Auto-Pay"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>

              <div className="pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  💡 Payment will be automatically charged to your saved payment method
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcomingPayments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total upcoming charges:</span>
            <span className="text-lg font-bold text-gray-900">
              Rs. {upcomingPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpcomingPayments
