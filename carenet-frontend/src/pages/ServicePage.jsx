import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Star, AlertCircle } from 'lucide-react'
import CaregiverCard from '../components/CaregiverCard'
import CaregiverModal from '../components/CaregiverModal'
import SubscriptionBanner from '../components/SubscriptionBanner'
import PublicNavigation from '../components/PublicNavigation'
import ApiService from '../services/api'

const ServicePage = () => {
  const navigate = useNavigate()
  const [caregivers, setCaregivers] = useState([])
  const [filteredCaregivers, setFilteredCaregivers] = useState([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCaregiver, setSelectedCaregiver] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [minRating, setMinRating] = useState('')

  const serviceTypes = ['elderly', 'childcare', 'medical', 'home', 'disability']
  const ratingOptions = [4.5, 4.0, 3.5, 3.0]

  useEffect(() => {
    fetchCaregivers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [caregivers, searchQuery, selectedServiceType, maxRate, minRating])

  const fetchCaregivers = async () => {
    try {
      console.log('Fetching caregivers from API...')
      const data = await ApiService.getCaregivers()
      console.log('API Response:', data)
      
      const caregiverList = data.caregivers || []
      console.log('Caregivers found:', caregiverList.length)
      
      setCaregivers(caregiverList)
      setIsSubscribed(data.isSubscribed || false)
      
      if (caregiverList.length === 0) {
        console.warn('No caregivers returned from API')
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error)
      // Set empty array on error to show "no caregivers found" message
      setCaregivers([])
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    console.log('Applying filters...')
    console.log('Total caregivers:', caregivers.length)
    console.log('Filters:', { searchQuery, selectedServiceType, maxRate, minRating })
    
    let filtered = [...caregivers]

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.serviceTypes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      console.log('After search filter:', filtered.length)
    }

    if (selectedServiceType) {
      filtered = filtered.filter(c => {
        const serviceTypes = c.serviceTypes || '';
        const skills = c.skills || '';
        const searchIn = `${serviceTypes} ${skills}`.toLowerCase();
        const matches = searchIn.includes(selectedServiceType.toLowerCase());
        if (!matches) {
          console.log(`Caregiver ${c.name} filtered out: "${searchIn}" does not include "${selectedServiceType}"`)
        }
        return matches;
      })
      console.log('After service type filter:', filtered.length)
    }

    if (maxRate) {
      const maxRateCents = parseFloat(maxRate) * 100;
      filtered = filtered.filter(c => {
        const rateCents = c.hourlyRateCents || 0;
        return rateCents <= maxRateCents;
      })
    }

    if (minRating) {
      filtered = filtered.filter(c =>
        (c.rating || 0) >= parseFloat(minRating)
      )
      console.log('After rating filter:', filtered.length)
    }

    console.log('Final filtered caregivers:', filtered.length)
    setFilteredCaregivers(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedServiceType('')
    setMaxRate('')
    setMinRating('')
  }

  const handleCaregiverClick = (caregiver) => {
    // Navigate to the caregiver's public profile page
    navigate(`/caregivers/${caregiver.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <PublicNavigation />
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
        {!isSubscribed && <SubscriptionBanner />}

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-pale-900">Find Your Perfect Caregiver</h1>
          <p className="text-lg text-pale-600 max-w-2xl mx-auto">
            Connect with experienced, verified caregivers in your area. Quality care you can trust.
          </p>
        </div>

      {/* Search */}
      <div className="card space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pale-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by skills, experience, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-pale-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-pale-900 placeholder-pale-400"
          />
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-pale-600" />
            <span className="font-medium text-pale-700">Filters:</span>
            {(searchQuery || selectedServiceType || maxRate || minRating) && (
              <button
                onClick={clearFilters}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Service Type */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-pale-600 py-2">Service:</span>
              {serviceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedServiceType(selectedServiceType === type ? '' : type)}
                  className={`filter-pill ${selectedServiceType === type ? 'filter-pill-active' : 'filter-pill-inactive'}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Rating */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-pale-600 py-2">Min Rating:</span>
              {ratingOptions.map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating.toString() ? '' : rating.toString())}
                  className={`filter-pill ${minRating === rating.toString() ? 'filter-pill-active' : 'filter-pill-inactive'}`}
                >
                  <Star className="w-4 h-4 mr-1" />
                  {rating}+
                </button>
              ))}
            </div>

            {/* Max Rate */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-pale-600">Max Rate:</span>
              <input
                type="number"
                placeholder="Rs/hour"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="w-24 px-3 py-1 border border-pale-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-pale-600">
          {filteredCaregivers.length} caregiver{filteredCaregivers.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCaregivers.map((c) => (
          <CaregiverCard key={c.id} caregiver={c} onClick={() => handleCaregiverClick(c)} />
        ))}
      </div>

      {filteredCaregivers.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-8 h-8 text-pale-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-pale-900 mb-2">No caregivers found</h3>
          <p className="text-pale-600 mb-4">Try adjusting your filters or search terms</p>
          <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
        </div>
      )}

      </div>
    </>
  )
}

export default ServicePage