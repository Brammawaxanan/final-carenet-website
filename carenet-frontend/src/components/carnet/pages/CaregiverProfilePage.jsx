import React, { useState } from 'react'
import { User, Mail, Phone, DollarSign, Briefcase, Star, Upload } from 'lucide-react'

const CaregiverProfilePage = () => {
  const [profile, setProfile] = useState({
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '(555) 987-6543',
    bio: 'Experienced caregiver with 10+ years in elderly care',
    hourlyRate: 35,
    skills: ['Elderly Care', 'Medical', 'Companionship'],
    experience: 10,
    rating: 4.8,
    reviews: 24
  })
  const [editing, setEditing] = useState(false)

  const skillOptions = ['Elderly Care', 'Childcare', 'Medical', 'Home Care', 'Disability Support', 'Companionship']

  const toggleSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-pale-900">Caregiver Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setEditing(false)} className="btn-primary">Save</button>
            </div>
          )}
        </div>

        <div className="flex items-start space-x-6 mb-8 pb-8 border-b border-pale-200">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-pale-50">
                <Upload className="w-4 h-4 text-pale-600" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-pale-900">{profile.name}</h2>
            <p className="text-pale-600 mb-2">{profile.email}</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{profile.rating}</span>
                <span className="text-pale-500">({profile.reviews} reviews)</span>
              </div>
              <div className="text-pale-400">•</div>
              <div className="font-semibold text-primary-600">Rs {profile.hourlyRate}/hour</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-pale-700 mb-2">Professional Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              disabled={!editing}
              rows={4}
              className="w-full px-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">Hourly Rate ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                <input
                  type="number"
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile({...profile, hourlyRate: e.target.value})}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-pale-700 mb-2">Years of Experience</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                <input
                  type="number"
                  value={profile.experience}
                  onChange={(e) => setProfile({...profile, experience: e.target.value})}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-pale-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pale-700 mb-3">Skills & Services</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => editing && toggleSkill(skill)}
                  disabled={!editing}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    profile.skills.includes(skill)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-pale-200 bg-white text-pale-600 hover:border-primary-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-pale-900 mb-4">Availability</h2>
        <p className="text-pale-600 mb-4">Set your available hours for new assignments</p>
        <div className="space-y-2">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <div key={day} className="flex items-center justify-between p-3 bg-pale-50 rounded-lg">
              <span className="font-medium text-pale-900">{day}</span>
              <div className="flex items-center space-x-4">
                <input type="time" defaultValue="09:00" className="px-3 py-1 border border-pale-200 rounded text-sm" />
                <span className="text-pale-400">to</span>
                <input type="time" defaultValue="17:00" className="px-3 py-1 border border-pale-200 rounded text-sm" />
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-pale-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CaregiverProfilePage
