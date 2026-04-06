import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ApiService from '../services/api'

const DIGITS = 6

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialEmail = state?.email || ''
  const fromRegister = state?.fromRegister === true
  const [email, setEmail] = useState(initialEmail)

  const [digits, setDigits] = useState(Array(DIGITS).fill(''))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const inputsRef = useRef([])

  useEffect(() => {
    // If navigated directly to verify (not immediately after register), auto-send OTP.
    if (email && !fromRegister) {
      sendOtp()
    }
    // focus first box
    setTimeout(() => inputsRef.current[0]?.focus(), 200)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  // If devOtp passed via router state, autofill (DEV only)
  useEffect(() => {
    const devOtp = state?.devOtp
    // Only auto-fill devOtp if not coming directly from register (avoid duplicate auto-fill/send)
    if (!fromRegister && import.meta.env.DEV && devOtp && devOtp.length === DIGITS) {
      setDigits(devOtp.split(''))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendOtp = async () => {
    try {
      setLoading(true)
      setError('')
      setMessage('Sending OTP...')
      const resp = await ApiService.sendOtp({ email })
      if (resp && resp.success) {
        setMessage('OTP sent to ' + email)
        // Set resend cooldown (60s)
        setResendAvailableAt(Date.now() + 60_000)
      } else {
        setMessage('OTP sent (if service available)')
      }
    } catch (e) {
      setError(e.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async (otpStr) => {
    try {
      setLoading(true)
      setError('')
      const resp = await ApiService.verifyOtp({ email, otp: otpStr })
      if (resp && resp.verified) {
        setMessage('Email verified. Redirecting to login...')
        // Pass a flag so LoginPage doesn't auto-login immediately
        setTimeout(() => navigate('/login', { state: { fromVerify: true } }), 1000)
      } else {
        setError('OTP invalid or expired')
      }
    } catch (e) {
      setError(e.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  // Handlers for digit boxes
  const onDigitChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < DIGITS - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const onKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      const otpStr = digits.join('')
      if (otpStr.length === DIGITS) verifyOtp(otpStr)
    }
  }

  // Auto-submit when all digits filled
  useEffect(() => {
    const otpStr = digits.join('')
    if (otpStr.length === DIGITS) {
      const t = setTimeout(() => verifyOtp(otpStr), 300)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  const canResend = () => Date.now() >= resendAvailableAt

  const resendRemaining = () => Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000))

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md card">
        <h2 className="text-xl font-semibold mb-3">Verify your email</h2>
        {!initialEmail && (
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">Email to verify</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="mt-2 text-sm text-gray-600">Enter the email you registered with and click "Resend OTP" to receive the code.</div>
          </div>
        )}
        {initialEmail && <p className="text-sm text-gray-600 mb-4">An OTP has been sent to <strong>{email}</strong>. Enter it below to verify your account.</p>}

        {message && <div className="p-3 mb-3 bg-green-50 text-green-700 rounded">{message}</div>}
        {error && <div className="p-3 mb-3 bg-red-50 text-red-700 rounded">{error}</div>}

        <div className="flex items-center justify-center space-x-2 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              value={d}
              onChange={(e) => onDigitChange(i, e.target.value.trim())}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="w-12 h-12 text-center text-lg border rounded"
              inputMode="numeric"
              maxLength={1}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={sendOtp} disabled={!canResend() || loading} className="px-4 py-2 btn-primary">
            {canResend() ? 'Resend OTP' : `Resend in ${resendRemaining()}s`}
          </button>
          <button onClick={() => verifyOtp(digits.join(''))} disabled={loading || digits.join('').length !== DIGITS} className="px-4 py-2 btn-secondary">Verify now</button>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
