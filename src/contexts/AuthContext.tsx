import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; needsVerification?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resendVerification: (email: string) => Promise<{ error: any }>
  deleteAccount: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        },
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('over_email_send_rate_limit')) {
          return { 
            error: { 
              message: 'Email sending limit exceeded. Please wait a few minutes and try again.' 
            } 
          }
        }
        if (error.message.includes('Error sending confirmation email') || error.message.includes('unexpected_failure')) {
          return { 
            error: { 
              message: 'Unable to send verification email. Please contact support or try again later. Your account may have been created - try signing in.' 
            } 
          }
        }
        if (error.message.includes('User already registered')) {
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.' 
            } 
          }
        }
        return { error }
      }

      // Check if user needs to verify email
      const needsVerification = data.user && !data.session

      return { error: null, needsVerification }
    } catch (error: any) {
      return { 
        error: { 
          message: 'Registration failed. Please check your internet connection and try again.' 
        } 
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return { 
            error: { 
              message: 'Invalid email or password. Please check your credentials and try again.' 
            } 
          }
        }
        if (error.message.includes('Email not confirmed')) {
          return { 
            error: { 
              message: 'Please check your email and click the verification link before signing in.' 
            } 
          }
        }
        if (error.message.includes('Too many requests')) {
          return { 
            error: { 
              message: 'Too many sign-in attempts. Please wait a few minutes before trying again.' 
            } 
          }
        }
        return { error }
      }

      return { error: null }
    } catch (error: any) {
      return { 
        error: { 
          message: 'Sign in failed. Please check your internet connection and try again.' 
        } 
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        }
      })

      if (error) {
        if (error.message.includes('over_email_send_rate_limit')) {
          return { 
            error: { 
              message: 'Email sending limit exceeded. Please wait a few minutes and try again.' 
            } 
          }
        }
        if (error.message.includes('Error sending confirmation email') || error.message.includes('unexpected_failure')) {
          return { 
            error: { 
              message: 'Unable to send verification email. Please contact support or try again later.' 
            } 
          }
        }
        return { error }
      }

      return { error: null }
    } catch (error: any) {
      return { 
        error: { 
          message: 'Failed to resend verification email. Please try again later.' 
        } 
      }
    }
  }

  const deleteAccount = async () => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      // Call the delete-user edge function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      // Immediately clear local state since the user has been deleted on the server
      setUser(null)
      setSession(null)
      
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendVerification,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}