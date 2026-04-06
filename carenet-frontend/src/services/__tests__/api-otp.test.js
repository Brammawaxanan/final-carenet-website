import ApiService from '../api'

describe('ApiService OTP fallbacks (DEV-only tests)', () => {
  test('sendOtp falls back to mock and returns success', async () => {
    // Simulate running in DEV by ensuring import.meta.env.DEV truthy is not possible here,
    // but ApiService uses import.meta.env.DEV at runtime. These tests are best-effort smoke tests.
    const resp = await ApiService.sendOtp({ email: 'test@example.com' })
    expect(resp).toBeDefined()
    expect(resp.success).toBe(true)
  })

  test('verifyOtp accepts known test codes', async () => {
    const okCodes = ['0000', '1111', '1234', '000000', '123456']
    for (const code of okCodes) {
      const resp = await ApiService.verifyOtp({ email: 'test@example.com', otp: code })
      // Either verified:true or success:true in fallback
      expect(resp).toBeDefined()
      expect(resp.verified === true || resp.success === true).toBeTruthy()
    }
  })
})
