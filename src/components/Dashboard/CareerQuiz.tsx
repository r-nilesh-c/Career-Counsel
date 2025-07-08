import React, { useState } from 'react'
import { CheckCircle, Circle, Award } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const quizQuestions = [
  {
    id: 'q1',
    question: 'What type of work environment do you prefer?',
    options: [
      { value: 'team', label: 'Collaborative team environment', score: 3 },
      { value: 'independent', label: 'Independent work with minimal supervision', score: 2 },
      { value: 'mixed', label: 'Mix of both team and independent work', score: 4 },
      { value: 'leadership', label: 'Leading and managing others', score: 5 }
    ]
  },
  {
    id: 'q2',
    question: 'Which skills do you enjoy using most?',
    options: [
      { value: 'analytical', label: 'Analytical and problem-solving skills', score: 4 },
      { value: 'creative', label: 'Creative and artistic abilities', score: 3 },
      { value: 'communication', label: 'Communication and interpersonal skills', score: 5 },
      { value: 'technical', label: 'Technical and specialized knowledge', score: 4 }
    ]
  },
  {
    id: 'q3',
    question: 'What motivates you most in your career?',
    options: [
      { value: 'impact', label: 'Making a positive impact on society', score: 5 },
      { value: 'growth', label: 'Personal and professional growth', score: 4 },
      { value: 'stability', label: 'Job security and stability', score: 3 },
      { value: 'innovation', label: 'Innovation and cutting-edge work', score: 4 }
    ]
  },
  {
    id: 'q4',
    question: 'How do you prefer to learn new things?',
    options: [
      { value: 'hands-on', label: 'Hands-on experience and practice', score: 4 },
      { value: 'structured', label: 'Structured courses and formal education', score: 3 },
      { value: 'mentorship', label: 'Mentorship and guidance from experts', score: 4 },
      { value: 'self-directed', label: 'Self-directed research and exploration', score: 3 }
    ]
  },
  {
    id: 'q5',
    question: 'What type of challenges excite you?',
    options: [
      { value: 'complex-problems', label: 'Complex problem-solving challenges', score: 5 },
      { value: 'people-challenges', label: 'People and relationship challenges', score: 4 },
      { value: 'creative-challenges', label: 'Creative and design challenges', score: 4 },
      { value: 'strategic-challenges', label: 'Strategic and business challenges', score: 5 }
    ]
  }
]

export function CareerQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({})
  const [completed, setCompleted] = useState(false)
  const [loading, setSaving] = useState(false)
  const { user } = useAuth()

  const handleAnswer = (questionId: string, value: string, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, score }
    }))
  }

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Save quiz responses
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        user_id: user.id,
        question_id: questionId,
        answer: answer.value,
        score: answer.score
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
    } catch (error) {
      console.error('Error saving quiz results:', error)
    } finally {
      setSaving(false)
    }
  }

  const currentQ = quizQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  if (completed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz Completed!</h3>
          <p className="text-gray-600">
            Your quiz responses have been saved. You can now generate AI-powered career recommendations 
            based on your answers and resume.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Career Assessment Quiz</h3>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} of {quizQuestions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {currentQ.question}
          </h4>
          
          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id]?.value === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQ.id, option.value, option.score)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-left ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentQ.id] || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : currentQuestion === quizQuestions.length - 1 ? 'Complete Quiz' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  )
}