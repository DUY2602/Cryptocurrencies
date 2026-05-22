// Mock Email Service for Stage 1 (frontend-only)
// In production, this would be replaced with a backend API call

export const emailService = {
  // Send OTP to email
  async sendOtp(email, otp) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Log OTP to console for demonstration
    console.log('='.repeat(50))
    console.log('EMAIL SERVICE MOCK')
    console.log('='.repeat(50))
    console.log(`To: ${email}`)
    console.log(`Subject: Your Verification Code`)
    console.log(`Body: Your verification code is: ${otp}`)
    console.log(`This code will expire in 5 minutes.`)
    console.log('='.repeat(50))
    
    // In production, this would make an API call to send email
    // Example:
    // await fetch('/api/send-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, otp })
    // })
    
    return { success: true, message: 'Email sent successfully' }
  },
  
  // Send welcome email after registration
  async sendWelcomeEmail(email, name) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('='.repeat(50))
    console.log('EMAIL SERVICE MOCK')
    console.log('='.repeat(50))
    console.log(`To: ${email}`)
    console.log(`Subject: Welcome to CryptoDash!`)
    console.log(`Body: Welcome ${name}! Your account has been successfully created.`)
    console.log('='.repeat(50))
    
    return { success: true, message: 'Welcome email sent' }
  }
}

export default emailService
