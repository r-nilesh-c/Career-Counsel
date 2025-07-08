import React, { useState, useEffect } from 'react'
import { BrainCircuit, Star, Users, Award, CheckCircle, Mail } from 'lucide-react'
import { AuthForm } from '../components/Auth/AuthForm'
import { useAuth } from '../contexts/AuthContext'

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false)
  const { resendVerification } = useAuth()

  useEffect(() => {
    // Check if user was redirected after email verification
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('verified') === 'true') {
      setShowVerifiedMessage(true)
      setIsLogin(true)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleResendVerification = async (email: string) => {
    const { error } = await resendVerification(email)
    if (error) {
      alert('Error sending verification email: ' + error.message)
    } else {
      alert('Verification email sent! Please check your inbox.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="flex flex-col justify-center px-12">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <BrainCircuit className="h-12 w-12" />
                <h1 className="text-3xl font-bold">Smart Career Counselor</h1>
              </div>
              <p className="text-xl text-blue-100 mb-8">
                Discover your perfect career path with AI-powered insights and personalized recommendations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Personalized Assessments</h3>
                  <p className="text-blue-100 text-sm">
                    Take our comprehensive career quiz to understand your strengths and interests.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Recommendations</h3>
                  <p className="text-blue-100 text-sm">
                    Get career suggestions tailored to your profile and industry trends.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Expert Guidance</h3>
                  <p className="text-blue-100 text-sm">
                    Access professional insights and skill development recommendations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Verified</h3>
                  <p className="text-blue-100 text-sm">
                    Email verification ensures your account security and data protection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
          {showVerifiedMessage ? (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
                  <p className="text-gray-600 mb-6">
                    Your email has been successfully verified. You can now sign in to your account and start exploring your career path.
                  </p>
                  <button
                    onClick={() => setShowVerifiedMessage(false)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Continue to Sign In
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AuthForm isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
          )}
        </div>
      </div>
    </div>
  )
}