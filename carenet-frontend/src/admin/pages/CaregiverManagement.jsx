import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, Star, FileText } from 'lucide-react'
import DataTable from '../components/DataTable'
import ApiService from '../../services/api'

const CaregiverManagement = () => {
  const [caregivers, setCaregivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCaregiver, setSelectedCaregiver] = useState(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [caregiverDocs, setCaregiverDocs] = useState([])
  const [approvingDoc, setApprovingDoc] = useState(null)

  useEffect(() => {
    fetchCaregivers()
  }, [])

  const fetchCaregivers = async () => {
    try {
      setLoading(true)
      const data = await ApiService.listCaregiversAdmin()
      setCaregivers(data)
    } catch (error) {
      console.error('Error fetching caregivers:', error)
      // Sample data
      setCaregivers([
        {
          id: 1,
          name: 'Sarah Williams',
          email: 'sarah@caregiver.com',
          skills: ['Elderly Care', 'Medical Support'],
          experience: 5,
          rating: 4.8,
          verified: true,
          status: 'active',
          profilePhoto: null,
          documents: ['ID Proof', 'Medical Certificate', 'Background Check']
        },
        {
          id: 2,
          name: 'Mike Johnson',
          email: 'mike@caregiver.com',
          skills: ['Child Care', 'Companionship'],
          experience: 3,
          rating: 4.5,
          verified: false,
          status: 'pending',
          profilePhoto: null,
          documents: ['ID Proof']
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (caregiverId, approve) => {
    try {
      await ApiService.request(`/admin/caregivers/${caregiverId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verified: approve })
      })
      setCaregivers(caregivers.map(c =>
        c.id === caregiverId ? { ...c, verified: approve, status: approve ? 'active' : 'rejected' } : c
      ))
    } catch (error) {
      console.error('Error verifying caregiver:', error)
      alert('Failed to verify caregiver')
    }
  }

  const fetchDocuments = async (caregiver) => {
    try {
      setApprovingDoc(null)
      const docs = await ApiService.getCaregiverDocuments(caregiver.id)
      setCaregiverDocs(docs)
    } catch (err) {
      console.error('Failed to load documents', err)
      setCaregiverDocs(caregiver.documents || [])
    }
  }

  const handleApproveDocument = async (docId) => {
    try {
      setApprovingDoc(docId)
      const adminName = localStorage.getItem('userName') || 'Admin'
      const res = await ApiService.approveCaregiverDocument(docId, adminName)
      // Refresh documents and caregivers list
      if (selectedCaregiver) await fetchDocuments(selectedCaregiver)
      await fetchCaregivers()
      // If caregiver verified, close modal
      if (res.caregiverVerified) {
        alert('Caregiver fully approved. An email has been sent to the user.')
        setShowDocuments(false)
      }
    } catch (err) {
      console.error('Approve failed', err)
      alert('Failed to approve document')
    } finally {
      setApprovingDoc(null)
    }
  }

  const columns = [
    {
      header: 'Profile',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Skills',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.skills.slice(0, 2).map((skill, i) => (
            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {skill}
            </span>
          ))}
          {row.skills.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{row.skills.length - 2}
            </span>
          )}
        </div>
      )
    },
    { 
      header: 'Experience', 
      render: (row) => `${row.experience} years` 
    },
    {
      header: 'Rating',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-medium">{row.rating}</span>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.verified && row.status === 'active' ? 'bg-green-100 text-green-700' :
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {row.verified ? 'Verified' : row.status === 'pending' ? 'Pending' : 'Rejected'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedCaregiver(row)
              setShowDocuments(true)
              fetchDocuments(row)
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Documents"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedCaregiver(row)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!row.verified && row.status === 'pending' && (
            <>
              <button
                onClick={() => handleVerify(row.id, true)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVerify(row.id, false)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Caregiver Management</h2>
        <p className="text-gray-600 mt-1">Verify and manage caregiver profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Caregivers</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{caregivers.length}</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-600 font-medium">Verified</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {caregivers.filter(c => c.verified).length}
          </p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {caregivers.filter(c => c.status === 'pending').length}
          </p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Avg Rating</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">4.7</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={caregivers}
        searchPlaceholder="Search caregivers..."
      />

      {/* Documents Modal */}
          {showDocuments && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Documents - {selectedCaregiver.name}</h3>
            <div className="space-y-3">
              {caregiverDocs.length === 0 ? (
                <div className="text-sm text-gray-600">No documents uploaded.</div>
              ) : (
                caregiverDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{doc.fileName}</div>
                        <div className="text-xs text-gray-500">{doc.category || 'Unspecified'} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View
                        </a>
                      )}
                      {doc.approved ? (
                        <span className="text-sm text-green-600">Approved</span>
                      ) : (
                        <button
                          onClick={() => handleApproveDocument(doc.id)}
                          disabled={approvingDoc === doc.id}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          {approvingDoc === doc.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => { setShowDocuments(false); setCaregiverDocs([]); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaregiverManagement
