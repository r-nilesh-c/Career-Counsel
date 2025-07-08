import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateRecommendationsRequest {
  userId: string
  jobType?: 'full-time' | 'internship'
}

interface QuizResponse {
  question_id: string
  answer: string
  score: number
}

interface Profile {
  resume_text: string | null
}

interface CareerRecommendation {
  title: string
  match_score: number
  description: string
  skills: string[]
  reasoning: string
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// OpenRouter API configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
console.log('OpenRouter API Key available:', !!OPENROUTER_API_KEY)

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = OPENROUTER_API_KEY;
  console.log('Calling OpenRouter API...')
  
  if (!apiKey) {
    console.error('OpenRouter API key not set')
    throw new Error("OpenRouter API key not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Career Recommender App"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are a career counselor AI. Respond in strict JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  console.log('OpenRouter API response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error body:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('OpenRouter API response received')
  return data.choices?.[0]?.message?.content || '';
}

function buildPrompt(resumeText: string, quizAnswers: QuizResponse[], jobType: 'full-time' | 'internship'): string {
  const quizSummary = quizAnswers.map(qa => 
    `Question ${qa.question_id}: ${qa.answer} (Score: ${qa.score})`
  ).join('\n')

  const jobTypeContext = jobType === 'internship' 
    ? 'Focus on internship opportunities that provide learning experiences and skill development for students or recent graduates.'
    : 'Focus on full-time career opportunities for experienced professionals or career changers.'

  return `You are a career counselor AI. Based on the following user data, provide exactly 3 ${jobType} career recommendations in JSON format.

JOB TYPE: ${jobType.toUpperCase()}
${jobTypeContext}

RESUME TEXT:
${resumeText || 'No resume provided'}

QUIZ RESPONSES:
${quizSummary || 'No quiz responses'}

Please respond with a valid JSON array containing exactly 3 ${jobType} career recommendations.
The title should be something that is compatible on a linkedin search to so that careers of that title can be searched up.Each recommendation should have:
- title: The job title ${jobType === 'internship' ? '(include "Intern" in the title)' : ''}
- match_score: A percentage (0-100) indicating how well this career matches
- description: A brief description of the role ${jobType === 'internship' ? 'and learning opportunities' : 'and responsibilities'}
- skills: An array of 3-5 relevant skills needed
- reasoning: A short explanation of why this ${jobType} fits

Format your response as a JSON array only, no additional text:

[
  {
    "title": "${jobType === 'internship' ? 'Career Title Intern' : 'Career Title'}",
    "match_score": 85,
    "description": "Brief description of the ${jobType} role and ${jobType === 'internship' ? 'learning opportunities' : 'responsibilities'}",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "reasoning": "Why this ${jobType} matches based on resume and quiz responses"
  }
]`
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, jobType = 'full-time' }: GenerateRecommendationsRequest = await req.json()
    console.log('Generating recommendations for user:', userId, 'Job type:', jobType)

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch user's resume text
    console.log('Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_text')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    // Fetch user's quiz responses
    console.log('Fetching quiz responses...')
    const { data: quizResponses, error: quizError } = await supabase
      .from('quiz_responses')
      .select('question_id, answer, score')
      .eq('user_id', userId)

    if (quizError) {
      console.error('Quiz responses fetch error:', quizError)
      throw new Error(`Failed to fetch quiz responses: ${quizError.message}`)
    }

    const resumeText = profile?.resume_text || ''
    const quizAnswers = quizResponses || []

    console.log('Resume text length:', resumeText.length)
    console.log('Quiz answers count:', quizAnswers.length)

    let recommendations: CareerRecommendation[] = []

    try {
      // Try to get AI-generated recommendations
      if (OPENROUTER_API_KEY && (resumeText || quizAnswers.length > 0)) {
        console.log('Building prompt for AI...')
        const prompt = buildPrompt(resumeText, quizAnswers, jobType)
        console.log('Prompt built, calling OpenRouter...')
        
        const aiResponse = await callOpenRouter(prompt);
        console.log("AI Raw Output:", aiResponse)

        // Parse AI response
        try {
          // Remove Markdown formatting if present
          const cleanResponse = aiResponse.trim().replace(/^```json\n?/, '').replace(/```$/, '');
          console.log('Cleaned AI response:', cleanResponse)

          const parsedRecommendations = JSON.parse(cleanResponse);
          console.log('Parsed recommendations:', parsedRecommendations)
          
          if (Array.isArray(parsedRecommendations) && parsedRecommendations.length > 0) {
            recommendations = parsedRecommendations.slice(0, 3);
            console.log('Successfully parsed', recommendations.length, 'recommendations')
          } else {
            console.error('AI response is not a valid array or is empty')
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          console.error('Raw response that failed to parse:', aiResponse)
        }
      } else {
        console.log('Skipping AI generation - missing API key or data')
      }
    } catch (aiError) {
      console.error('AI API error:', aiError)
    }

    // Ensure we have recommendations - provide fallback if AI failed
    if (recommendations.length === 0) {
      console.log('No AI recommendations generated, using fallback')
      
      if (jobType === 'internship') {
        recommendations = [
          {
            title: 'Error Intern',
            match_score: 75,
            description: 'Learn software development fundamentals while working on real projects with experienced developers.',
            skills: ['Programming Basics', 'Version Control', 'Problem Solving', 'Team Collaboration'],
            reasoning: 'Great entry point for learning technical skills and gaining industry experience.'
          },
          {
            title: 'Business Analysis Intern',
            match_score: 70,
            description: 'Support business analysts in gathering requirements and improving business processes.',
            skills: ['Data Analysis', 'Documentation', 'Communication', 'Process Mapping'],
            reasoning: 'Excellent opportunity to develop analytical and communication skills.'
          },
          {
            title: 'Marketing Intern',
            match_score: 68,
            description: 'Assist with marketing campaigns, content creation, and social media management.',
            skills: ['Content Creation', 'Social Media', 'Market Research', 'Analytics'],
            reasoning: 'Perfect for developing creative and digital marketing skills.'
          }
        ]
      } else {
        recommendations = [
          {
            title: 'Error',
            match_score: 75,
            description: 'Analyze business processes and requirements to drive organizational improvements.',
            skills: ['Data Analysis', 'Requirements Gathering', 'Process Improvement', 'Documentation'],
            reasoning: 'A versatile role that combines analytical thinking with communication skills.'
          },
          {
            title: 'Project Coordinator',
            match_score: 70,
            description: 'Support project managers in planning, executing, and monitoring project activities.',
            skills: ['Project Management', 'Communication', 'Organization', 'Time Management'],
            reasoning: 'An excellent entry point for developing leadership and organizational skills.'
          },
          {
            title: 'Customer Success Manager',
            match_score: 68,
            description: 'Ensure customer satisfaction and drive product adoption and retention.',
            skills: ['Customer Relations', 'Communication', 'Problem Solving', 'Product Knowledge'],
            reasoning: 'Combines interpersonal skills with business acumen for customer-focused roles.'
          }
        ]
      }
    }

    console.log('Final recommendations count:', recommendations.length)

    // Store recommendations in database
    const recommendationsToStore = recommendations.map(rec => ({
      user_id: userId,
      career_title: rec.title,
      match_score: rec.match_score,
      description: rec.description,
      recommended_skills: rec.skills,
      job_type: jobType,
      created_at: new Date().toISOString()
    }))

    console.log('Deleting existing recommendations for job type:', jobType)
    // Delete existing recommendations for this user and job type
    await supabase
      .from('career_recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('job_type', jobType)

    console.log('Inserting new recommendations...')
    // Insert new recommendations
    const { error: insertError } = await supabase
      .from('career_recommendations')
      .insert(recommendationsToStore)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to store recommendations: ${insertError.message}`)
    }

    console.log('Recommendations stored successfully')

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        message: `${jobType} career recommendations generated successfully`,
        source: OPENROUTER_API_KEY ? 'ai_generated' : 'rule_based',
        jobType
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error generating recommendations:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate career recommendations',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})