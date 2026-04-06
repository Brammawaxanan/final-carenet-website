import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Briefcase, FileText } from 'lucide-react'
import ApiService from '../services/api'

const initialData = {
  // Step 1
  caregiverType: 'Elder Care',
  firstName: '', lastName: '', email: '', phone: '', dob: '', ssn: '',
  // Step 2
  address: '', city: '', state: '', zipCode: '', country: 'LK',
  // Step 3
  bio: '', skills: [], hourlyRate: '', experience: '',
  // Step 4 (files will be stored in a FormData later)
}

const skillOptions = ['Elderly Care', 'Childcare', 'Medical', 'Home Care', 'Disability Support', 'Companionship']

const CaregiverApplicationPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const fileRef = useRef()

  const update = (k, v) => setData(d => ({ ...d, [k]: v }))
  const toggleSkill = (s) => setData(d => ({ ...d, skills: d.skills.includes(s) ? d.skills.filter(x => x !== s) : [...d.skills, s] }))

  const validateStep = (s = step) => {
    const e = {}
    if (s === 1) {
      if (!data.firstName) e.firstName = 'First name is required'
      if (!data.lastName) e.lastName = 'Last name is required'
      if (!data.email) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(data.email)) e.email = 'Invalid email'
      if (!data.phone) e.phone = 'Phone is required'
      if (!data.dob) e.dob = 'Date of birth is required'
    }
    if (s === 2) {
      if (!data.address) e.address = 'Address is required'
      if (!data.city) e.city = 'City is required'
      if (!data.state) e.state = 'State is required'
    }
    if (s === 3) {
      if (!data.bio) e.bio = 'Bio is required'
      if (data.skills.length === 0) e.skills = 'Select at least one skill'
      if (!data.hourlyRate) e.hourlyRate = 'Hourly rate is required'
    }
    if (s === 4) {
      // at least one file
      const files = fileRef.current?.files
      if (!files || files.length === 0) e.documents = 'Upload at least one document (ID or certification)'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = async () => {
    setServerError('')
    if (!validateStep(step)) return
    if (step < 4) { setStep(step + 1); return }

    // final submit
    setLoading(true)
    try {
      const payload = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        ssn: data.ssn,
        role: 'caregiver',
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        bio: data.bio,
        hourlyRate: data.hourlyRate,
        experience: data.experience,
        skills: data.skills,
        caregiverType: data.caregiverType,
        // For registration we still need a password - generate a temporary one or ask the user.
        password: Math.random().toString(36).slice(-8)
      }

      const response = await ApiService.register(payload)
      // If registration returns token, user is logged in. Then upload documents
      if (response && response.token) {
        // prepare FormData
        const formData = new FormData()
        const files = fileRef.current?.files
        for (let i = 0; files && i < files.length; i++) {
          formData.append('documents', files[i])
        }
        // include any metadata
        formData.append('caregiverType', data.caregiverType)

        try {
          await ApiService.uploadCaregiverDocuments(response.userId || null, formData)
        } catch (err) {
          console.warn('Document upload failed:', err.message)
          // don't block the flow - show a message
          setServerError('Registration succeeded but document upload failed. You can upload documents later from your profile.')
        }

        // redirect to caregiver dashboard
        navigate('/caregiver-dashboard')
      } else {
        // If no token, go to verify-email
        navigate('/verify-email', { state: { email: data.email, fromRegister: true } })
      }

    } catch (err) {
      console.error('Registration error:', err)
      setServerError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const back = () => {
    if (step === 1) return navigate('/register')
    setErrors({})
    setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-50 via-primary-50 to-pale-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pale-900">Caregiver Application</h1>
          <p className="text-pale-600">Join our verified network of professional caregivers</p>
        </div>

        {/* Step pills */}
        <div className="flex items-center justify-between mb-6">
          {[1,2,3,4].map(n => (
            <div key={n} className="flex-1 text-center">
              <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center ${step===n ? 'bg-primary-600 text-white' : 'bg-pale-200 text-pale-500'}`}>{n}</div>
              <div className="text-sm text-pale-600 mt-2">{['Type & Personal','Address & Contact','Professional','Document Upload'][n-1]}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          {serverError && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800">{serverError}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Personal Information & Caregiver Type</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button type="button" onClick={() => update('caregiverType','Elder Care')} className={`p-4 rounded-lg border text-left ${data.caregiverType==='Elder Care' ? 'border-primary-500 bg-primary-50' : 'border-pale-200'}`}>
                  <div className="font-medium">Elder Care</div>
                  <div className="text-sm text-pale-600 mt-1">Care for elderly individuals - assistance with daily activities, medical support, companionship</div>
                </button>
                <button type="button" onClick={() => update('caregiverType','Child Care')} className={`p-4 rounded-lg border text-left ${data.caregiverType==='Child Care' ? 'border-primary-500 bg-primary-50' : 'border-pale-200'}`}>
                  <div className="font-medium">Child Care</div>
                  <div className="text-sm text-pale-600 mt-1">Care for children - babysitting, educational support, recreational activities</div>
                </button>
                <button type="button" onClick={() => update('caregiverType','Pet Care')} className={`p-4 rounded-lg border text-left ${data.caregiverType==='Pet Care' ? 'border-primary-500 bg-primary-50' : 'border-pale-200'}`}>
                  <div className="font-medium">Pet Care</div>
                  <div className="text-sm text-pale-600 mt-1">Care for animals - pet sitting, dog walking, feeding, grooming</div>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.firstName} onChange={e => update('firstName', e.target.value)} />
                  {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.lastName} onChange={e => update('lastName', e.target.value)} />
                  {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.email} onChange={e => update('email', e.target.value)} />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.phone ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.phone} onChange={e => update('phone', e.target.value)} />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                  <input type="date" className={`w-full px-3 py-2 border rounded ${errors.dob ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.dob} onChange={e => update('dob', e.target.value)} />
                  {errors.dob && <p className="text-sm text-red-600 mt-1">{errors.dob}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Social Security Number</label>
                  <input className="w-full px-3 py-2 border rounded" value={data.ssn} onChange={e => update('ssn', e.target.value)} placeholder="(optional)" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Address & Contact</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Street Address *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.address ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.address} onChange={e => update('address', e.target.value)} />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.city ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.city} onChange={e => update('city', e.target.value)} />
                  {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input className={`w-full px-3 py-2 border rounded ${errors.state ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.state} onChange={e => update('state', e.target.value)} />
                  {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input className="w-full px-3 py-2 border rounded" value={data.zipCode} onChange={e => update('zipCode', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Professional Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Professional Bio *</label>
                <textarea className={`w-full px-3 py-2 border rounded resize-none ${errors.bio ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} rows={4} value={data.bio} onChange={e => update('bio', e.target.value)} />
                {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Skills & Services *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {skillOptions.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} className={`px-3 py-2 rounded border ${data.skills.includes(s) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-pale-200 bg-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {errors.skills && <p className="text-sm text-red-600 mt-1">{errors.skills}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hourly Rate ($) *</label>
                  <input type="number" className={`w-full px-3 py-2 border rounded ${errors.hourlyRate ? 'border-red-300 bg-red-50' : 'border-pale-200'}`} value={data.hourlyRate} onChange={e => update('hourlyRate', e.target.value)} />
                  {errors.hourlyRate && <p className="text-sm text-red-600 mt-1">{errors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Years of Experience</label>
                  <input type="number" className="w-full px-3 py-2 border rounded" value={data.experience} onChange={e => update('experience', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Document Upload</h2>
              <p className="text-sm text-pale-600">Upload ID, certifications or any supporting documents. Accepted formats: PDF, JPG, PNG.</p>
              <div>
                <input ref={fileRef} type="file" multiple accept=".pdf,image/*" />
                {errors.documents && <p className="text-sm text-red-600 mt-1">{errors.documents}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button onClick={back} className="btn-secondary">Back</button>
            <div className="flex space-x-3">
              <button onClick={() => { setStep(1); setErrors({}) }} className="btn-default">Start Over</button>
              <button onClick={next} disabled={loading} className="btn-primary">
                {loading ? 'Submitting...' : (step < 4 ? 'Next' : 'Submit Application')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaregiverApplicationPage
