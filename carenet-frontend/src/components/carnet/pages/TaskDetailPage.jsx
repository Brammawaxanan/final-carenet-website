import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, User, Calendar, FileText, Camera, CheckCircle, Edit3, Trash2, AlertCircle } from 'lucide-react'
import ApiService from '../services/api'

const TaskDetailPage = () => {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('client') // or 'caregiver'

  useEffect(() => {
    fetchTaskDetails()
  }, [taskId])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      // Fetch real data from backend - NO MOCK DATA
      // Note: Backend doesn't have individual task endpoint yet
      // We'll fetch from activity overview and find the specific task
      const assignmentId = localStorage.getItem('currentAssignmentId') || 1
      const data = await ApiService.getActivityOverview(assignmentId)
      const foundTask = data.tasks?.find(t => t.id === parseInt(taskId))
      
      if (foundTask) {
        // Map backend data to frontend format
        setTask({
          ...foundTask,
          proofImages: foundTask.proofs || [],
          assignedTo: 'Caregiver', // From assignment data
          statusHistory: [
            { status: foundTask.status, timestamp: foundTask.updatedAt, user: foundTask.createdBy }
          ]
        })
      }
    } catch (err) {
      console.error('Error fetching task details:', err)
      alert('Failed to load task details. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      await ApiService.verifyTask(taskId)
      alert('Task verified successfully!')
      fetchTaskDetails()
    } catch (err) {
      alert('Failed to verify task')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      await ApiService.deleteTask(taskId)
      alert('Task deleted successfully!')
      navigate(-1)
    } catch (err) {
      alert('Failed to delete task')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-pale-100 text-pale-700 border-pale-300',
      AWAITING_PROOF: 'bg-amber-100 text-amber-700 border-amber-300',
      COMPLETED: 'bg-blue-100 text-blue-700 border-blue-300',
      VERIFIED: 'bg-green-100 text-green-700 border-green-300'
    }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[status] || styles.DRAFT}`}>
        {status?.replace('_', ' ')}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-pale-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Task not found</h3>
        <button onClick={() => navigate(-1)} className="mt-4 btn-secondary">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {userRole === 'client' && (
          <div className="flex items-center space-x-3">
            <Link to={`/tasks/${taskId}/edit`} className="btn-secondary flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </Link>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="card">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-pale-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-pale-900">{task.title}</h1>
              {getStatusBadge(task.status)}
            </div>
            <p className="text-pale-600">{task.description}</p>
          </div>
        </div>

        {/* Task Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-pale-200">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-pale-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-pale-700">Due Date</p>
              <p className="text-pale-900">{formatDate(task.dueAt)}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-pale-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-pale-700">Created</p>
              <p className="text-pale-900">{formatDate(task.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-pale-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-pale-700">Created By</p>
              <p className="text-pale-900">{task.createdBy}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-pale-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-pale-700">Assigned To</p>
              <p className="text-pale-900">{task.assignedTo}</p>
            </div>
          </div>
        </div>

        {/* Proof Images */}
        {task.proofImages && task.proofImages.length > 0 && (
          <div className="mb-6 pb-6 border-b border-pale-200">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="w-5 h-5 text-pale-600" />
              <h3 className="font-semibold text-pale-900">Proof of Completion</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {task.proofImages.map(image => (
                <div key={image.id} className="group relative aspect-video rounded-lg overflow-hidden border border-pale-200 hover:shadow-lg transition-all">
                  <img
                    src={image.url}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-lg text-sm font-medium">
                      View Full Size
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-pale-600">
                    {formatDate(image.uploadedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div className="mb-6 pb-6 border-b border-pale-200">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-pale-600" />
              <h3 className="font-semibold text-pale-900">Notes</h3>
            </div>
            <p className="text-pale-700 bg-pale-50 p-4 rounded-lg">{task.notes}</p>
          </div>
        )}

        {/* Status History */}
        <div>
          <h3 className="font-semibold text-pale-900 mb-4">Status History</h3>
          <div className="space-y-3">
            {task.statusHistory.map((history, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-pale-900">{history.status.replace('_', ' ')}</p>
                    <p className="text-sm text-pale-500">{formatDate(history.timestamp)}</p>
                  </div>
                  <p className="text-sm text-pale-600">by {history.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {task.status === 'COMPLETED' && userRole === 'client' && (
          <div className="mt-6 pt-6 border-t border-pale-200">
            <button onClick={handleVerify} className="w-full btn-primary flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Verify Task Completion</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDetailPage
