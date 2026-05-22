// OTP Service for generating and verifying one-time passwords
const OTP_STORAGE_KEY = 'cryptodash-otp'
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

const otpStore = new Map()

function loadOtpStore() {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      Object.entries(data).forEach(([key, value]) => {
        // Only load non-expired OTPs
        if (value.expiresAt > Date.now()) {
          otpStore.set(key, value)
        }
      })
    }
  } catch {
    // Ignore errors
  }
}

function saveOtpStore() {
  const data = {}
  otpStore.forEach((value, key) => {
    data[key] = value
  })
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(data))
}

loadOtpStore()

export const otpService = {
  // Generate a 6-digit OTP code
  generateOtp(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + OTP_EXPIRY_MS
    
    otpStore.set(email.toLowerCase(), {
      code,
      expiresAt,
      verified: false
    })
    
    saveOtpStore()
    return code
  },

  // Verify OTP code
  verifyOtp(email, code) {
    const key = email.toLowerCase()
    const record = otpStore.get(key)
    
    if (!record) {
      return { valid: false, message: 'OTP not found or expired' }
    }
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key)
      saveOtpStore()
      return { valid: false, message: 'OTP has expired' }
    }
    
    if (record.code !== code) {
      return { valid: false, message: 'Invalid OTP code' }
    }
    
    // Mark as verified
    record.verified = true
    otpStore.set(key, record)
    saveOtpStore()
    
    return { valid: true, message: 'OTP verified successfully' }
  },

  // Check if OTP is verified for an email
  isVerified(email) {
    const key = email.toLowerCase()
    const record = otpStore.get(key)
    return record?.verified === true && Date.now() <= record.expiresAt
  },

  // Clear OTP for an email (after registration complete)
  clearOtp(email) {
    const key = email.toLowerCase()
    otpStore.delete(key)
    saveOtpStore()
  },

  // Resend OTP (generate new code)
  resendOtp(email) {
    return this.generateOtp(email)
  }
}

export default otpService
