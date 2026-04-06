import React, { useState, useEffect } from 'react'
import { Download, DollarSign, Calendar, CreditCard, FileText, TrendingUp } from 'lucide-react'
import ApiService from '../services/api'
import UpcomingPayments from '../components/UpcomingPayments'

/**
 * Unified Payment Dashboard - Shows both history and upcoming payments
 */
const PaymentDashboard = () => {
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history') // 'history' or 'upcoming'

  useEffect(() => {
    fetchPaymentData()
  }, [])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Fetching payment data...')
      const userId = ApiService.getUserId()
      console.log('User ID:', userId)
      
      // Fetch payment history
      const historyData = await ApiService.getBillingHistory(userId)
      console.log('✅ Payment History Response:', historyData)
      
      setPaymentHistory(historyData.payments || [])
      
    } catch (error) {
      console.error('❌ Error fetching payment data:', error)
      setPaymentHistory([])
    } finally {
      setLoading(false)
    }
  }

  const totalSpent = paymentHistory
    .filter(p => !p.isRefunded)
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalRefunded = paymentHistory
    .filter(p => p.isRefunded)
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
        <p className="text-gray-600">Manage your payments and subscriptions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-900">{paymentHistory.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-green-900">Rs. {totalSpent.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">Refunded</p>
              <p className="text-3xl font-bold text-purple-900">Rs. {totalRefunded.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-1">Net Total</p>
              <p className="text-3xl font-bold text-amber-900">Rs. {(totalSpent - totalRefunded).toFixed(2)}</p>
            </div>
            <CreditCard className="w-12 h-12 text-amber-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming Payments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' ? (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment History</h2>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payments Yet</h3>
              <p className="text-gray-500 mb-4">You haven't made any payments yet.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Testing Tip:</strong> Run the SQL script to add test data:
                </p>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-2 block">
                  mysql -u root -p CareNet &lt; seed_payment_data.sql
                </code>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{payment.paymentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        #{payment.bookingId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                        <span className={payment.isRefunded ? 'text-red-600' : 'text-green-700'}>
                          Rs. {payment.amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          payment.isRefunded
                            ? 'bg-purple-100 text-purple-700'
                            : payment.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.isRefunded ? 'Refunded' : payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {payment.receiptPath ? (
                          <a
                            href={`${ApiService.baseURL}/api/payments/receipt/${payment.paymentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 inline-flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-xs">Download</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <UpcomingPayments />
        </div>
      )}
    </div>
  )
}

export default PaymentDashboard
