import React, { useState } from 'react'
import { Download, Calendar, TrendingUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ApiService from '../../services/api'

const ReportsAnalytics = () => {
  const [dateFrom, setDateFrom] = useState('2025-01-01')
  const [dateTo, setDateTo] = useState('2025-10-15')
  const [loading, setLoading] = useState(false)

  const revenueData = [
    { month: 'Jan', revenue: 45000, bookings: 120 },
    { month: 'Feb', revenue: 52000, bookings: 135 },
    { month: 'Mar', revenue: 48000, bookings: 128 },
    { month: 'Apr', revenue: 61000, bookings: 152 },
    { month: 'May', revenue: 55000, bookings: 145 },
    { month: 'Jun', revenue: 67000, bookings: 168 },
  ]

  const topCaregivers = [
    { name: 'Sarah Williams', rating: 4.9, bookings: 45 },
    { name: 'Mike Johnson', rating: 4.8, bookings: 42 },
    { name: 'Emma Davis', rating: 4.7, bookings: 38 },
    { name: 'John Smith', rating: 4.6, bookings: 35 },
  ]

  const serviceData = [
    { service: 'Elderly Care', count: 350 },
    { service: 'Child Care', count: 280 },
    { service: 'Medical Support', count: 180 },
    { service: 'Companionship', count: 120 },
  ]

  const handleExport = async (format) => {
    setLoading(true)
    try {
      const response = await ApiService.request(`/admin/reports?from=${dateFrom}&to=${dateTo}&format=${format}`)
      // Handle download
      alert(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">Generate and export detailed reports</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center space-x-4 flex-wrap">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex-1" />
          <button
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Caregivers & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Caregivers */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Caregivers by Rating</h3>
          </div>
          <div className="space-y-3">
            {topCaregivers.map((caregiver, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{caregiver.name}</p>
                    <p className="text-xs text-gray-500">{caregiver.bookings} bookings</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{caregiver.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Requested Services */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Requested Services</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="service" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ReportsAnalytics
