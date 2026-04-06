import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import ApiService from '../../services/api'

const PaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [activeTab, setActiveTab] = useState('payments')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsData, subscriptionsData] = await Promise.all([
        ApiService.request('/admin/payments'),
        ApiService.request('/admin/subscriptions')
      ])
      setPayments(paymentsData)
      setSubscriptions(subscriptionsData)
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setPayments([
        { id: 1, assignment: 'Care #001', client: 'Alice Johnson', amount: 450, method: 'Credit Card', status: 'completed', date: '2025-10-15' },
        { id: 2, assignment: 'Care #002', client: 'Bob Smith', amount: 380, method: 'PayPal', status: 'pending', date: '2025-10-14' },
      ])
      setSubscriptions([
        { id: 1, name: 'Hourly Plan', price: 25, duration: 'per hour', status: 'active' },
        { id: 2, name: 'Weekly Plan', price: 800, duration: 'per week', status: 'active' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const paymentColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Assignment', accessor: 'assignment' },
    { header: 'Client', accessor: 'client' },
    { header: 'Amount', render: (row) => `$${row.amount}` },
    { header: 'Method', accessor: 'method' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Date', accessor: 'date' },
  ]

  const subscriptionColumns = [
    { header: 'Plan Name', accessor: 'name' },
    { header: 'Price', render: (row) => `$${row.price}` },
    { header: 'Duration', accessor: 'duration' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
          <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
        </div>
      )
    },
  ]

  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payment & Subscription Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Revenue This Month"
          value={`$${totalRevenue.toLocaleString()}`}
          color="green"
        />
        <StatCard
          icon={CreditCard}
          title="Total Transactions"
          value={payments.length}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Subscriptions"
          value={subscriptions.filter(s => s.status === 'active').length}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'payments'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment Ledger
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'subscriptions'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Subscription Plans
        </button>
      </div>

      {/* Content */}
      {activeTab === 'payments' ? (
        <DataTable columns={paymentColumns} data={payments} searchPlaceholder="Search payments..." />
      ) : (
        <div className="space-y-4">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Add New Plan
          </button>
          <DataTable columns={subscriptionColumns} data={subscriptions} searchable={false} />
        </div>
      )}
    </div>
  )
}

export default PaymentManagement
