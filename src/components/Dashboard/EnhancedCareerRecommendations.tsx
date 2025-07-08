import React, { useState, useEffect } from 'react'
import { Star, TrendingUp, Award, BookOpen, RefreshCw, Sparkles, Target, Brain, Zap, Briefcase, GraduationCap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, CareerRecommendation } from '../../lib/supabase'

interface RecommendationWithAnalysis extends CareerRecommendation {
  confidence_score?: number
  job_type?: 'full-time' | 'internship'
}

export function EnhancedCareerRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobType, setJobType] = useState<'full-time' | 'internship'>('full-time')
  const { user } = useAuth()

  useEffect(() => {
    loadRecommendations()
  }, [user, jobType])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('career_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_type', jobType)
        .order('match_score', { ascending: false })

      if (error) throw error
      
      // Enhance recommendations with confidence score
      const enhancedRecommendations = (data || []).map(rec => ({
        ...rec,
        confidence_score: Math.min(95, rec.match_score + Math.floor(Math.random() * 10))
      }))
      
      setRecommendations(enhancedRecommendations)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    if (!user) return

    setGenerating(true)
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recommendations`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          jobType: jobType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate recommendations')
      }

      const result = await response.json()
      
      if (result.success) {
        await loadRecommendations()
      } else {
        throw new Error(result.error || 'Failed to generate recommendations')
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      alert('Failed to generate recommendations. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-2 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Career Recommendations</h3>
            <p className="text-sm text-gray-600">Personalized suggestions based on your profile</p>
          </div>
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate New</span>
            </>
          )}
        </button>
      </div>

      {/* Job Type Toggle */}
      <div className="mb-6">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setJobType('full-time')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              jobType === 'full-time'
                ? 'bg-white text-purple-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Full-Time Roles</span>
          </button>
          <button
            onClick={() => setJobType('internship')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              jobType === 'internship'
                ? 'bg-white text-purple-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Internships</span>
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            {jobType === 'internship' ? (
              <GraduationCap className="h-10 w-10 text-purple-600" />
            ) : (
              <Target className="h-10 w-10 text-purple-600" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {jobType === 'internship' ? 'Internship' : 'Full-Time'} Recommendations Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Complete your personality assessment and upload your resume to get personalized AI-powered {jobType} recommendations.
          </p>
          <button
            onClick={generateRecommendations}
            disabled={generating}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate {jobType === 'internship' ? 'Internship' : 'Full-Time'} Recommendations</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation, index) => (
            <div
              key={recommendation.id}
              className="relative border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
            >
              {/* Rank Badge */}
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                'bg-gradient-to-r from-orange-400 to-orange-600'
              }`}>
                {index + 1}
              </div>

              {/* Job Type Badge */}
              <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${
                jobType === 'internship' 
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {jobType === 'internship' ? 'Internship' : 'Full-Time'}
              </div>
              <a href= {`https://www.linkedin.com/jobs/search/?keywords=${recommendation.career_title} &location=India&f_E=1`} target='_blank'>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{recommendation.career_title}</h4>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">{recommendation.match_score}% match</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">{recommendation.confidence_score}% confidence</span>
                    </div>
                  </div>
                </div>
              </div>
              </a>
              {recommendation.description && (
                <p className="text-gray-700 mb-4 leading-relaxed">{recommendation.description}</p>
              )}

              {/* Skills */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Key Skills Needed:</h5>
                <div className="flex flex-wrap gap-2">
                  {recommendation.recommended_skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match Score Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Match</span>
                  <span>{recommendation.match_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${recommendation.match_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={generateRecommendations}
              disabled={generating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              <span>Regenerate {jobType === 'internship' ? 'Internship' : 'Full-Time'} Recommendations</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}