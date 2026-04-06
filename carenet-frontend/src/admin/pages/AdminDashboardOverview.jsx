import React, { useState, useEffect } from 'react'
import { Users, Briefcase, FileText, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import ApiService from '../../services/api'

const AdminDashboardOverview = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [summaryData, activitiesData] = await Promise.all([
        ApiService.request('/admin/summary'),
        ApiService.request('/admin/recent-activities')
      ])
      setSummary(summaryData)
      setRecentActivities(activitiesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data for charts (replace with real data from API)
  const revenueData = summary?.revenueByMonth || [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 },
  ]

  const serviceDistribution = summary?.serviceDistribution || [
    { name: 'Elderly Care', value: 400 },
    { name: 'Child Care', value: 300 },
    { name: 'Medical Care', value: 200 },
    { name: 'Companionship', value: 100 },
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={summary?.totalUsers || 1245}
          trend={12}
          color="blue"
        />
        <StatCard
          icon={Briefcase}
          title="Active Caregivers"
          value={summary?.activeCaregivers || 342}
          trend={8}
          color="green"
        />
        <StatCard
          icon={Users}
          title="Active Clients"
          value={summary?.activeClients || 903}
          trend={15}
          color="purple"
        />
        <StatCard
          icon={FileText}
          title="Total Bookings"
          value={summary?.totalBookings || 789}
          trend={-3}
          color="amber"
        />
        <StatCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`$${(summary?.monthlyRevenue || 67000).toLocaleString()}`}
          trend={22}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="space-y-3">
          {(recentActivities.length > 0 ? recentActivities : [
            { id: 1, type: 'login', user: 'John Doe', action: 'logged in', time: '5 mins ago' },
            { id: 2, type: 'registration', user: 'Sarah Smith', action: 'registered as caregiver', time: '12 mins ago' },
            { id: 3, type: 'payment', user: 'Alice Johnson', action: 'made payment of $350', time: '1 hour ago' },
            { id: 4, type: 'booking', user: 'Bob Wilson', action: 'created new booking', time: '2 hours ago' },
            { id: 5, type: 'verification', user: 'Emma Davis', action: 'verified caregiver profile', time: '3 hours ago' },
          ]).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'login' ? 'bg-blue-500' :
                  activity.type === 'registration' ? 'bg-green-500' :
                  activity.type === 'payment' ? 'bg-amber-500' :
                  activity.type === 'booking' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardOverview
