import React, { useState, useEffect } from 'react'
import { Brain, CheckCircle, Circle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface QuizQuestion {
  id: string
  question: string
  type: 'single' | 'multiple' | 'scale' | 'rating'
  options?: { value: string; label: string; category?: string }[]
  categories?: string[]
  min?: number
  max?: number
}

const personalityQuestions: QuizQuestion[] = [
  {
    id: 'industries',
    question: 'Which industries are you most interested in? (Select up to 3)',
    type: 'multiple',
    options: [
      { value: 'technology', label: 'Technology & Software', category: 'tech' },
      { value: 'healthcare', label: 'Healthcare & Medicine', category: 'healthcare' },
      { value: 'finance', label: 'Finance & Banking', category: 'finance' },
      { value: 'education', label: 'Education & Training', category: 'education' },
      { value: 'marketing', label: 'Marketing & Advertising', category: 'marketing' },
      { value: 'design', label: 'Design & Creative Arts', category: 'creative' },
      { value: 'consulting', label: 'Consulting & Strategy', category: 'business' },
      { value: 'manufacturing', label: 'Manufacturing & Engineering', category: 'engineering' }
    ]
  },
  {
    id: 'work_preference',
    question: 'What do you prefer working with most?',
    type: 'single',
    options: [
      { value: 'data', label: 'Data, analytics, and numbers', category: 'analytical' },
      { value: 'people', label: 'People, teams, and relationships', category: 'social' },
      { value: 'machines', label: 'Machines, systems, and technology', category: 'technical' },
      { value: 'ideas', label: 'Ideas, concepts, and creativity', category: 'creative' }
    ]
  },
  {
    id: 'skill_interests',
    question: 'Rate your interest level in these areas (1-5 scale)',
    type: 'rating',
    categories: ['AI & Machine Learning', 'Finance & Investment', 'Marketing & Sales', 'Design & UX', 'Data Analysis', 'Project Management']
  },
  {
    id: 'learning_style',
    question: 'How do you prefer to learn new things?',
    type: 'single',
    options: [
      { value: 'visual', label: 'Visual learning (diagrams, charts, videos)', category: 'visual' },
      { value: 'hands_on', label: 'Hands-on practice and experimentation', category: 'kinesthetic' },
      { value: 'theoretical', label: 'Reading and theoretical understanding', category: 'theoretical' },
      { value: 'collaborative', label: 'Group discussions and collaboration', category: 'social' }
    ]
  },
  {
    id: 'work_environment',
    question: 'What type of work environment energizes you?',
    type: 'single',
    options: [
      { value: 'fast_paced', label: 'Fast-paced, dynamic startup environment', category: 'dynamic' },
      { value: 'structured', label: 'Structured, established corporate setting', category: 'structured' },
      { value: 'remote', label: 'Remote, flexible work arrangements', category: 'flexible' },
      { value: 'collaborative', label: 'Collaborative, team-focused office', category: 'social' }
    ]
  },
  {
    id: 'problem_solving',
    question: 'What type of problems do you enjoy solving?',
    type: 'single',
    options: [
      { value: 'technical', label: 'Technical challenges and system optimization', category: 'technical' },
      { value: 'strategic', label: 'Strategic business problems', category: 'strategic' },
      { value: 'creative', label: 'Creative and design challenges', category: 'creative' },
      { value: 'interpersonal', label: 'People and communication challenges', category: 'social' }
    ]
  },
  {
    id: 'career_goals',
    question: 'What are your primary career goals?',
    type: 'multiple',
    options: [
      { value: 'leadership', label: 'Leading teams and organizations', category: 'leadership' },
      { value: 'expertise', label: 'Becoming a subject matter expert', category: 'expertise' },
      { value: 'innovation', label: 'Creating innovative solutions', category: 'innovation' },
      { value: 'impact', label: 'Making a positive social impact', category: 'impact' },
      { value: 'financial', label: 'Achieving financial success', category: 'financial' },
      { value: 'balance', label: 'Maintaining work-life balance', category: 'balance' }
    ]
  },
  {
    id: 'communication_style',
    question: 'How do you prefer to communicate at work?',
    type: 'single',
    options: [
      { value: 'presentations', label: 'Formal presentations and public speaking', category: 'formal' },
      { value: 'writing', label: 'Written reports and documentation', category: 'written' },
      { value: 'meetings', label: 'Small group meetings and discussions', category: 'collaborative' },
      { value: 'one_on_one', label: 'One-on-one conversations', category: 'personal' }
    ]
  }
]

export function PersonalityQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    checkExistingQuiz()
  }, [user])

  const checkExistingQuiz = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('question_id, answer')
        .eq('user_id', user.id)

      if (error) throw error

      if (data && data.length > 0) {
        const existingAnswers: Record<string, any> = {}
        data.forEach(response => {
          try {
            existingAnswers[response.question_id] = JSON.parse(response.answer)
          } catch {
            existingAnswers[response.question_id] = response.answer
          }
        })
        setAnswers(existingAnswers)
        setCompleted(true)
      }
    } catch (error) {
      console.error('Error checking existing quiz:', error)
    }
  }

  const handleSingleAnswer = (questionId: string, value: string, category?: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, category }
    }))
  }

  const handleMultipleAnswer = (questionId: string, value: string, category?: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || []
      const exists = current.find((item: any) => item.value === value)
      
      if (exists) {
        return {
          ...prev,
          [questionId]: current.filter((item: any) => item.value !== value)
        }
      } else {
        if (current.length >= 3) return prev // Limit to 3 selections
        return {
          ...prev,
          [questionId]: [...current, { value, category }]
        }
      }
    })
  }

  const handleRatingAnswer = (questionId: string, category: string, rating: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [category]: rating
      }
    }))
  }

  const handleNext = () => {
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    
    try {
      // Save quiz responses
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        user_id: user.id,
        question_id: questionId,
        answer: JSON.stringify(answer),
        score: calculateQuestionScore(answer),
        created_at: new Date().toISOString()
      }))

      // Delete existing responses for this user
      await supabase
        .from('quiz_responses')
        .delete()
        .eq('user_id', user.id)

      // Insert new responses
      const { error: responsesError } = await supabase
        .from('quiz_responses')
        .insert(responses)

      if (responsesError) throw responsesError

      setCompleted(true)
      
      // Generate AI recommendations
      await generateRecommendations()
    } catch (error) {
      console.error('Error saving quiz results:', error)
      setError('Failed to save quiz results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    if (!user) return

    setGenerating(true)
    setError(null)
    
    try {
      const envUrl = import.meta.env.VITE_SUPABASE_URL
      const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!envUrl || !envKey) {
        throw new Error("Missing environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      }

      const apiUrl = `${envUrl}/functions/v1/generate-recommendations`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate recommendations'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate recommendations')
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(`Failed to generate recommendations: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }

  const calculateQuestionScore = (answer: any): number => {
    if (typeof answer === 'object' && answer.value) {
      return 3 // Default score for single answers
    }
    if (Array.isArray(answer)) {
      return answer.length * 2 // Score based on number of selections
    }
    if (typeof answer === 'object') {
      // For rating questions, calculate average
      const ratings = Object.values(answer) as number[]
      return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
    }
    return 1
  }

  const currentQ = personalityQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / personalityQuestions.length) * 100
  const isAnswered = answers[currentQ.id] && (
    (currentQ.type === 'single' && answers[currentQ.id].value) ||
    (currentQ.type === 'multiple' && Array.isArray(answers[currentQ.id]) && answers[currentQ.id].length > 0) ||
    (currentQ.type === 'rating' && Object.keys(answers[currentQ.id] || {}).length === currentQ.categories?.length)
  )

  if (completed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Brain className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Personality Assessment Complete!</h3>
          <p className="text-gray-600 mb-6">
            Your personality profile has been analyzed. {generating ? 'We\'re now generating personalized career recommendations based on your responses.' : 'Check your career recommendations below!'}
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}
          
          {generating && (
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="text-purple-600 font-medium">Generating AI recommendations...</span>
            </div>
          )}

          <button
            onClick={() => {
              setCompleted(false)
              setCurrentQuestion(0)
              setError(null)
            }}
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Personality & Interest Assessment</h3>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {currentQuestion + 1} of {personalityQuestions.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          This assessment helps us understand your personality and career preferences
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            {currentQ.question}
          </h4>
          
          {currentQ.type === 'single' && (
            <div className="space-y-3">
              {currentQ.options?.map((option) => {
                const isSelected = answers[currentQ.id]?.value === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSingleAnswer(currentQ.id, option.value, option.category)}
                    className={`w-full flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-left ${isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {currentQ.type === 'multiple' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Select up to 3 options</p>
              {currentQ.options?.map((option) => {
                const isSelected = answers[currentQ.id]?.some((item: any) => item.value === option.value)
                const selectionCount = answers[currentQ.id]?.length || 0
                const canSelect = selectionCount < 3 || isSelected
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMultipleAnswer(currentQ.id, option.value, option.category)}
                    disabled={!canSelect}
                    className={`w-full flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : canSelect
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-left ${isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {currentQ.type === 'rating' && (
            <div className="space-y-6">
              {currentQ.categories?.map((category) => (
                <div key={category} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">{category}</label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 w-16">Not interested</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRatingAnswer(currentQ.id, category, rating)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            answers[currentQ.id]?.[category] >= rating
                              ? 'bg-purple-500 border-purple-500 text-white'
                              : 'border-gray-300 hover:border-purple-300 text-gray-400'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 w-16">Very interested</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isAnswered || loading}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{currentQuestion === personalityQuestions.length - 1 ? 'Complete Assessment' : 'Next Question'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}