import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter, CheckCircle, Clock, FileText, X, Image as ImageIcon } from 'lucide-react'
import ApiService from '../services/api'

const AdminTaskManagementPage = () => {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    caregiverId: '',
    status: 'DRAFT',
    dueAt: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, clientsData, caregiversData] = await Promise.all([
        ApiService.getAdminTasks(),
        ApiService.getAdminClients(),
        ApiService.getAdminCaregivers()
      ])
      setTasks(tasksData || [])
      setClients(clientsData || [])
      setCaregivers(caregiversData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      clientId: '',
      caregiverId: '',
      status: 'DRAFT',
      dueAt: ''
    })
    setShowCreateModal(true)
  }

  const handleEdit = (task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      caregiverId: task.caregiverId || '',
      status: task.status,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : ''
    })
    setShowEditModal(true)
  }

  const handleView = async (task) => {
    try {
      const detailedTask = await ApiService.getAdminTaskById(task.id)
      setSelectedTask(detailedTask)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error fetching task details:', error)
      alert('Failed to load task details')
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      await ApiService.deleteAdminTask(taskId)
      alert('✅ Task deleted successfully!')
      loadData()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task.')
    }
  }

  const handleSubmitCreate = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.clientId || !formData.caregiverId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const taskData = {
        ...formData,
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null
      }
      await ApiService.createAdminTask(taskData)
      alert('✅ Task created successfully!')
      setShowCreateModal(false)
      loadData()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task.')
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.clientId || !formData.caregiverId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const taskData = {
        ...formData,
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null
      }
      await ApiService.updateAdminTask(selectedTask.id, taskData)
      alert('✅ Task updated successfully!')
      setShowEditModal(false)
      loadData()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task.')
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.caregiverName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-yellow-100 text-yellow-700',
      VERIFIED: 'bg-green-100 text-green-700'
    }
    return badges[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4" />
      case 'COMPLETED':
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-pale-600">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pale-900 mb-2">Task Management</h1>
            <p className="text-pale-600">Manage all tasks across clients and caregivers</p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-3xl font-bold text-blue-900 mb-1">{tasks.length}</div>
          <div className="text-sm text-blue-700">Total Tasks</div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-900 mb-1">
            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-sm text-yellow-700">In Progress</div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-3xl font-bold text-green-900 mb-1">
            {tasks.filter(t => t.status === 'VERIFIED').length}
          </div>
          <div className="text-sm text-green-700">Verified</div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {tasks.filter(t => t.proofsCount > 0).length}
          </div>
          <div className="text-sm text-purple-700">With Proofs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks, clients, or caregivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-pale-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pale-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Task ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Caregiver</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Proofs</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-pale-600">Created</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-pale-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-pale-600">
                    No tasks found. Create your first task to get started.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="border-b border-pale-100 hover:bg-pale-50">
                    <td className="py-3 px-4 text-pale-900 font-medium">#{task.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-pale-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-pale-600 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-pale-900">{task.clientName || 'N/A'}</td>
                    <td className="py-3 px-4 text-pale-900">{task.caregiverName || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {task.proofsCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-pale-600 text-sm">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(task)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateModal || showEditModal) && (
        <TaskFormModal
          isOpen={showCreateModal || showEditModal}
          isEdit={showEditModal}
          task={selectedTask}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          caregivers={caregivers}
          onSubmit={showCreateModal ? handleSubmitCreate : handleSubmitEdit}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
          }}
        />
      )}

      {/* View Task Modal */}
      {showViewModal && selectedTask && (
        <TaskViewModal
          task={selectedTask}
          onClose={() => setShowViewModal(false)}
          getStatusBadge={getStatusBadge}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  )
}

// Task Form Modal Component
const TaskFormModal = ({ isOpen, isEdit, task, formData, setFormData, clients, caregivers, onSubmit, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-pale-900">
              {isEdit ? `Edit Task #${task?.id}` : 'Create New Task'}
            </h2>
            <button onClick={onClose} className="text-pale-400 hover:text-pale-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Client *
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Caregiver *
                </label>
                <select
                  required
                  value={formData.caregiverId}
                  onChange={(e) => setFormData({ ...formData, caregiverId: e.target.value })}
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Caregiver</option>
                  {caregivers.map(caregiver => (
                    <option key={caregiver.id} value={caregiver.id}>
                      {caregiver.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                  className="w-full px-4 py-2 border border-pale-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This task will be assigned from <strong>{clients.find(c => c.id == formData.clientId)?.name || 'selected client'}</strong> to <strong>{caregivers.find(c => c.id == formData.caregiverId)?.name || 'selected caregiver'}</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-pale-300 rounded-lg hover:bg-pale-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2"
              >
                {isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Task View Modal Component
const TaskViewModal = ({ task, onClose, getStatusBadge, getStatusIcon }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-pale-900">Task Details #{task.id}</h2>
            <button onClick={onClose} className="text-pale-400 hover:text-pale-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Task Info */}
            <div>
              <h3 className="text-lg font-semibold text-pale-900 mb-3">Task Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-pale-600">Title</label>
                  <div className="font-medium text-pale-900">{task.title}</div>
                </div>
                <div>
                  <label className="text-sm text-pale-600">Status</label>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(task.status)}`}>
                      {getStatusIcon(task.status)}
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-pale-600">Description</label>
                  <div className="text-pale-900">{task.description || 'No description'}</div>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Assignment Relationship</h3>
              <div className="text-blue-800">
                <p className="mb-2">
                  <strong>Client:</strong> {task.clientName || 'N/A'} assigned this task to <strong>Caregiver:</strong> {task.caregiverName || 'N/A'}
                </p>
                <p className="text-sm">Assignment ID: #{task.assignmentId}</p>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-pale-900 mb-3">Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-pale-600">Created At</label>
                  <div className="text-pale-900">
                    {new Date(task.createdAt).toLocaleString()}
                  </div>
                </div>
                {task.dueAt && (
                  <div>
                    <label className="text-sm text-pale-600">Due At</label>
                    <div className="text-pale-900">
                      {new Date(task.dueAt).toLocaleString()}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-pale-600">Created By</label>
                  <div className="text-pale-900">{task.createdBy}</div>
                </div>
              </div>
            </div>

            {/* Proofs */}
            <div>
              <h3 className="text-lg font-semibold text-pale-900 mb-3">
                Task Proofs ({task.proofs?.length || 0})
              </h3>
              {!task.proofs || task.proofs.length === 0 ? (
                <div className="text-center py-8 bg-pale-50 rounded-lg">
                  <ImageIcon className="w-12 h-12 text-pale-400 mx-auto mb-2" />
                  <p className="text-pale-600">No proofs uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {task.proofs.map((proof, index) => (
                    <div key={proof.id} className="border border-pale-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-pale-400 mt-1" />
                        <div className="flex-1">
                          <div className="font-medium text-pale-900 mb-1">
                            Proof #{index + 1}
                          </div>
                          <div className="text-sm text-pale-600">
                            {proof.notes || 'No notes'}
                          </div>
                          <div className="text-xs text-pale-500 mt-1">
                            {new Date(proof.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="btn-primary px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTaskManagementPage
