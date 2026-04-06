import React, { useState, useEffect } from 'react'
import { Download, FileText, Calendar, DollarSign, Filter } from 'lucide-react'
import ApiService from '../services/api'

const BillingHistoryPage = () => {
  const [billingData, setBillingData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillingHistory()
  }, [filter])

  const fetchBillingHistory = async () => {
    try {
      setLoading(true)
      // Fetch real data from backend - NO MOCK DATA
      const data = await ApiService.getBillingHistory()
      setBillingData(data)
    } catch (err) {
      console.error('Error fetching billing history:', err)
      alert('Failed to load billing history. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const transactions = billingData?.transactions || []
  const totalSpent = billingData?.totalSpent || 0

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pale-900 mb-2">Billing History</h1>
            <p className="text-pale-600">View and download your payment history</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Total Spent</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">${totalSpent.toFixed(2)}</div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Transactions</span>
          </div>
          <div className="text-3xl font-bold text-green-900">{transactions.length}</div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">This Month</span>
          </div>
          <div className="text-3xl font-bold text-amber-900">$659.99</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-pale-900">Transaction History</h2>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-pale-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              <option value="all">All Transactions</option>
              <option value="payments">Payments Only</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="refunds">Refunds</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pale-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Description</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-pale-600">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-pale-100 hover:bg-pale-50">
                  <td className="py-4 px-4 text-pale-600 text-sm">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="py-4 px-4 text-pale-900">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        transaction.type === 'payment' ? 'bg-blue-500' :
                        transaction.type === 'subscription' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}></span>
                      <span>{transaction.description}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-right font-semibold ${
                    transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Download className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default BillingHistoryPage
