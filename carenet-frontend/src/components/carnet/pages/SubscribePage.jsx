import React, { useState, useEffect } from 'react'
import { Crown, CheckCircle, ArrowRight, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'

const SubscribePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(null)

  useEffect(() => {
    checkCurrentSubscription()
  }, [])

  const checkCurrentSubscription = async () => {
    try {
      const data = await ApiService.getUserDashboard()
      if (data?.user?.isSubscribed) {
        setCurrentSubscription(data.user)
      }
    } catch (err) {
      console.error('Error checking subscription:', err)
    }
  }

  const handleSubscribe = async (planName) => {
    try {
      setLoading(true)
      console.log('Subscribing to plan:', planName)
      const response = await ApiService.subscribe({ tier: planName })
      console.log('Subscription response:', response)
      
      if (response.success === false) {
        // Backend returned error
        if (response.message && response.message.includes('already has')) {
          alert('You already have an active subscription!\n\nGo to your profile to see your current plan.')
          navigate('/user-profile')
        } else {
          alert(`Subscription Error: ${response.message || 'Unknown error'}`)
        }
      } else {
        // Success
        alert(`Successfully subscribed to ${planName} plan! You now have full access.`)
        navigate('/user-dashboard')
      }
    } catch (err) {
      console.error('Error subscribing:', err)
      console.error('Error details:', err.message)
      // Show more detailed error message
      const errorMessage = err.message || 'Failed to subscribe. Please try again.'
      alert(`Subscription Error: ${errorMessage}\n\nPlease check:\n1. Backend is running on port 8091\n2. You are logged in\n3. Browser console for details`)
    } finally {
      setLoading(false)
    }
  }
  const plans = [
    {
      name: 'Premium',
      price: 'Rs 399',
      description: 'Complete care management solution',
      features: [
        'Unlimited caregiver access',
        'Unlimited bookings',
        'Priority support',
        'Advanced activity tracking',
        'Task management system',
        'Payment tracking',
        '24/7 customer support'
      ],
      highlight: true
    }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Crown className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold text-pale-900">Upgrade to Premium</h1>
        </div>
        <p className="text-lg text-pale-600 max-w-2xl mx-auto">
          Unlock unlimited bookings, priority support, and advanced care management features.
          Join thousands of families who trust CareNet for their care needs.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="flex justify-center">
        <div className="max-w-md w-full">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`card flex flex-col justify-between border-2 ${
              plan.highlight
                ? 'border-primary-500 shadow-lg'
                : 'border-pale-200'
            }`}
          >
            <div>
              <h3 className="text-2xl font-bold text-pale-900 mb-2">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-primary-600 mb-4">{plan.price}</p>
              <p className="text-pale-600 mb-6">{plan.description}</p>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-pale-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan.name.toUpperCase())}
              disabled={loading || (currentSubscription?.isSubscribed && plan.name === 'Premium')}
              className={`mt-6 w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium shadow-soft transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.highlight
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                  : 'bg-pale-100 text-pale-700 hover:bg-pale-200'
              }`}
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : currentSubscription?.isSubscribed && plan.name === 'Premium' ? (
                <span>Current Plan</span>
              ) : (
                <>
                  <span>Choose {plan.name}</span>
                </>
              )}
            </button>
          </div>
        ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-pale-500">
        Secure payments powered by your chosen provider. Cancel anytime.
      </div>
    </div>
  )
}

export default SubscribePage