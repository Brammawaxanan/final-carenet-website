import React, { useState, useEffect } from 'react'
import { Users, Briefcase, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import ApiService from '../services/api'

const AdminDashboardPage = () => {
  const stats = {
    totalUsers: 1245,
    totalCaregivers: 342,
    activeAssignments: 89,
    monthlyRevenue: 45230,
    pendingApprovals: 12
  }

  const recentUsers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'client', joined: '2025-09-30', status: 'active' },
    { id: 2, name: 'Sarah Williams', email: 'sarah@example.com', role: 'caregiver', joined: '2025-09-29', status: 'pending' }
  ]

  const [recentReviews, setRecentReviews] = useState([])
  const [allReviews, setAllReviews] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await ApiService.getAdminDashboard()
        if (resp && resp.recentReviews) setRecentReviews(resp.recentReviews)
        if (resp && resp.allReviews) setAllReviews(resp.allReviews)
      } catch (err) {
        console.error('Failed to load admin dashboard reviews', err)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-pale-900 mb-2">Admin Dashboard</h1>
        <p className="text-pale-600">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-3xl font-bold text-blue-900 mb-1">{stats.totalUsers}</div>
          <div className="text-sm text-blue-700">Total Users</div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Briefcase className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-3xl font-bold text-green-900 mb-1">{stats.totalCaregivers}</div>
          <div className="text-sm text-green-700">Caregivers</div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CheckCircle className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-3xl font-bold text-purple-900 mb-1">{stats.activeAssignments}</div>
          <div className="text-sm text-purple-700">Active Assignments</div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <DollarSign className="w-8 h-8 text-amber-600 mb-3" />
          <div className="text-3xl font-bold text-amber-900 mb-1">${stats.monthlyRevenue.toLocaleString()}</div>
          <div className="text-sm text-amber-700">Monthly Revenue</div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
          <div className="text-3xl font-bold text-red-900 mb-1">{stats.pendingApprovals}</div>
          <div className="text-sm text-red-700">Pending Approvals</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-6">Recent Registrations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pale-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Joined</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id} className="border-b border-pale-100 hover:bg-pale-50">
                  <td className="py-3 px-4 text-pale-900">{user.name}</td>
                  <td className="py-3 px-4 text-pale-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'caregiver' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-pale-600 text-sm">{user.joined}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      {user.status === 'pending' ? 'Approve' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">Recent Client Reviews</h2>
        {recentReviews.length === 0 ? (
          <div className="text-sm text-gray-600">No recent reviews.</div>
        ) : (
          <div className="space-y-3">
            {recentReviews.map(r => (
              <div key={r.id} className="p-3 border border-pale-100 rounded-md hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-pale-900">{r.userName || `User ${r.userId}`}</div>
                    <div className="text-xs text-pale-600">{r.comment}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500">{'★'.repeat(Math.max(0, Math.round(r.rating || 0)))}{'☆'.repeat(5 - Math.max(0, Math.round(r.rating || 0)))}</div>
                    <div className="text-xs text-pale-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">All Reviews</h2>
        {(!allReviews || allReviews.length === 0) ? (
          <div className="text-sm text-gray-600">No reviews available.</div>
        ) : (
          <div className="space-y-2">
            {allReviews.map(r => (
              <div key={r.id} className="p-3 border border-pale-100 rounded-md hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-pale-900">{r.userName || `User ${r.userId}`}</div>
                    <div className="text-xs text-pale-600">{r.caregiverName ? `${r.caregiverName} • ` : ''}{r.comment}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500">{'★'.repeat(Math.max(0, Math.round(r.rating || 0)))}{'☆'.repeat(5 - Math.max(0, Math.round(r.rating || 0)))}</div>
                    <div className="text-xs text-pale-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
