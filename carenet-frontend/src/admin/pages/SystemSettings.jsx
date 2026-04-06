import React, { useState, useEffect } from 'react'
import { Bell, MessageSquare, Settings as SettingsIcon, Save } from 'lucide-react'
import DataTable from '../components/DataTable'
import ApiService from '../../services/api'

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState([])
  const [tickets, setTickets] = useState([])
  const [settings, setSettings] = useState({
    siteName: 'CareNet',
    contactEmail: 'support@carenet.com',
    contactPhone: '+1-555-0100',
    workingHours: '9 AM - 6 PM',
    serviceCategories: ['Elderly Care', 'Child Care', 'Medical Support', 'Companionship']
  })
  const [loading, setLoading] = useState(true)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [announcementsData, ticketsData, settingsData] = await Promise.all([
        ApiService.request('/admin/announcements'),
        ApiService.request('/admin/tickets'),
        ApiService.request('/admin/settings')
      ])
      setAnnouncements(announcementsData)
      setTickets(ticketsData)
      if (settingsData) setSettings(settingsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setAnnouncements([
        { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on Oct 20', date: '2025-10-15', active: true }
      ])
      setTickets([
        { id: 1, user: 'Alice Johnson', subject: 'Payment issue', status: 'open', priority: 'high', date: '2025-10-14' },
        { id: 2, user: 'Bob Smith', subject: 'Profile not loading', status: 'pending', priority: 'medium', date: '2025-10-13' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert('Please fill in all fields')
      return
    }
    try {
      await ApiService.request('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(newAnnouncement)
      })
      setAnnouncements([...announcements, { ...newAnnouncement, id: Date.now(), date: new Date().toISOString().split('T')[0], active: true }])
      setNewAnnouncement({ title: '', message: '' })
    } catch (error) {
      console.error('Error posting announcement:', error)
    }
  }

  const handleUpdateTicket = async (ticketId, status) => {
    try {
      await ApiService.request(`/admin/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status } : t))
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      await ApiService.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    }
  }

  const ticketColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'User', accessor: 'user' },
    { header: 'Subject', accessor: 'subject' },
    {
      header: 'Priority',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.priority === 'high' ? 'bg-red-100 text-red-700' :
          row.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleUpdateTicket(row.id, e.target.value)}
          className="px-3 py-1 text-xs border border-gray-300 rounded-lg"
        >
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      )
    },
    { header: 'Date', accessor: 'date' },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Manage announcements, tickets, and system configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center space-x-2 px-4 py-2 font-medium ${
            activeTab === 'announcements'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements</span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2 font-medium ${
            activeTab === 'tickets'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support Tickets</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 font-medium ${
            activeTab === 'settings'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Configuration</span>
        </button>
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post New Announcement</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Announcement Title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                placeholder="Announcement Message"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handlePostAnnouncement}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Post Announcement
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{announcement.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      announcement.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {announcement.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <DataTable
          columns={ticketColumns}
          data={tickets}
          searchPlaceholder="Search tickets..."
        />
      )}

      {/* System Configuration Tab */}
      {activeTab === 'settings' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Configuration</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                <input
                  type="text"
                  value={settings.workingHours}
                  onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.serviceCategories.map((category, index) => (
                  <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSettings
