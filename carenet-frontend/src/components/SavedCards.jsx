import React, { useState, useEffect } from 'react'
import { CreditCard, Trash2, Star, Plus, Loader, AlertCircle } from 'lucide-react'
import ApiService from '../services/api'

/**
 * SAVED CARDS MANAGEMENT DASHBOARD
 * 
 * Features:
 * - Display all saved cards
 * - Set default card
 * - Delete card with confirmation
 * - Add new card modal
 */
const SavedCards = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // New card form
  const [newCard, setNewCard] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    setAsDefault: false
  })
  const [cardErrors, setCardErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCards()
  }, [])

  // Load saved cards
  const loadCards = async () => {
    try {
      setLoading(true)
      setError(null)
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        setError('Please login to view saved cards')
        return
      }

      const response = await ApiService.getUserCards(userId)
      
      if (response.success) {
        setCards(response.cards || [])
      } else {
        setError(response.message || 'Failed to load cards')
      }
    } catch (err) {
      console.error('Error loading cards:', err)
      setError('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  // Delete card
  const handleDelete = async (cardId) => {
    try {
      const userId = localStorage.getItem('userId')
      const response = await ApiService.deleteCard(userId, cardId)
      
      if (response.success) {
        setSuccess('Card deleted successfully')
        setDeleteConfirm(null)
        loadCards() // Reload list
      } else {
        setError(response.message || 'Failed to delete card')
      }
    } catch (err) {
      console.error('Error deleting card:', err)
      setError('Failed to delete card')
    }
  }

  // Set default card
  const handleSetDefault = async (cardId) => {
    try {
      const userId = localStorage.getItem('userId')
      const response = await ApiService.setDefaultCard(userId, cardId)
      
      if (response.success) {
        setSuccess('Default card updated')
        loadCards() // Reload list
      } else {
        setError(response.message || 'Failed to set default')
      }
    } catch (err) {
      console.error('Error setting default:', err)
      setError('Failed to set default card')
    }
  }

  // Format card number input
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
    setNewCard(prev => ({ ...prev, cardNumber: formatted }))
    
    if (cardErrors.cardNumber) {
      setCardErrors(prev => ({ ...prev, cardNumber: null }))
    }
  }

  // Validate new card form
  const validateNewCard = () => {
    const errors = {}
    
    if (!newCard.cardHolder.trim()) {
      errors.cardHolder = 'Cardholder name is required'
    }
    
    const cardNum = newCard.cardNumber.replace(/\s/g, '')
    if (!cardNum || cardNum.length < 13) {
      errors.cardNumber = 'Valid card number required'
    }
    
    if (!newCard.expiryMonth || !newCard.expiryYear) {
      errors.expiry = 'Expiry date is required'
    }
    
    if (!newCard.cvv || newCard.cvv.length < 3) {
      errors.cvv = 'Valid CVV required'
    }
    
    return errors
  }

  // Save new card
  const handleSaveCard = async (e) => {
    e.preventDefault()
    
    const errors = validateNewCard()
    if (Object.keys(errors).length > 0) {
      setCardErrors(errors)
      return
    }
    
    try {
      setSaving(true)
      const userId = localStorage.getItem('userId')
      
      const response = await ApiService.saveCard(userId, newCard)
      
      if (response.success) {
        setSuccess('Card saved successfully')
        setShowAddCard(false)
        setNewCard({
          cardHolder: '',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          setAsDefault: false
        })
        loadCards() // Reload list
      } else {
        setError(response.message || 'Failed to save card')
      }
    } catch (err) {
      console.error('Error saving card:', err)
      setError(err.message || 'Failed to save card')
    } finally {
      setSaving(false)
    }
  }

  // Get card brand icon
  const getCardIcon = (brand) => {
    const brandUpper = brand?.toUpperCase()
    if (brandUpper === 'VISA') return '💳'
    if (brandUpper === 'MASTERCARD') return '💳'
    if (brandUpper === 'AMEX') return '💳'
    return '💳'
  }

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-pale-600">Loading saved cards...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pale-900">Saved Cards</h2>
          <p className="text-pale-600 mt-1">Manage your payment methods</p>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Card</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 text-pale-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-pale-900 mb-2">No saved cards</h3>
          <p className="text-pale-600 mb-6">Add a card to make future payments faster</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="btn-primary mx-auto"
          >
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="card border-2 border-pale-200 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{getCardIcon(card.brand)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-pale-900">
                        {card.brand} •••• {card.last4}
                      </p>
                      {card.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-pale-600 mt-1">
                      {card.cardHolder}
                    </p>
                    <p className="text-sm text-pale-500">
                      Expires {card.expiryMonth}/{card.expiryYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!card.isDefault && (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      className="btn-secondary text-sm"
                      title="Set as default"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(card.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-pale-900 mb-2">Delete Card?</h3>
            <p className="text-pale-600 mb-6">
              Are you sure you want to delete this card? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-8">
            <h3 className="text-xl font-semibold text-pale-900 mb-4">Add New Card</h3>
            
            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pale-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={newCard.cardHolder}
                  onChange={(e) => setNewCard(prev => ({ ...prev, cardHolder: e.target.value }))}
                  placeholder="John Doe"
                  className={`input ${cardErrors.cardHolder ? 'border-red-500' : ''}`}
                />
                {cardErrors.cardHolder && (
                  <p className="text-sm text-red-600 mt-1">{cardErrors.cardHolder}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pale-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={newCard.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className={`input ${cardErrors.cardNumber ? 'border-red-500' : ''}`}
                />
                {cardErrors.cardNumber && (
                  <p className="text-sm text-red-600 mt-1">{cardErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCard.expiryMonth}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                        setNewCard(prev => ({ ...prev, expiryMonth: val }))
                      }}
                      placeholder="MM"
                      maxLength="2"
                      className={`input w-full ${cardErrors.expiry ? 'border-red-500' : ''}`}
                    />
                    <span className="flex items-center">/</span>
                    <input
                      type="text"
                      value={newCard.expiryYear}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                        setNewCard(prev => ({ ...prev, expiryYear: val }))
                      }}
                      placeholder="YY"
                      maxLength="2"
                      className={`input w-full ${cardErrors.expiry ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {cardErrors.expiry && (
                    <p className="text-sm text-red-600 mt-1">{cardErrors.expiry}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pale-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCard.cvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setNewCard(prev => ({ ...prev, cvv: val }))
                    }}
                    placeholder="123"
                    maxLength="4"
                    className={`input ${cardErrors.cvv ? 'border-red-500' : ''}`}
                  />
                  {cardErrors.cvv && (
                    <p className="text-sm text-red-600 mt-1">{cardErrors.cvv}</p>
                  )}
                </div>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newCard.setAsDefault}
                  onChange={(e) => setNewCard(prev => ({ ...prev, setAsDefault: e.target.checked }))}
                  className="rounded border-pale-300"
                />
                <span className="text-sm text-pale-700">Set as default card</span>
              </label>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCard(false)
                    setCardErrors({})
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Card'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedCards
