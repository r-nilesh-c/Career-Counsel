import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  resume_text: string | null
  resume_file_path: string | null
  resume_file_name: string | null
  created_at: string
  updated_at: string
}

export type QuizResponse = {
  id: string
  user_id: string
  question_id: string
  answer: string
  score: number
  created_at: string
}

export type CareerRecommendation = {
  id: string
  user_id: string
  career_title: string
  match_score: number
  description: string | null
  recommended_skills: string[]
  created_at: string
}