import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Mail, Lock, User, Phone, MapPin, Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-react'
import ApiService from '../services/api'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('') // 'client' or 'caregiver'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    // Caregiver specific
    bio: '',
    hourlyRate: '',
    skills: [],
    experience: '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const skillOptions = ['Elderly Care', 'Childcare', 'Medical', 'Home Care', 'Disability Support', 'Companionship']

  const validateStep1 = () => {
    const newErrors = {}
    
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    
    if (!formData.address) newErrors.address = 'Address is required'
    if (!formData.city) newErrors.city = 'City is required'
    if (!formData.state) newErrors.state = 'State is required'
    
    if (role === 'caregiver') {
      if (!formData.hourlyRate) newErrors.hourlyRate = 'Hourly rate is required'
      if (formData.skills.length === 0) newErrors.skills = 'Select at least one skill'
      if (!formData.bio) newErrors.bio = 'Bio is required'
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep2()) return

    setLoading(true)
    try {
      // Call backend API
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        role: role,
        ...(role === 'caregiver' && {
          bio: formData.bio,
          hourlyRate: parseFloat(formData.hourlyRate) || 25,
          experience: parseInt(formData.experience) || 0,
          skills: formData.skills
        })
      }
      
      const response = await ApiService.register(registrationData)
      
      // Success - redirect to login
      alert('Account created successfully! Please log in.')
      navigate('/login')
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: '' }))
    }
  }

  // Role Selection View
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pale-50 via-primary-50 to-pale-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-pale-900 mb-2">Join CareNet</h1>
            <p className="text-pale-600">Choose how you'd like to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Card */}
            <button
              onClick={() => setRole('client')}
              className="card hover:shadow-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pale-900 mb-1">I need care services</h3>
                  <p className="text-pale-600">Find and hire qualified caregivers</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-pale-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span>Browse verified caregivers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span>Create and manage tasks</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span>Track caregiver progress</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span>Secure payment processing</span>
                </li>
              </ul>
              <div className="mt-6">
                <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  Register as Client →
                </span>
              </div>
            </button>

            {/* Caregiver Card */}
            <button
              onClick={() => setRole('caregiver')}
              className="card hover:shadow-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pale-900 mb-1">I provide care services</h3>
                  <p className="text-pale-600">Connect with clients needing care</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-pale-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Create your professional profile</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Set your own rates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Manage assignments easily</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Get paid for your work</span>
                </li>
              </ul>
              <div className="mt-6">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium group-hover:bg-green-600 group-hover:text-white transition-colors">
                  Register as Caregiver →
                </span>
              </div>
            </button>
          </div>

          <p className="mt-8 text-center text-pale-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-50 via-primary-50 to-pale-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-pale-900 mb-2">
            Create {role === 'client' ? 'Client' : 'Caregiver'} Account
          </h1>
          <p className="text-pale-600">Step {step} of 2 - {step === 1 ? 'Basic Information' : 'Additional Details'}</p>
        </div>

        {/* Progress Bar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${step >= 1 ? 'text-primary-600' : 'text-pale-400'}`}>
              Account Details
            </span>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-primary-600' : 'text-pale-400'}`}>
              {role === 'client' ? 'Location Info' : 'Professional Info'}
            </span>
          </div>
          <div className="h-2 bg-pale-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext() } : handleSubmit}>
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="John Doe"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="your@email.com"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 hover:text-pale-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pale-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pale-400 hover:text-pale-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Additional Info */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-2">Street Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-pale-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="123 Main St"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.address ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                {/* City, State, Zip */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pale-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="New York"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.city ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pale-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="NY"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                        errors.state ? 'border-red-300 bg-red-50' : 'border-pale-200'
                      }`}
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pale-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      placeholder="10001"
                      className="w-full px-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Caregiver Specific Fields */}
                {role === 'caregiver' && (
                  <>
                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-pale-700 mb-2">Professional Bio *</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Tell us about your experience and qualifications..."
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none ${
                          errors.bio ? 'border-red-300 bg-red-50' : 'border-pale-200'
                        }`}
                      />
                      {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-sm font-medium text-pale-700 mb-2">Skills & Services *</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {skillOptions.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                              formData.skills.includes(skill)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-pale-200 bg-white text-pale-600 hover:border-primary-300'
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                      {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
                    </div>

                    {/* Hourly Rate & Experience */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-pale-700 mb-2">Hourly Rate ($) *</label>
                        <input
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => handleChange('hourlyRate', e.target.value)}
                          placeholder="25"
                          min="0"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                            errors.hourlyRate ? 'border-red-300 bg-red-50' : 'border-pale-200'
                          }`}
                        />
                        {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-pale-700 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => handleChange('experience', e.target.value)}
                          placeholder="5"
                          min="0"
                          className="w-full px-4 py-3 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Terms & Conditions */}
                <div>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                      className={`mt-1 w-4 h-4 text-primary-600 border-pale-300 rounded focus:ring-primary-500 ${
                        errors.acceptTerms ? 'border-red-300' : ''
                      }`}
                    />
                    <span className="text-sm text-pale-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-4 mt-8">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : step === 1 ? (
                  'Next Step →'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-pale-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
