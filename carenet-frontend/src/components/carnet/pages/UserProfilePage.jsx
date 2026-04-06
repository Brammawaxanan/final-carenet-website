import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Lock, Bell, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'

const UserProfilePage = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isSubscribed: false,
    tier: 'FREE'
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await ApiService.getUserProfile()
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        isSubscribed: data.isSubscribed || false,
        tier: data.tier || 'FREE'
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await ApiService.updateUserProfile(profile)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Failed to update profile. Please try again.')
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-pale-900">My Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save Changes</button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-pale-200">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-pale-900">{profile.name}</h2>
            <p className="text-pale-600">{profile.email}</p>
            {profile.isSubscribed ? (
              <span className="inline-flex items-center mt-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-sm font-bold shadow-md">
                <Crown className="w-4 h-4 mr-1" />
                {profile.tier} Member
              </span>
            ) : (
              <div className="mt-2 space-y-2">
                <span className="inline-flex items-center px-3 py-1 bg-pale-100 text-pale-600 rounded-full text-sm">
                  Free Plan
                </span>
                <button 
                  onClick={() => navigate('/subscribe')}
                  className="ml-3 inline-flex items-center px-4 py-1 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">Security Settings</h2>
        <button className="btn-secondary flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-pale-700">Email notifications</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-pale-300 rounded focus:ring-primary-500" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-pale-700">Task updates</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-pale-300 rounded focus:ring-primary-500" />
          </label>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage
