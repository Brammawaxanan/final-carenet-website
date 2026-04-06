import React, { useState, useEffect } from 'react'
import { Download, DollarSign, Filter, Search, FileText } from 'lucide-react'
import ApiService from '../services/api'

/**
 * Complete Payment History Page with API integration
 * Fetches from: GET /api/payments/history
 */
const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, paid, refunded
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    setLoading(true)
    try {
      const userId = ApiService.getUserId()
      const response = await ApiService.request(`/api/payments/history?userId=${userId}`)
      
      setPayments(response.payments || [])
      console.log('✅ Loaded', response.count, 'payments')
    } catch (error) {
      console.error('Error fetching payment history:', error)
      showToast('Failed to load payment history', 'error')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async (paymentId) => {
    try {
      window.open(`${ApiService.baseURL}/api/payments/receipt/${paymentId}`, '_blank')
      showToast('📄 Downloading receipt...', 'info')
    } catch (error) {
      showToast('Failed to download receipt', 'error')
    }
  }

  const filteredPayments = payments
    .filter(payment => {
      if (filter === 'paid') return payment.status === 'completed' && !payment.isRefunded
      if (filter === 'refunded') return payment.isRefunded
      return true
    })
    .filter(payment => {
      if (!searchTerm) return true
      return payment.bookingId?.toString().includes(searchTerm) ||
             payment.method?.toLowerCase().includes(searchTerm.toLowerCase())
    })

  const totalSpent = payments
    .filter(p => p.status === 'completed' && !p.isRefunded)
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalRefunded = payments
    .filter(p => p.isRefunded)
    .reduce((sum, p) => sum + (p.amount || 0), 0)

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
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
        <p className="text-gray-600">View and manage your payment transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-blue-900">{payments.length}</p>
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
            <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
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
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex space-x-2">
              {['all', 'paid', 'refunded'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      {filteredPayments.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No payments found</p>
          <p className="text-gray-400 text-sm">
            {searchTerm || filter !== 'all' ? 'Try adjusting your filters' : 'Make a payment to see it here'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.paymentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{payment.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      #{payment.bookingId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                      Rs. {payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.receiptPath ? (
                        <button
                          onClick={() => downloadReceipt(payment.paymentId)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentHistoryPage
