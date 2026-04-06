import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, Activity, Clock, CheckCircle, DollarSign, Calendar, 
  AlertCircle, Crown, TrendingUp, FileText, ArrowRight, X 
} from 'lucide-react'
import ApiService from '../services/api'

const UserDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancellingSubscription, setCancellingSubscription] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch real data from backend - NO MOCK DATA
      const data = await ApiService.getUserDashboard()
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      alert('Failed to load dashboard data. Please check if backend is running and you are logged in.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Premium subscription? You will lose access to premium features immediately.')) {
      return
    }

    try {
      setCancellingSubscription(true)
      console.log('Cancelling subscription...')
      const response = await ApiService.cancelSubscription()
      console.log('Cancel subscription response:', response)
      
      if (response.success) {
        alert('Subscription cancelled successfully. You are now on the FREE plan.')
        // Refresh dashboard data to reflect changes
        fetchDashboardData()
      } else {
        alert(`Failed to cancel subscription: ${response.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      alert(`Error cancelling subscription: ${err.message || 'Please try again later'}`)
    } finally {
      setCancellingSubscription(false)
    }
  }

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
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">
                {dashboardData.user.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            
            {/* Welcome Message */}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-pale-900">
                  Welcome back, {dashboardData.user.name.split(' ')[0]}!
                </h1>
                {/* Premium Badge */}
                {dashboardData.user.isSubscribed && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md" title="Premium Member">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <p className="text-pale-600 mt-1">Here's what's happening with your care services</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!dashboardData.user.isSubscribed ? (
              <Link to="/subscribe" className="btn-primary flex items-center space-x-2">
                <Crown className="w-5 h-5" />
                <span>Upgrade to Premium</span>
              </Link>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                <span>{cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary-700">Active Assignments</span>
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-bold text-primary-900">{dashboardData.stats.activeAssignments}</div>
          <Link to="/service" className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-flex items-center">
            Find more caregivers <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Pending Verifications</span>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900">{dashboardData.stats.pendingVerifications}</div>
          <p className="text-sm text-amber-600 mt-2">Tasks awaiting your review</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Completed Tasks</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{dashboardData.stats.completedTasks}</div>
          <p className="text-sm text-green-600 mt-2">Successfully verified</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Total Spent</span>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">
            Rs {typeof dashboardData.stats.totalSpent === 'number' ? dashboardData.stats.totalSpent.toLocaleString('en-LK', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
          </div>
          <Link to="/billing-history" className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2 inline-flex items-center">
            View billing history <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Additional Stats Row */}
      {dashboardData.stats.totalTasks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">In Progress</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{dashboardData.stats.inProgressTasks || 0}</div>
            <p className="text-sm text-blue-600 mt-1">Tasks being worked on</p>
          </div>

          <div className="card bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Upcoming</span>
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{dashboardData.stats.draftTasks || 0}</div>
            <p className="text-sm text-slate-600 mt-1">Scheduled tasks</p>
          </div>

          <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">Total Tasks</span>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">{dashboardData.stats.totalTasks || 0}</div>
            <p className="text-sm text-indigo-600 mt-1">All time</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <Link to="/service" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {dashboardData.recentAssignments.map(assignment => (
              <Link
                key={assignment.id}
                to={`/user-activity/${assignment.id}`}
                className="block p-4 border border-pale-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {assignment.caregiverAvatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-pale-900">{assignment.caregiverName}</h3>
                      <p className="text-sm text-pale-600">{assignment.service}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-pale-500">Started</p>
                    <p className="font-medium text-pale-900">{formatDate(assignment.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-pale-500">Completed</p>
                    <p className="font-medium text-green-600">{assignment.tasksCompleted} tasks</p>
                  </div>
                  <div>
                    <p className="text-pale-500">Pending</p>
                    <p className="font-medium text-amber-600">{assignment.tasksPending} tasks</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-pale-900">Needs Verification</h2>
            <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {dashboardData.stats.pendingVerifications}
            </span>
          </div>

          <div className="space-y-3">
            {dashboardData.pendingTasks.map(task => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-3 bg-pale-50 rounded-lg hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-pale-900 text-sm">{task.title}</h4>
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-pale-600">{task.caregiverName}</p>
                <p className="text-xs text-pale-500 mt-1">{formatDate(task.dueAt)}</p>
              </Link>
            ))}
          </div>

          <Link
            to="/user-activity"
            className="mt-4 block text-center py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all pending →
          </Link>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-pale-900">Upcoming Payments</h2>
          <Link to="/billing-history" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.upcomingPayments.map(payment => (
            <div key={payment.id} className="p-4 border border-pale-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-pale-600">Assignment #{payment.assignmentId}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                  Due {formatDate(payment.dueDate)}
                </span>
              </div>
              <p className="font-semibold text-pale-900 mb-1">{payment.caregiverName}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-pale-900">${payment.amount.toFixed(2)}</span>
                <Link
                  to="/billing-history"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>  
  )
}

export default UserDashboardPage
