import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, Star, X, Check } from 'lucide-react'
import ApiService from '../services/api'

/**
 * Saved Cards Manager Component
 * Allows users to view, add, edit, and delete saved payment cards
 */
const SavedCardsManager = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Add Card Form State
  const [newCard, setNewCard] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    setAsDefault: false
  })

  const [formErrors, setFormErrors] = useState({})

  // Load cards on mount
  useEffect(() => {
    loadCards()
  }, [])

  // Load user's saved cards
  const loadCards = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setError('User not logged in')
        return
      }

      const response = await ApiService.getUserCards(userId)
      if (response.success) {
        setCards(response.cards || [])
      }
    } catch (err) {
      setError('Failed to load cards')
      console.error('Load cards error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete a card
  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      const response = await ApiService.deleteCard(userId, cardId)
      
      if (response.success) {
        setSuccess('Card deleted successfully')
        await loadCards()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || 'Failed to delete card')
      }
    } catch (err) {
      setError('Failed to delete card')
      console.error('Delete card error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Set card as default
  const handleSetDefault = async (cardId) => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      const response = await ApiService.setDefaultCard(userId, cardId)
      
      if (response.success) {
        setSuccess('Default card updated')
        await loadCards()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || 'Failed to update default card')
      }
    } catch (err) {
      setError('Failed to update default card')
      console.error('Set default error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Format card number with spaces
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
    setNewCard(prev => ({ ...prev, cardNumber: formatted }))
  }

  // Detect card brand
  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '')
    if (number.startsWith('4')) return 'VISA'
    if (number.startsWith('5')) return 'MASTERCARD'
    if (number.startsWith('3')) return 'AMEX'
    if (number.startsWith('6')) return 'DISCOVER'
    return 'Card'
  }

  // Validate new card form
  const validateForm = () => {
    const errors = {}
    
    if (!newCard.cardHolder.trim()) {
      errors.cardHolder = 'Cardholder name is required'
    }
    
    const cardNum = newCard.cardNumber.replace(/\s/g, '')
    if (!cardNum || cardNum.length < 13 || cardNum.length > 19) {
      errors.cardNumber = 'Invalid card number'
    }
    
    if (!newCard.expiryMonth || newCard.expiryMonth < 1 || newCard.expiryMonth > 12) {
      errors.expiryMonth = 'Invalid month'
    }
    
    const currentYear = new Date().getFullYear() % 100
    if (!newCard.expiryYear || newCard.expiryYear < currentYear) {
      errors.expiryYear = 'Invalid year'
    }
    
    if (!newCard.cvv || newCard.cvv.length < 3) {
      errors.cvv = 'Invalid CVV'
    }
    
    return errors
  }

  // Add new card
  const handleAddCard = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      setLoading(true)
      setFormErrors({})
      const userId = localStorage.getItem('userId')
      
      const response = await ApiService.saveCard(userId, {
        ...newCard,
        cardNumber: newCard.cardNumber.replace(/\s/g, '')
      })
      
      if (response.success) {
        setSuccess('Card added successfully')
        setShowAddModal(false)
        setNewCard({
          cardHolder: '',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          setAsDefault: false
        })
        await loadCards()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || 'Failed to add card')
      }
    } catch (err) {
      setError(err.message || 'Failed to add card')
      console.error('Add card error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Saved Payment Cards</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Card
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Cards List */}
      {loading && cards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Loading cards...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved cards</h3>
          <p className="text-gray-600 mb-4">Add a card to make faster payments</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                card.isDefault
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {card.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {card.brand || 'CARD'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-gray-900 mb-2">
                    •••• •••• •••• {card.last4}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{card.cardHolder}</span>
                    </div>
                    <div>
                      Expires: {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Added: {new Date(card.addedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!card.isDefault && (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add New Card</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard}>
              <div className="space-y-4">
                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={newCard.cardHolder}
                    onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.cardHolder ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {formErrors.cardHolder && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.cardHolder}</p>
                  )}
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={newCard.cardNumber}
                    onChange={handleCardNumberChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                  {newCard.cardNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getCardBrand(newCard.cardNumber)}
                    </p>
                  )}
                  {formErrors.cardNumber && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.cardNumber}</p>
                  )}
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <input
                      type="text"
                      value={newCard.expiryMonth}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                        setNewCard({ ...newCard, expiryMonth: val })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="MM"
                      maxLength="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={newCard.expiryYear}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                        setNewCard({ ...newCard, expiryYear: val })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.expiryYear ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="YY"
                      maxLength="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={newCard.cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setNewCard({ ...newCard, cvv: val })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.cvv ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>

                {/* Set as Default */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCard.setAsDefault}
                    onChange={(e) => setNewCard({ ...newCard, setAsDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as default card</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedCardsManager
