import React, { useState, useEffect } from 'react'
import { Star, TrendingUp, Award, BookOpen, RefreshCw, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, CareerRecommendation } from '../../lib/supabase'

export function CareerRecommendations() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadRecommendations()
  }, [user])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('career_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('match_score', { ascending: false })

      if (error) throw error
      setRecommendations(data || [])
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
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate recommendations')
      }

      const result = await response.json()
      
      if (result.success) {
        // Reload recommendations from database
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
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Career Recommendations</h3>
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
              <span>Generate AI Recommendations</span>
            </>
          )}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 mb-4">
            Complete your resume and career assessment quiz, then generate AI-powered career recommendations.
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
                <span>Generate Recommendations</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div
              key={recommendation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{recommendation.career_title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">{recommendation.match_score}% match</span>
                    </div>
                  </div>
                </div>
              </div>

              {recommendation.description && (
                <p className="text-gray-700 mb-3">{recommendation.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {recommendation.recommended_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={generateRecommendations}
              disabled={generating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              <span>Regenerate Recommendations</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}