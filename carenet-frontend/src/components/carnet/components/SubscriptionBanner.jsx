import React from 'react'
import { Crown, Star, Users, Shield, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SubscriptionBanner = ({ onClose }) => {
  const navigate = useNavigate()
  const features = [
    { icon: Users, text: 'Access to all caregivers' },
    { icon: Star, text: 'Unlimited bookings' },
    { icon: Shield, text: 'Priority support' },
  ]

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-soft">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
      
      <div className="relative px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Unlock Premium Features
                </h3>
                <p className="text-primary-100">
                  Subscribe to access all caregivers and book without limits
                </p>
              </div>

              {/* Features */}
              <div className="flex items-center space-x-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-primary-100">
                    <feature.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/subscribe')}
              className="bg-white text-primary-600 hover:bg-primary-50 font-semibold px-6 py-3 rounded-lg shadow-soft transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>Subscribe Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-primary-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Limited Access Notice */}
        <div className="mt-4 pt-4 border-t border-primary-400/30">
          <div className="flex items-center space-x-2 text-primary-100">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
            <span className="text-sm">
              You're currently viewing limited results. Subscribe to see all available caregivers and book for any duration.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionBanner
