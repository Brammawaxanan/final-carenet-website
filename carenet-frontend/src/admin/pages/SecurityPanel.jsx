import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react'
import DataTable from '../components/DataTable'
import ApiService from '../../services/api'

const SecurityPanel = () => {
  const [verifications, setVerifications] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [activeTab, setActiveTab] = useState('verifications')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [verificationsData, logsData] = await Promise.all([
        ApiService.request('/admin/verifications'),
        ApiService.request('/admin/activity-logs')
      ])
      setVerifications(verificationsData)
      setActivityLogs(logsData)
    } catch (error) {
      console.error('Error fetching security data:', error)
      setVerifications([
        { id: 1, caregiverName: 'John Doe', documentType: 'ID Proof', uploadDate: '2025-10-10', status: 'pending' },
        { id: 2, caregiverName: 'Jane Smith', documentType: 'Medical Certificate', uploadDate: '2025-10-12', status: 'pending' },
      ])
      setActivityLogs([
        { id: 1, user: 'Alice Johnson', action: 'Failed login attempt', ip: '192.168.1.1', timestamp: '2025-10-15 10:30', severity: 'warning' },
        { id: 2, user: 'Bob Smith', action: 'Account blocked', ip: '192.168.1.2', timestamp: '2025-10-15 09:15', severity: 'critical' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (verificationId, approved) => {
    try {
      await ApiService.request(`/admin/verifications/${verificationId}`, {
        method: 'PUT',
        body: JSON.stringify({ approved })
      })
      setVerifications(verifications.filter(v => v.id !== verificationId))
    } catch (error) {
      console.error('Error handling verification:', error)
    }
  }

  const verificationColumns = [
    { header: 'Caregiver', accessor: 'caregiverName' },
    { header: 'Document Type', accessor: 'documentType' },
    { header: 'Upload Date', accessor: 'uploadDate' },
    {
      header: 'Status',
      render: (row) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert('Download functionality')}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleVerification(row.id, true)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleVerification(row.id, false)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  const logColumns = [
    { header: 'User', accessor: 'user' },
    { header: 'Action', accessor: 'action' },
    { header: 'IP Address', accessor: 'ip' },
    { header: 'Timestamp', accessor: 'timestamp' },
    {
      header: 'Severity',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.severity === 'critical' ? 'bg-red-100 text-red-700' :
          row.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {row.severity}
        </span>
      )
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security & Verification</h2>
          <p className="text-gray-600 mt-1">Monitor security and verify documents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending Verifications</p>
              <p className="text-2xl font-bold text-yellow-900">{verifications.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Failed Login Attempts</p>
              <p className="text-2xl font-bold text-red-900">
                {activityLogs.filter(l => l.action.includes('Failed')).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Security Score</p>
              <p className="text-2xl font-bold text-blue-900">85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'verifications'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Document Verifications
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'logs'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Activity Logs
        </button>
      </div>

      {/* Content */}
      {activeTab === 'verifications' ? (
        <DataTable
          columns={verificationColumns}
          data={verifications}
          searchPlaceholder="Search verifications..."
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={activityLogs}
          searchPlaceholder="Search activity logs..."
        />
      )}
    </div>
  )
}

export default SecurityPanel
