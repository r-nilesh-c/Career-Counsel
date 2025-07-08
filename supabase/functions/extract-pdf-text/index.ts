import { createClient } from 'npm:@supabase/supabase-js@2'
import pdf from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface ExtractRequest {
  filePath: string
  userId: string
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sanitize text to remove problematic characters
function sanitizeText(text: string): string {
  return text
    // Remove null bytes and control characters except newlines, tabs, and carriage returns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove lone surrogates (invalid Unicode)
    .replace(/[\uD800-\uDFFF]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract text from PDF using pdf-parse
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Buffer for pdf-parse
    const buffer = new Uint8Array(pdfBuffer)
    
    // Use pdf-parse to extract text
    const data = await pdf(buffer)
    
    if (data.text && data.text.trim().length > 0) {
      return sanitizeText(data.text)
    } else {
      return 'No text content found in PDF. Please copy and paste your resume content manually.'
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    return 'Error extracting text from PDF. Please copy and paste your resume content manually.'
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath, userId }: ExtractRequest = await req.json()

    if (!filePath || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing filePath or userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert blob to ArrayBuffer
    const pdfBuffer = await fileData.arrayBuffer()
    
    // Extract text from PDF using pdf-parse
    const extractedText = await extractTextFromPDF(pdfBuffer)

    // Update profile with extracted text and file info
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        resume_text: extractedText,
        resume_file_path: filePath,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      throw new Error(`Failed to save resume text: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        message: 'PDF text extracted and saved successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process PDF file',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})