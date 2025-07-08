import React, { useState } from 'react'
import { Mail, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function EmailVerificationRequired() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const { user, signOut, resendVerification } = useAuth()

  const handleResendVerification = async () => {
    if (!user?.email) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await resendVerification(user.email)
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Verification email sent! Please check your inbox and spam folder.')
        setMessageType('success')
      }
    } catch (error: any) {
      setMessage('Failed to send verification email. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-10 w-10 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verification Required
            </h2>
            
            <p className="text-gray-600 mb-6">
              Please verify your email address to access your Smart Career Counselor dashboard. 
              We've sent a verification link to:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-blue-900 font-medium">{user?.email}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• Check your email inbox</li>
                <li>• Look in your spam/junk folder</li>
                <li>• Click the verification link</li>
                <li>• Return here to access your dashboard</li>
              </ul>
            </div>

            {message && (
              <div className={`p-3 rounded-lg mb-6 flex items-start space-x-2 ${
                messageType === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                {messageType === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                )}
                <p className={`text-sm ${
                  messageType === 'error' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Having trouble? Check your spam folder or contact support if you don't receive the verification email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}