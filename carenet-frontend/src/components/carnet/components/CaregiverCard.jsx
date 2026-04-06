import React from 'react'
import { Star, MapPin, Clock, Heart, Shield } from 'lucide-react'

const CaregiverCard = ({ caregiver, onClick }) => {
  const formatRate = (cents) => {
    if (!cents) return 'Rate not specified'
    return `Rs ${(cents / 100).toFixed(0)}/hr`
  }

  const formatRating = (rating) => {
    if (!rating) return '0.0'
    return rating.toFixed(1)
  }

  const formatServiceTypes = (types) => {
    if (!types) return []
    return types.split(',').map(type => type.trim()).slice(0, 3)
  }

  const getInitials = (name) => {
    if (!name) return 'CG'
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div 
      onClick={onClick}
      className="card hover:shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-soft">
            {getInitials(caregiver?.name || `Caregiver ${caregiver.id}`)}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div> 
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-pale-900 group-hover:text-primary-700 transition-colors">
            {caregiver?.name || `Caregiver #${caregiver.id}`}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium text-pale-700">{formatRating(caregiver.rating)}</span>
              <span className="text-pale-500 text-sm">({caregiver.reviewCount || caregiver.reviewsCount || 0})</span>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-pale-400 hover:text-primary-500 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Bio */}
      <p className="text-pale-600 text-sm mb-4 line-clamp-2 leading-relaxed">
        {caregiver.bio || 'Experienced caregiver dedicated to providing quality care.'}
      </p>

      {/* Service Types */}
      <div className="flex flex-wrap gap-2 mb-4">
        {formatServiceTypes(caregiver.serviceTypes).map((type, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>

      {/* Footer with Rate and Location */}
      <div className="flex items-center justify-between pt-4 border-t border-pale-100">
        <div className="flex items-center space-x-1 text-pale-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {caregiver.lat && caregiver.lng ? 'Nearby' : 'Location not specified'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-pale-500" />
          <span className="font-semibold text-primary-600 text-lg">
            {formatRate(caregiver.hourlyRateCents)}
          </span>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}

export default CaregiverCard
