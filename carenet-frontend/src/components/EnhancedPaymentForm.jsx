import React, { useState, useEffect } from 'react'
import { CreditCard, Building2, Banknote, Check, AlertCircle, Loader, Upload } from 'lucide-react'
import ApiService from '../services/api'

/**
 * ENHANCED PAYMENT FORM - Professional 3-Method Payment System
 * 
 * Features:
 * - Tabbed interface for Credit Card, Bank Transfer, and COD
 * - Save card functionality with card management
 * - Real-time validation
 * - Professional UI with Tailwind
 * - Receipt generation and email
 */
const EnhancedPaymentForm = ({ 
  bookingId, 
  caregiverId, 
  serviceType, 
  packageType, 
  amount,
  isSubscription,
  planName,
  onSuccess 
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState('card') // card, bank, cod
  const [loading, setLoading] = useState(false)
  const [savedCards, setSavedCards] = useState([])
  const [loadingCards, setLoadingCards] = useState(false)
  
  // Form Data
  const [formData, setFormData] = useState({
    // Credit Card
    cardHolder: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    saveCard: false,
    savedCardId: null,
    
    // Bank Transfer
    bankReferenceNo: '',
    bankName: '',
    accountHolder: '',
    receiptFile: null,
    
    // COD
    codContactName: '',
    codContactPhone: '',
    codNotes: ''
  })
  
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)
  const [showSaveCardModal, setShowSaveCardModal] = useState(false)
  const [pendingPaymentData, setPendingPaymentData] = useState(null)

  // Load saved cards on mount
  useEffect(() => {
    if (activeTab === 'card') {
      loadSavedCards()
    }
  }, [activeTab])

  // Load user's saved cards
  const loadSavedCards = async () => {
    try {
      setLoadingCards(true)
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      const response = await ApiService.getUserCards(userId)
      if (response.success) {
        setSavedCards(response.cards || [])
      }
    } catch (error) {
      console.error('Failed to load saved cards:', error)
    } finally {
      setLoadingCards(false)
    }
  }

  // Check if the entered card is new (not in saved cards)
  const isCardNew = () => {
    if (formData.savedCardId) return false // Using a saved card
    if (!formData.cardNumber) return false
    
    const enteredCardNumber = formData.cardNumber.replace(/\s/g, '')
    const last4 = enteredCardNumber.slice(-4)
    
    // Check if any saved card has the same last 4 digits
    const existingCard = savedCards.find(card => card.last4 === last4)
    return !existingCard
  }

  // Handle "Add" button in save card modal
  const handleConfirmSaveCard = async () => {
    setShowSaveCardModal(false)
    await processPaymentWithOptionalSave(true)
  }

  // Handle "Cancel" button in save card modal  
  const handleCancelSaveCard = async () => {
    setShowSaveCardModal(false)
    await processPaymentWithOptionalSave(false)
  }

  // Process payment with optional card save
  const processPaymentWithOptionalSave = async (shouldSaveCard) => {
    setLoading(true)
    setErrors({})
    
    try {
      const userId = localStorage.getItem('userId')
      
      // Set saveCard flag based on user choice
      const paymentData = { ...formData, saveCard: shouldSaveCard }
      const tempFormData = formData
      setFormData(paymentData)
      
      const response = await processCreditCardPayment(userId)
      
      setFormData(tempFormData) // Restore original form data
      
      if (response.success) {
        setSuccess(response)
        
        // Reload saved cards if card was saved
        if (shouldSaveCard) {
          await loadSavedCards()
        }
        
        if (onSuccess) {
          onSuccess(response)
        }
      } else {
        setErrors({ general: response.message || 'Payment failed' })
      }
      
    } catch (error) {
      console.error('Payment error:', error)
      setErrors({ general: error.message || 'Payment processing failed' })
    } finally {
      setLoading(false)
      setPendingPaymentData(null)
    }
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : 
              value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Format card number with spaces
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    
    // Format as #### #### #### ####
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
    setFormData(prev => ({ ...prev, cardNumber: formatted }))
    
    if (errors.cardNumber) {
      setErrors(prev => ({ ...prev, cardNumber: null }))
    }
  }

  // Detect card brand from number
  const getCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, '')
    if (cleaned.startsWith('4')) return 'Visa'
    if (cleaned.startsWith('5')) return 'Mastercard'
    if (cleaned.startsWith('3')) return 'Amex'
    return 'Card'
  }

  // Validate Credit Card form
  const validateCreditCard = () => {
    const newErrors = {}
    
    if (formData.savedCardId) {
      // Using saved card, only validate CVV
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'Enter CVV for saved card'
      }
    } else {
      // New card, validate all fields
      if (!formData.cardHolder.trim()) {
        newErrors.cardHolder = 'Cardholder name is required'
      }
      
      const cardNum = formData.cardNumber.replace(/\s/g, '')
      if (!cardNum || cardNum.length < 13) {
        newErrors.cardNumber = 'Valid card number required (13-16 digits)'
      }
      
      if (!formData.expiryMonth || !formData.expiryYear) {
        newErrors.expiry = 'Expiry date is required'
      }
      
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'Valid CVV required (3-4 digits)'
      }
    }
    
    return newErrors
  }

  // Validate Bank Transfer form
  const validateBankTransfer = () => {
    const newErrors = {}
    
    if (!formData.bankReferenceNo.trim()) {
      newErrors.bankReferenceNo = 'Transaction reference is required'
    }
    
    return newErrors
  }

  // Validate COD form  
  const validateCOD = () => {
    const newErrors = {}
    
    if (formData.codContactPhone && !/^\+?[0-9\-\s]{7,15}$/.test(formData.codContactPhone)) {
      newErrors.codContactPhone = 'Enter a valid phone number'
    }
    
    return newErrors
  }

  // Main form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate based on active tab
    let validationErrors = {}
    if (activeTab === 'card') {
      validationErrors = validateCreditCard()
    } else if (activeTab === 'bank') {
      validationErrors = validateBankTransfer()
    } else if (activeTab === 'cod') {
      validationErrors = validateCOD()
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    // For credit card: Check if it's a new card and show save confirmation
    if (activeTab === 'card' && !formData.savedCardId && isCardNew()) {
      setShowSaveCardModal(true)
      return
    }
    
    setLoading(true)
    setErrors({})
    
    try {
      const userId = localStorage.getItem('userId')
      let response
      
      if (activeTab === 'card') {
        response = await processCreditCardPayment(userId)
      } else if (activeTab === 'bank') {
        response = await processBankTransferPayment(userId)
      } else if (activeTab === 'cod') {
        response = await processCODPayment(userId)
      }
      
      if (response.success) {
        setSuccess(response)
        if (onSuccess) {
          onSuccess(response)
        }
      } else {
        setErrors({ general: response.message || 'Payment failed' })
      }
      
    } catch (error) {
      console.error('Payment error:', error)
      setErrors({ general: error.message || 'Payment processing failed' })
    } finally {
      setLoading(false)
    }
  }

  // Process Credit Card Payment
  const processCreditCardPayment = async (userId) => {
    const endpoint = `/api/payments/credit-card/${bookingId || 'subscription'}`
    
    const payload = {
      caregiverId: caregiverId,
      serviceType: serviceType || 'Service',
      packageType: packageType || 'Standard',
      amount: amount,
      cardHolder: formData.cardHolder,
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      cvv: formData.cvv,
      saveCard: formData.saveCard,
      savedCardId: formData.savedCardId
    }
    
    const response = await ApiService.post(endpoint, payload, userId)
    return response
  }

  // Process Bank Transfer Payment
  const processBankTransferPayment = async (userId) => {
    // Use upload endpoint if file is present
    const hasFile = formData.receiptFile != null
    const endpoint = `/api/payments/bank-transfer/${bookingId || 'subscription'}${hasFile ? '/upload' : ''}`
    
    if (hasFile) {
      // Send as multipart/form-data when file is present
      const formDataObj = new FormData()
      formDataObj.append('caregiverId', caregiverId || '')
      formDataObj.append('serviceType', serviceType || 'Service')
      formDataObj.append('packageType', packageType || 'Standard')
      formDataObj.append('amount', amount)
      formDataObj.append('referenceNo', formData.bankReferenceNo)
      formDataObj.append('bankName', formData.bankName || '')
      formDataObj.append('accountHolder', formData.accountHolder || '')
      formDataObj.append('file', formData.receiptFile)
      
      const response = await ApiService.postMultipart(endpoint, formDataObj, userId)
      return response
    } else {
      // Send as JSON when no file
      const payload = {
        caregiverId: caregiverId,
        serviceType: serviceType || 'Service',
        packageType: packageType || 'Standard',
        amount: amount,
        referenceNo: formData.bankReferenceNo,
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        receiptFilePath: null
      }
      
      const response = await ApiService.post(endpoint, payload, userId)
      return response
    }
  }

  // Process COD Payment
  const processCODPayment = async (userId) => {
    const endpoint = `/api/payments/cod/${bookingId || 'subscription'}`
    
    const payload = {
      caregiverId: caregiverId,
      serviceType: serviceType || 'Service',
      packageType: packageType || 'Standard',
      amount: amount,
      contactName: formData.codContactName,
      contactPhone: formData.codContactPhone,
      notes: formData.codNotes
    }
    
    const response = await ApiService.post(endpoint, payload, userId)
    return response
  }

  // If payment succeeded, show success screen
  if (success) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-pale-900 mb-2">
            Payment {success.status === 'PENDING_VERIFICATION' ? 'Received' : 'Successful'}!
          </h2>
          <p className="text-pale-600 mb-6">
            {success.message || 'Your payment has been processed successfully.'}
          </p>
          
          {success.status === 'PENDING_VERIFICATION' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Your bank transfer is being verified. You'll receive a confirmation email once approved.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-left bg-pale-50 rounded-lg p-4 mb-6">
            <div>
              <p className="text-sm text-pale-600">Amount</p>
              <p className="font-semibold text-pale-900">Rs {amount?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-pale-600">Payment ID</p>
              <p className="font-semibold text-pale-900">#{success.paymentId}</p>
            </div>
          </div>
          
          {success.receiptPath && (
            <button className="btn-secondary mb-4">
              Download Receipt
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-pale-900 mb-2">Complete Payment</h2>
        <p className="text-pale-600">
          Amount to pay: <span className="font-bold text-primary-600">Rs {amount?.toFixed(2)}</span>
        </p>
      </div>

      {/* Payment Method Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-pale-200">
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'card'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-pale-600 hover:text-pale-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Credit/Debit Card</span>
        </button>
        
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'bank'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-pale-600 hover:text-pale-900'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>Bank Transfer</span>
        </button>
        
        {/* Hide COD for subscription payments */}
        {!isSubscription && bookingId !== 'subscription' && (
          <button
            type="button"
            onClick={() => setActiveTab('cod')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'cod'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-pale-600 hover:text-pale-900'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.general}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* CREDIT CARD TAB */}
        {activeTab === 'card' && (
          <div className="space-y-4">
            {/* Saved Cards Section */}
            {savedCards.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-pale-700 mb-2">
                  Saved Cards
                </label>
                <div className="grid gap-3">
                  {savedCards.map((card) => (
                    <label
                      key={card.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.savedCardId === card.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-pale-200 hover:border-pale-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedCardId"
                        value={card.id}
                        checked={formData.savedCardId === card.id}
                        onChange={() => setFormData(prev => ({ ...prev, savedCardId: card.id }))}
                        className="mr-3"
                      />
                      <CreditCard className="w-6 h-6 text-pale-400 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-pale-900">
                          {card.brand} •••• {card.last4}
                        </p>
                        <p className="text-sm text-pale-600">
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, savedCardId: null }))}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                >
                  + Use a different card
                </button>
              </div>
            )}

            {/* New Card Form */}
            {!formData.savedCardId && (
              <>
                <div>
                  <label htmlFor="cardHolder" className="block text-sm font-medium text-pale-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="cardHolder"
                    name="cardHolder"
                    value={formData.cardHolder}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`input ${errors.cardHolder ? 'border-red-500' : ''}`}
                  />
                  {errors.cardHolder && (
                    <p className="text-sm text-red-600 mt-1">{errors.cardHolder}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-pale-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className={`input ${errors.cardNumber ? 'border-red-500' : ''}`}
                  />
                  {formData.cardNumber && (
                    <p className="text-xs text-pale-500 mt-1">
                      {getCardBrand(formData.cardNumber)}
                    </p>
                  )}
                  {errors.cardNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pale-700 mb-1">
                      Expiry Date
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="expiryMonth"
                        value={formData.expiryMonth}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setFormData(prev => ({ ...prev, expiryMonth: val }))
                        }}
                        placeholder="MM"
                        maxLength="2"
                        className={`input w-full ${errors.expiry ? 'border-red-500' : ''}`}
                      />
                      <span className="flex items-center text-pale-400">/</span>
                      <input
                        type="text"
                        name="expiryYear"
                        value={formData.expiryYear}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setFormData(prev => ({ ...prev, expiryYear: val }))
                        }}
                        placeholder="YY"
                        maxLength="2"
                        className={`input w-full ${errors.expiry ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.expiry && (
                      <p className="text-sm text-red-600 mt-1">{errors.expiry}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cvv" className="block text-sm font-medium text-pale-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={formData.cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setFormData(prev => ({ ...prev, cvv: val }))
                      }}
                      placeholder="123"
                      maxLength="4"
                      className={`input ${errors.cvv ? 'border-red-500' : ''}`}
                    />
                    {errors.cvv && (
                      <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CVV for saved card */}
            {formData.savedCardId && (
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-pale-700 mb-1">
                  CVV for Saved Card
                </label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData(prev => ({ ...prev, cvv: val }))
                  }}
                  placeholder="123"
                  maxLength="4"
                  className={`input max-w-xs ${errors.cvv ? 'border-red-500' : ''}`}
                />
                {errors.cvv && (
                  <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* BANK TRANSFER TAB */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Bank Account Details</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Bank Name:</strong> BOC Bank</p>
                <p><strong>Account Holder:</strong> CareNet Pvt Ltd</p>
                <p><strong>Account Number:</strong> 000067482212</p>
                <p><strong>Branch:</strong> Main Branch, Colombo</p>
              </div>
            </div>

            <div>
              <label htmlFor="bankReferenceNo" className="block text-sm font-medium text-pale-700 mb-1">
                Transaction Reference Number *
              </label>
              <input
                type="text"
                id="bankReferenceNo"
                name="bankReferenceNo"
                value={formData.bankReferenceNo}
                onChange={handleChange}
                placeholder="Enter your bank transaction reference"
                className={`input ${errors.bankReferenceNo ? 'border-red-500' : ''}`}
              />
              {errors.bankReferenceNo && (
                <p className="text-sm text-red-600 mt-1">{errors.bankReferenceNo}</p>
              )}
            </div>

            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-pale-700 mb-1">
                Your Bank Name (Optional)
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g., HDFC Bank"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="accountHolder" className="block text-sm font-medium text-pale-700 mb-1">
                Account Holder Name (Optional)
              </label>
              <input
                type="text"
                id="accountHolder"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                placeholder="Your name as per bank account"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="receiptFile" className="block text-sm font-medium text-pale-700 mb-1">
                Upload Transfer Receipt (Optional)
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-pale-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload className="w-5 h-5 text-pale-500 mr-2" />
                  <span className="text-sm text-pale-700">
                    {formData.receiptFile ? formData.receiptFile.name : 'Choose file (PDF/Image)'}
                  </span>
                  <input
                    type="file"
                    id="receiptFile"
                    name="receiptFile"
                    accept="application/pdf,image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
                {formData.receiptFile && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, receiptFile: null }))}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-pale-500 mt-1">
                Upload a screenshot or photo of your transfer receipt
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Your payment will be verified by our team within 24-48 hours. 
                You'll receive a confirmation email once approved.
              </p>
            </div>
          </div>
        )}

        {/* CASH ON DELIVERY TAB */}
        {activeTab === 'cod' && !isSubscription && bookingId !== 'subscription' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                <Banknote className="w-5 h-5 inline mr-2" />
                Cash on Delivery
              </h4>
              <p className="text-sm text-green-800">
                You can pay directly to the caregiver upon service completion. 
                Please keep the exact amount ready.
              </p>
            </div>

            <div>
              <label htmlFor="codContactName" className="block text-sm font-medium text-pale-700 mb-1">
                Contact Name (Optional)
              </label>
              <input
                type="text"
                id="codContactName"
                name="codContactName"
                value={formData.codContactName}
                onChange={handleChange}
                placeholder="Your name"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="codContactPhone" className="block text-sm font-medium text-pale-700 mb-1">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                id="codContactPhone"
                name="codContactPhone"
                value={formData.codContactPhone}
                onChange={handleChange}
                placeholder="+91 1234567890"
                className={`input ${errors.codContactPhone ? 'border-red-500' : ''}`}
              />
              {errors.codContactPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.codContactPhone}</p>
              )}
            </div>

            <div>
              <label htmlFor="codNotes" className="block text-sm font-medium text-pale-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                id="codNotes"
                name="codNotes"
                value={formData.codNotes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special instructions..."
                className="input"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : activeTab === 'card' ? (
              `Pay Rs ${amount?.toFixed(2)}`
            ) : activeTab === 'bank' ? (
              'Confirm Bank Transfer'
            ) : (
              'Confirm COD Booking'
            )}
          </button>
        </div>
      </form>

      {/* Security Badge */}
      <div className="mt-6 pt-6 border-t border-pale-200">
        <p className="text-center text-sm text-pale-500 flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Secure payment powered by CareNet
        </p>
      </div>

      {/* Save Card Confirmation Modal */}
      {showSaveCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Save Card for Future Payments?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is a new card. Would you like to save it securely for faster checkout next time?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Card ending in:</p>
                  <p className="font-medium text-gray-900">
                    {getCardBrand(formData.cardNumber)} •••• {formData.cardNumber.slice(-4)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  ✓ Only last 4 digits stored<br />
                  ✓ Card details are tokenized and encrypted<br />
                  ✓ You can remove it anytime from your dashboard
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelSaveCard}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                No, Just Pay
              </button>
              <button
                onClick={handleConfirmSaveCard}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                disabled={loading}
              >
                Yes, Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedPaymentForm
