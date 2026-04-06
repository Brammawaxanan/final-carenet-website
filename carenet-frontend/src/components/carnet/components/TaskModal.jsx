import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react'

const TaskModal = ({ task, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    startTime: '09:00',
    endTime: '17:00',
    status: 'DRAFT'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (task) {
      // Parse the dueAt timestamp
      const dueDateTime = task.dueAt ? new Date(task.dueAt) : new Date()
      
      // For editing, set the same date for start and end (since backend only has dueAt)
      const dueDateStr = dueDateTime.toISOString().split('T')[0]
      const dueTimeStr = dueDateTime.toTimeString().slice(0, 5)
      
      // Assume task starts on the same day, 8 hours before due time
      const startDateTime = new Date(dueDateTime)
      startDateTime.setHours(dueDateTime.getHours() - 8)
      const startDateStr = startDateTime.toISOString().split('T')[0]
      const startTimeStr = startDateTime.toTimeString().slice(0, 5)
      
      console.log('📝 Editing task:', {
        originalDueAt: task.dueAt,
        parsedDateTime: dueDateTime.toString(),
        formValues: {
          startDate: startDateStr,
          dueDate: dueDateStr,
          startTime: startTimeStr,
          endTime: dueTimeStr
        }
      })
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        startDate: startDateStr,
        dueDate: dueDateStr,
        startTime: startTimeStr,
        endTime: dueTimeStr,
        status: task.status || 'DRAFT'
      })
    } else {
      // Set default dates for new task
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      console.log('📝 Creating new task with defaults')
      
      setFormData(prev => ({
        ...prev,
        startDate: today.toISOString().split('T')[0],
        dueDate: tomorrow.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00'
      }))
    }
  }, [task])

  const calculateDuration = () => {
    if (!formData.startDate || !formData.dueDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.dueDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end day
  }

  const calculateDailyHours = () => {
    if (!formData.startTime || !formData.endTime) return 0
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60
    return hours > 0 ? hours : 0
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Task title is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required'
    if (!formData.startTime) newErrors.startTime = 'Start time is required'
    if (!formData.endTime) newErrors.endTime = 'End time is required'
    
    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.dueDate)
      if (end < start) {
        newErrors.dueDate = 'Due date cannot be before start date'
      }
    }
    
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number)
      const [endHour, endMin] = formData.endTime.split(':').map(Number)
      if (endHour * 60 + endMin <= startHour * 60 + startMin) {
        newErrors.endTime = 'End time must be after start time'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    // Combine due date and end time for dueAt (when task should be completed)
    const dueAtDateTime = new Date(`${formData.dueDate}T${formData.endTime}:00`)
    
    // Only send fields that backend expects
    const taskData = { 
      title: formData.title,
      description: formData.description || '',
      dueAt: dueAtDateTime.toISOString(),
      status: formData.status || 'DRAFT'
    }
    
    console.log('📅 Task data being submitted:', {
      formData,
      dueAtDateTime: dueAtDateTime.toString(),
      taskData
    })
    
    onSave(taskData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'AWAITING_PROOF', label: 'Awaiting Proof' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'VERIFIED', label: 'Verified' }
  ]

  const duration = calculateDuration()
  const dailyHours = calculateDailyHours()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pale-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-pale-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-pale-400 hover:text-pale-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Title */}
          <div>
            <label className="flex items-center text-sm font-medium text-pale-700 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Morning Medication, Blood Pressure Check"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-pale-200'
              }`}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.title}</p>}
            {!task && (
              <p className="text-pale-500 text-xs mt-2">This will be added as a task in your Activity page</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">
              Task Description {!task && '(Optional)'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Provide details about the task, special instructions, or requirements..."
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-pale-200'
              }`}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.description}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">Start Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.startDate ? 'border-red-300 bg-red-50' : 'border-pale-200'
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.startDate && <p className="text-red-600 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">End Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.dueDate ? 'border-red-300 bg-red-50' : 'border-pale-200'
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.dueDate && <p className="text-red-600 text-xs mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.startTime ? 'border-red-300 bg-red-50' : 'border-pale-200'
                  }`}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.startTime && <p className="text-red-600 text-xs mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.endTime ? 'border-red-300 bg-red-50' : 'border-pale-200'
                  }`}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5 pointer-events-none" />
              </div>
              {errors.endTime && <p className="text-red-600 text-xs mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-pale-50 rounded-xl p-4 space-y-3 border border-pale-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-pale-600">Duration</span>
              <span className="font-semibold text-pale-900">{duration} day(s)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-pale-600">Task</span>
              <span className="font-semibold text-pale-900">{formData.title || 'Untitled Task'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-pale-600">Est. Daily Hours</span>
              <span className="font-semibold text-pale-900">{dailyHours.toFixed(1)} hours</span>
            </div>
            <div className="border-t border-pale-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-pale-900">Total Duration</span>
                <span className="text-xl font-bold text-primary-600">
                  {(duration * dailyHours).toFixed(1)} hours
                </span>
              </div>
            </div>
          </div>

          {/* Status (only for editing) */}
          {task && (
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-pale-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-3 border-2 border-pale-300 text-pale-700 rounded-xl hover:bg-pale-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-200"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal