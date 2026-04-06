import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Download, CheckCircle, Mail } from 'lucide-react'
import ApiService from '../services/api'
import eventBus from '../lib/events'

/**
 * SMART PAYMENT FORM with Automatic Receipt Generation
 * Features:
 * - Auto-generates PDF receipt
 * - Sends receipt via email
 * - Download receipt button
 * - Toast notifications
 */
const SmartPaymentForm = ({ bookingId, caregiverId, serviceType, packageType, amount, onSuccess }) => {
  // Ensure amount is always a valid number
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 350.0
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    paymentMethod: 'Credit Card',
    // extra fields for bank transfer and COD
    myTransferReference: '',
    codContactName: '',
    codContactPhone: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [receiptPath, setReceiptPath] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [pendingInfo, setPendingInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    // Only validate card fields when payment method is Credit Card
    if (formData.paymentMethod === 'Credit Card') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = 'Valid card number required'
      }
      if (!formData.cardName) {
        newErrors.cardName = 'Cardholder name required'
      }
      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date required'
      }
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'Valid CVV required'
      }
    }
    // If bank transfer selected, optional reference may be present but not required
    if (formData.paymentMethod === 'Bank Transfer') {
      // no strict validation; user may enter their transaction reference
      if (formData.myTransferReference && formData.myTransferReference.length > 80) {
        newErrors.myTransferReference = 'Reference too long'
      }
    }

    if (formData.paymentMethod === 'Cash on Delivery') {
      if (formData.codContactPhone && !/^\+?[0-9\- ]{7,20}$/.test(formData.codContactPhone)) {
        newErrors.codContactPhone = 'Enter a valid phone number'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate depending on payment method
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // Decide whether to mock payment locally
      const MOCK_PAYMENTS = import.meta.env.VITE_MOCK_PAYMENTS !== 'false' // default true in dev

      if (MOCK_PAYMENTS) {
        // Local simulated payment flow
        showToast('Processing payment (mock)...', 'info')
        await new Promise((res) => setTimeout(res, 900))

        const mockPaymentId = `MOCK-${Date.now()}`
        const transactionId = `TX-${Date.now()}`
        let response = null

        if (formData.paymentMethod === 'Bank Transfer') {
          // Simulate pending bank transfer response
          const externalRef = `BT-${Date.now()}`
          response = {
            success: true,
            paymentId: mockPaymentId,
            bookingId: bookingId || null,
            transactionId: null,
            amount: safeAmount,
            status: 'PENDING',
            paymentMethod: 'Bank Transfer',
            bankDetails: {
              accountName: 'CareNet Services Pvt Ltd',
              accountNumber: '123456789012',
              bankName: 'Mock National Bank',
              ifsc: 'MNB0001234',
              externalRef,
              instructions: 'Transfer exact amount and include the reference.'
            },
            receiptPath: null,
            emailQueued: false
          }
        } else if (formData.paymentMethod === 'Cash on Delivery') {
          response = {
            success: true,
            paymentId: mockPaymentId,
            bookingId: bookingId || null,
            transactionId: null,
            amount: safeAmount,
            status: 'PENDING_COD',
            paymentMethod: 'Cash on Delivery',
            message: 'Cash will be collected by the caregiver at service time.',
            receiptPath: null,
            emailQueued: false
          }
        } else {
          // standard immediate success
          response = {
            success: true,
            paymentId: mockPaymentId,
            bookingId: bookingId || null,
            transactionId,
            amount: safeAmount,
            receiptPath: null,
            emailQueued: false
          }
        }

        setPaymentId(response.paymentId)
        setReceiptPath(response.receiptPath)

        // For pending flows, show pending info instead of treating as PAID
        if (response.status === 'PENDING' || response.status === 'PENDING_COD') {
          setPendingInfo(response)
          showToast('Payment recorded as pending — follow instructions', 'info')

          eventBus.emit('payment:confirmed', {
            bookingId: response.bookingId,
            paymentId: response.paymentId,
            amount: response.amount,
            status: response.status
          })

          if (onSuccess) onSuccess(response)

          // Do not auto-redirect; keep user on page to copy details.
          setPaymentSuccess(false)
          setLoading(false)
          return
        }

        setPaymentSuccess(true)
        const message = `${formData.paymentMethod} payment simulated — success!`
        showToast(message, 'success')

        eventBus.emit('payment:confirmed', {
          bookingId: response.bookingId,
          paymentId: response.paymentId,
          amount: response.amount,
          status: 'PAID'
        })

        if (onSuccess) onSuccess(response)

        // Redirect after brief delay for immediate payments -> Activity page
        setTimeout(() => {
          const target = response.bookingId ? `/user-activity/${response.bookingId}?booking=success` : '/user-activity?booking=success'
          navigate(target)
        }, 1000)
      } else {
        // Real backend call
        const response = await ApiService.request(`/api/payments/confirm/${bookingId}`, {
          method: 'POST',
          body: JSON.stringify({
            caregiverId,
            serviceType,
            packageType,
            amount: safeAmount,
            paymentMethod: formData.paymentMethod
          })
        })

        if (response.success) {
          // If server returns pending info (bank transfer or COD), show pending panel
          if (response.status === 'PENDING' || response.status === 'PENDING_COD') {
            setPendingInfo(response)
            showToast('Payment recorded as pending — follow instructions', 'info')

            eventBus.emit('payment:confirmed', {
              bookingId: response.bookingId,
              paymentId: response.paymentId,
              amount: response.amount,
              status: response.status
            })

            if (onSuccess) onSuccess(response)
            setLoading(false)
            return
          }

          setPaymentSuccess(true)
          setReceiptPath(response.receiptPath)
          setPaymentId(response.paymentId)

          const message = response.emailQueued 
            ? '✅ Payment successful! Receipt sent to your email.'
            : '✅ Payment successful! Receipt download available.'
          showToast(message, 'success')

          eventBus.emit('payment:confirmed', {
            bookingId: response.bookingId,
            paymentId: response.paymentId,
            amount: response.amount,
            status: 'PAID'
          })

          if (onSuccess) onSuccess(response)

          setTimeout(() => {
            const target = response.bookingId ? `/user-activity/${response.bookingId}?booking=success` : '/user-activity?booking=success'
            navigate(target)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('❌ Payment error:', error)
      setErrors({ general: error.message || 'Payment failed. Please try again.' })
      showToast('❌ Payment failed: ' + (error.message || ''), 'error')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = (paymentId) => {
    // Use paymentId from response, not bookingId
    const receiptId = paymentId || bookingId
    window.open(`${ApiService.baseURL}/api/payments/receipt/${receiptId}`, '_blank')
    showToast('📄 Downloading receipt...', 'info')
  }

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text)
      showToast('Copied to clipboard', 'success')
    } catch (e) {
      showToast('Unable to copy. Please copy manually.', 'error')
    }
  }

  const showToast = (message, type = 'info') => {
    // Simple toast implementation (you can use react-hot-toast library)
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    } text-white font-medium animate-fade-in-down`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 4000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Payment Success State */}
      {paymentSuccess ? (
        <div className="card bg-green-50 border-green-200">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
            <p className="text-green-700 mb-6">
              Your payment has been processed successfully.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Mail className="w-5 h-5" />
                <span>Receipt sent to your email</span>
              </div>
              
              <button
                onClick={() => downloadReceipt(paymentId)}
                className="flex items-center space-x-2 mx-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download Receipt PDF</span>
              </button>
            </div>
            
            <p className="text-sm text-green-600 mt-4">
              Redirecting to confirmation page...
            </p>
          </div>
        </div>
      ) : pendingInfo ? (
        // Pending info panel for Bank Transfer or COD
        <div className="card bg-yellow-50 border-yellow-200 p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-yellow-900">Payment Pending</h2>
            <p className="text-yellow-800">Your payment is recorded as pending. Follow the instructions below to complete it.</p>
          </div>

          {pendingInfo.paymentMethod === 'Bank Transfer' && (
            <div className="space-y-3 text-left">
              <h3 className="font-semibold">Bank Transfer Instructions</h3>
              <div className="text-sm text-gray-800">
                <p><strong>Account:</strong> {pendingInfo.bankDetails.accountName}</p>
                <p><strong>Account Number:</strong> {pendingInfo.bankDetails.accountNumber}</p>
                <p><strong>Bank:</strong> {pendingInfo.bankDetails.bankName} (IFSC: {pendingInfo.bankDetails.ifsc})</p>
                <p><strong>Reference:</strong> <span className="font-mono">{pendingInfo.bankDetails.externalRef}</span></p>
                <p className="mt-2">{pendingInfo.bankDetails.instructions}</p>
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => copyToClipboard(pendingInfo.bankDetails.externalRef)} className="px-4 py-2 bg-primary-600 text-white rounded">Copy Reference</button>
                <button onClick={() => copyToClipboard(pendingInfo.bankDetails.accountNumber)} className="px-4 py-2 bg-white border rounded">Copy Account</button>
              </div>

              <div className="mt-4 text-sm text-gray-700">
                <p>After you complete the transfer, our team will verify and mark the payment as completed. You can also provide your transaction reference below to speed up verification.</p>

                <div className="mt-3">
                  <label className="block text-sm">Your transfer reference (optional)</label>
                  <input type="text" name="myTransferReference" value={formData.myTransferReference} onChange={handleInputChange} className="w-full px-3 py-2 border rounded mt-1" placeholder="e.g., UPI/NEFT/IMPS reference" />
                </div>

                <div className="mt-4">
                  <button onClick={async () => {
                    try {
                      if (!paymentId) return showToast('No payment id available', 'error')
                      const resp = await ApiService.request(`/api/payments/attach-reference/${paymentId}`, {
                        method: 'POST',
                        body: JSON.stringify({ transferReference: formData.myTransferReference })
                      })
                      if (resp.success) showToast('Reference attached', 'success')
                      else showToast('Failed to attach reference', 'error')
                    } catch (e) {
                      console.error(e)
                      showToast('Failed to attach reference', 'error')
                    }
                  }} className="px-4 py-2 bg-primary-600 text-white rounded">Save Reference</button>

                  {/* Dev: quick complete-transfer button to mark pending as completed (only visible in dev) */}
                  {import.meta.env.DEV && (
                    <button onClick={async () => {
                      try {
                        if (!paymentId) return showToast('No payment id available', 'error')
                        const resp = await ApiService.request(`/api/payments/complete-transfer/${paymentId}`, {
                          method: 'POST',
                          body: JSON.stringify({ transactionReference: formData.myTransferReference || `TX-${Date.now()}` })
                        })
                        if (resp.success) {
                          showToast('Payment marked completed', 'success')
                          // update UI to the completed state
                          setPendingInfo(null)
                          setPaymentSuccess(true)
                          setReceiptPath(resp.receiptPath)
                          setTimeout(() => {
                            const target = resp.bookingId ? `/user-activity/${resp.bookingId}?booking=success` : '/user-activity?booking=success'
                            navigate(target)
                          }, 800)
                        } else {
                          showToast('Failed to complete transfer', 'error')
                        }
                      } catch (e) {
                        console.error(e)
                        showToast('Failed to complete transfer', 'error')
                      }
                    }} className="ml-3 px-4 py-2 bg-white border text-gray-800 rounded">Mark as Completed (dev)</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {pendingInfo.paymentMethod === 'Cash on Delivery' && (
            <div className="space-y-3 text-left">
              <h3 className="font-semibold">Cash on Delivery</h3>
              <p className="text-sm text-gray-800">{pendingInfo.message}</p>

              <div className="mt-3">
                <label className="block text-sm">Contact name (optional)</label>
                <input type="text" name="codContactName" value={formData.codContactName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded mt-1" placeholder="Name to contact at delivery" />
              </div>

              <div className="mt-3">
                <label className="block text-sm">Contact phone (optional)</label>
                <input type="text" name="codContactPhone" value={formData.codContactPhone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded mt-1" placeholder="Phone number" />
                {errors.codContactPhone && <p className="text-red-500 text-sm mt-1">{errors.codContactPhone}</p>}
              </div>

              <div className="mt-4">
                <button onClick={async () => {
                  try {
                    if (!paymentId) return showToast('No payment id available', 'error')
                    const resp = await ApiService.request(`/api/payments/attach-reference/${paymentId}`, {
                      method: 'POST',
                      body: JSON.stringify({ codContactName: formData.codContactName, codContactPhone: formData.codContactPhone })
                    })
                    if (resp.success) showToast('Preferences saved', 'success')
                    else showToast('Failed to save preferences', 'error')
                  } catch (e) {
                    console.error(e)
                    showToast('Failed to save preferences', 'error')
                  }
                }} className="px-4 py-2 bg-primary-600 text-white rounded">Save Preferences</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Payment Form */
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <CreditCard className="w-8 h-8 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
              <p className="text-sm text-gray-600">Secure payment with auto-receipt</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Service:</span>
                <span className="font-medium">{serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Package:</span>
                <span className="font-medium">{packageType}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-900 mt-2 pt-2 border-t border-blue-200">
                <span>Total Amount:</span>
                <span>Rs. {safeAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex gap-2 mb-3">
                {['Credit Card', 'Bank Transfer', 'Cash on Delivery'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: m })}
                    className={`px-3 py-2 rounded-lg border ${formData.paymentMethod === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-800'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength="16"
                disabled={formData.paymentMethod !== 'Credit Card'}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                } ${formData.paymentMethod !== 'Credit Card' ? 'opacity-60' : ''}`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={formData.paymentMethod !== 'Credit Card'}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.cardName ? 'border-red-500' : 'border-gray-300'
                } ${formData.paymentMethod !== 'Credit Card' ? 'opacity-60' : ''}`}
              />
              {errors.cardName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={formData.paymentMethod !== 'Credit Card'}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  } ${formData.paymentMethod !== 'Credit Card' ? 'opacity-60' : ''}`}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength="4"
                  disabled={formData.paymentMethod !== 'Credit Card'}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  } ${formData.paymentMethod !== 'Credit Card' ? 'opacity-60' : ''}`}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Features Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">✨ What happens next:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Payment processed securely</li>
                <li>📄 PDF receipt automatically generated</li>
                <li>📧 Receipt emailed to your registered email</li>
                <li>💾 Receipt saved for future download</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay Rs. ${safeAmount.toFixed(2)}`
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default SmartPaymentForm
