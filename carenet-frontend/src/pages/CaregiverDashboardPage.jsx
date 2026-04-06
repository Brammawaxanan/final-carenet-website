import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Briefcase, DollarSign, CheckCircle, Clock, Camera, 
  TrendingUp, Calendar, ArrowRight, Star, Crown, X
} from 'lucide-react'
import ApiService from '../services/api'

const CaregiverDashboardPage = () => {
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
      const data = await ApiService.getCaregiverDashboard()
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
      hour: '2-digit',
      minute: '2-digit'
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

  if (!dashboardData || !dashboardData.caregiver) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-pale-600 mb-4">No dashboard data available</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Caregiver Avatar */}
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
              <span className="text-white text-2xl font-bold">
                {(
                  (dashboardData.caregiverApplication && dashboardData.caregiverApplication.name) || dashboardData.caregiver.name || "C"
                )?.[0]?.toUpperCase() || "C"}
              </span>
            </div>
            
            {/* Caregiver Info */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">
                  Welcome back, {(((dashboardData.caregiverApplication && dashboardData.caregiverApplication.name) || dashboardData.caregiver.name) || '').split(' ')[0] || 'Caregiver'}!
                </h1>
                {/* Premium Badge */}
                {dashboardData.caregiver.isPremium && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md" title="Premium Member">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{dashboardData.caregiver.rating}</span>
                  <span className="opacity-75">({dashboardData.caregiver.reviewCount} reviews)</span>
                </div>
                <div className="opacity-75">•</div>
                <div>
                  Rs {(
                    // prefer caregiverApplication hourlyRateCents -> convert to main unit
                    dashboardData.caregiverApplication && dashboardData.caregiverApplication.hourlyRateCents
                      ? (dashboardData.caregiverApplication.hourlyRateCents).toLocaleString('en-LK')
                      : ((dashboardData.caregiver.hourlyRate || 0)).toLocaleString('en-LK')
                  )}/hour
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/caregiver-profile" className="px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-pale-50 font-medium transition-colors">
              Edit Profile
            </Link>
            {/* Show application status if an application exists; otherwise show Apply Now */}
            {dashboardData.caregiverApplication ? (
              <div className="px-4 py-3 bg-white/20 text-white rounded-lg font-medium">
                {dashboardData.caregiverApplication.verified ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-200" />
                    <span>Application approved</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-200" />
                    <div className="text-left">
                      <div>Application submitted</div>
                      <div className="text-xs opacity-75">ID: {dashboardData.caregiverApplication.applicationId}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/caregiver-application" className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
                Apply Now
              </Link>
            )}
            
            {dashboardData.caregiver.isPremium && (
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
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Active Assignments</span>
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{dashboardData.stats.activeAssignments}</div>
          <p className="text-sm text-blue-600 mt-2">Currently working</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Tasks Completed</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{dashboardData.stats.tasksCompleted}</div>
          <div className="flex items-center text-sm text-green-600 mt-2">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+8 this week</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Proof Uploaded</span>
            <Camera className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">{dashboardData.stats.proofUploaded}</div>
          <p className="text-sm text-purple-600 mt-2">Photos submitted</p>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Total Earned</span>
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900">Rs {dashboardData.stats.totalEarned.toLocaleString('en-LK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <Link to="/billing-history" className="text-sm text-amber-600 hover:text-amber-700 font-medium mt-2 inline-flex items-center">
            View earnings <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-pale-900">Active Assignments</h2>
          </div>

          <div className="space-y-4">
            {dashboardData.activeAssignments && dashboardData.activeAssignments.length > 0 ? (
              dashboardData.activeAssignments.map(assignment => (
              <Link
                key={assignment.id}
                to={`/caregiver-activity/${assignment.id}`}
                className="block p-4 border border-pale-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {assignment.clientAvatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-pale-900">{assignment.clientName}</h3>
                      <p className="text-sm text-pale-600">{assignment.service}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-pale-600">Progress</span>
                    <span className="font-medium text-pale-900">
                      {assignment.tasksCompleted}/{assignment.tasksTotal} tasks
                    </span>
                  </div>
                  <div className="h-2 bg-pale-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{ width: `${(assignment.tasksCompleted / assignment.tasksTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Next Task */}
                {assignment.nextTask && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-600 mb-1">Next Task</p>
                        <p className="font-medium text-blue-900">{assignment.nextTask.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600">Due</p>
                        <p className="text-sm font-medium text-blue-900">{formatDate(assignment.nextTask.dueAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {!assignment.nextTask && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">No pending tasks</p>
                  </div>
                )}
              </Link>
            ))
            ) : (
              <div className="text-center py-8 text-pale-600">
                <p>No active assignments</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-pale-900">Today's Tasks</h2>
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {dashboardData.pendingTasks?.length || 0}
            </span>
          </div>

          <div className="space-y-3">
            {dashboardData.pendingTasks && dashboardData.pendingTasks.length > 0 ? (
              dashboardData.pendingTasks.map(task => (
              <div
                key={task.id}
                className="p-3 bg-pale-50 rounded-lg hover:bg-blue-50 border border-pale-200 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-pale-900 text-sm">{task.title}</h4>
                  <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-pale-600 mb-1">{task.clientName}</p>
                <p className="text-xs text-pale-500">{formatDate(task.dueAt)}</p>
              </div>
            ))
            ) : (
              <div className="text-center py-8 text-pale-600">
                <p>No pending tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Earnings */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-pale-900">Recent Earnings</h2>
          <Link to="/billing-history" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pale-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-pale-600">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentEarnings && dashboardData.recentEarnings.length > 0 ? (
                dashboardData.recentEarnings.map(earning => (
                <tr key={earning.id} className="border-b border-pale-100 hover:bg-pale-50">
                  <td className="py-3 px-4 text-pale-900">{earning.clientName}</td>
                  <td className="py-3 px-4 text-pale-600 text-sm">{formatDate(earning.date)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-pale-900">
                    Rs {earning.amount.toLocaleString('en-LK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-pale-600">
                    No recent earnings
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CaregiverDashboardPage
