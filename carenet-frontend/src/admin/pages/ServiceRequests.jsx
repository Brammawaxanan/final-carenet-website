import React, { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import DataTable from '../components/DataTable'
import ApiService from '../../services/api'

const ServiceRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await ApiService.request('/admin/requests')
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setRequests([
        { id: 1, client: 'Alice Johnson', caregiver: 'Sarah Williams', status: 'in_progress', date: '2025-10-01', amount: 450 },
        { id: 2, client: 'Bob Smith', caregiver: 'Mike Johnson', status: 'pending', date: '2025-10-10', amount: 380 },
        { id: 3, client: 'Charlie Brown', caregiver: 'Emma Davis', status: 'completed', date: '2025-09-25', amount: 520 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await ApiService.request(`/admin/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: newStatus } : r))
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus)

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Client', accessor: 'client' },
    { header: 'Caregiver', accessor: 'caregiver' },
    {
      header: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`px-3 py-1 text-xs font-medium rounded-full border-0 ${
            row.status === 'completed' ? 'bg-green-100 text-green-700' :
            row.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      )
    },
    { header: 'Date', accessor: 'date' },
    { header: 'Amount', render: (row) => `$${row.amount}` },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>

      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredRequests} searchPlaceholder="Search requests..." />
    </div>
  )
}

export default ServiceRequests
