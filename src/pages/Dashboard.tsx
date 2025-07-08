import React, { useState, useEffect } from 'react'
import { FileText, Users, Award, TrendingUp, Brain, Target } from 'lucide-react'
import { Header } from '../components/Layout/Header'
import { StatsCard } from '../components/Dashboard/StatsCard'
import { ResumeUpload } from '../components/Dashboard/ResumeUpload'
import { PersonalityQuiz } from '../components/Dashboard/PersonalityQuiz'
import { EnhancedCareerRecommendations } from '../components/Dashboard/EnhancedCareerRecommendations'
import { InterestChart } from '../components/Dashboard/InterestChart'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface InterestData {
  category: string
  score: number
  fullMark: 5
}

interface SkillMatchData {
  skill: string
  match: number
}

export function Dashboard() {
  const [stats, setStats] = useState({
    resumeUploaded: false,
    quizCompleted: false,
    recommendationsCount: 0,
    totalScore: 0
  })
  const [interestData, setInterestData] = useState<InterestData[]>([])
  const [skillMatchData, setSkillMatchData] = useState<SkillMatchData[]>([])
  const { user } = useAuth()

  useEffect(() => {
    loadStats()
    loadChartData()
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      // Check if resume is uploaded
      const { data: profile } = await supabase
        .from('profiles')
        .select('resume_text')
        .eq('id', user.id)
        .single()

      // Check quiz responses
      const { data: quizResponses } = await supabase
        .from('quiz_responses')
        .select('score')
        .eq('user_id', user.id)

      // Check recommendations
      const { data: recommendations } = await supabase
        .from('career_recommendations')
        .select('id')
        .eq('user_id', user.id)

      const totalScore = quizResponses?.reduce((sum, response) => sum + response.score, 0) || 0

      setStats({
        resumeUploaded: !!(profile?.resume_text?.trim()),
        quizCompleted: !!(quizResponses && quizResponses.length > 0),
        recommendationsCount: recommendations?.length || 0,
        totalScore
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadChartData = async () => {
    if (!user) return

    try {
      // Load quiz responses for chart data
      const { data: quizResponses } = await supabase
        .from('quiz_responses')
        .select('question_id, answer')
        .eq('user_id', user.id)

      if (quizResponses && quizResponses.length > 0) {
        // Process interest data from quiz responses
        const interests = processInterestData(quizResponses)
        setInterestData(interests)

        // Generate skill match data (mock data for demonstration)
        const skillMatches = generateSkillMatchData(quizResponses)
        setSkillMatchData(skillMatches)
      }
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  const processInterestData = (responses: any[]): InterestData[] => {
    const interestMap: Record<string, number> = {
      'Technology': 0,
      'Creative': 0,
      'Business': 0,
      'Social': 0,
      'Analytical': 0,
      'Leadership': 0
    }

    responses.forEach(response => {
      try {
        const answer = JSON.parse(response.answer)
        
        if (response.question_id === 'skill_interests' && typeof answer === 'object') {
          // Rating question - extract ratings
          Object.entries(answer).forEach(([skill, rating]) => {
            if (skill.includes('AI') || skill.includes('Data')) {
              interestMap['Technology'] += (rating as number)
            } else if (skill.includes('Design')) {
              interestMap['Creative'] += (rating as number)
            } else if (skill.includes('Finance') || skill.includes('Project')) {
              interestMap['Business'] += (rating as number)
            }
          })
        } else if (answer.category) {
          // Single answer with category
          const category = mapCategoryToInterest(answer.category)
          if (category && interestMap[category] !== undefined) {
            interestMap[category] += 1
          }
        } else if (Array.isArray(answer)) {
          // Multiple answers
          answer.forEach(item => {
            if (item.category) {
              const category = mapCategoryToInterest(item.category)
              if (category && interestMap[category] !== undefined) {
                interestMap[category] += 1
              }
            }
          })
        }
      } catch (error) {
        // Handle non-JSON answers
        console.log('Non-JSON answer:', response.answer)
      }
    })

    // Normalize scores to 1-5 scale
    const maxScore = Math.max(...Object.values(interestMap))
    return Object.entries(interestMap).map(([category, score]) => ({
      category,
      score: maxScore > 0 ? Math.max(1, Math.round((score / maxScore) * 5)) : 1,
      fullMark: 5
    }))
  }

  const mapCategoryToInterest = (category: string): string | null => {
    const mapping: Record<string, string> = {
      'tech': 'Technology',
      'technical': 'Technology',
      'creative': 'Creative',
      'business': 'Business',
      'strategic': 'Business',
      'social': 'Social',
      'analytical': 'Analytical',
      'leadership': 'Leadership'
    }
    return mapping[category] || null
  }

  const generateSkillMatchData = (responses: any[]): SkillMatchData[] => {
    // Generate mock skill match data based on quiz responses
    const baseSkills = [
      'Communication',
      'Problem Solving',
      'Leadership',
      'Technical Skills',
      'Creativity',
      'Analysis'
    ]

    return baseSkills.map(skill => ({
      skill,
      match: Math.floor(Math.random() * 30) + 70 // 70-100% range
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">
            Let's continue building your career roadmap with personalized insights and AI-powered recommendations.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Resume Status"
            value={stats.resumeUploaded ? 'Uploaded' : 'Pending'}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Assessment Status"
            value={stats.quizCompleted ? 'Completed' : 'Pending'}
            icon={Brain}
            color="green"
          />
          <StatsCard
            title="AI Recommendations"
            value={stats.recommendationsCount}
            icon={Target}
            color="purple"
          />
          <StatsCard
            title="Career Score"
            value={stats.totalScore}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="xl:col-span-2 space-y-8">
            <ResumeUpload />
            <PersonalityQuiz />
            <EnhancedCareerRecommendations />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {(interestData.length > 0 || skillMatchData.length > 0) && (
              <InterestChart 
                interestData={interestData}
                skillMatchData={skillMatchData}
              />
            )}
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Update Resume</p>
                      <p className="text-sm text-gray-600">Keep your profile current</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Retake Assessment</p>
                      <p className="text-sm text-gray-600">Update your preferences</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Explore Careers</p>
                      <p className="text-sm text-gray-600">Browse career paths</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Completion</span>
                  <span className="text-sm font-medium">
                    {Math.round(((stats.resumeUploaded ? 1 : 0) + (stats.quizCompleted ? 1 : 0) + (stats.recommendationsCount > 0 ? 1 : 0)) / 3 * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.round(((stats.resumeUploaded ? 1 : 0) + (stats.quizCompleted ? 1 : 0) + (stats.recommendationsCount > 0 ? 1 : 0)) / 3 * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-purple-100">
                  Complete all sections to unlock advanced career insights!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}