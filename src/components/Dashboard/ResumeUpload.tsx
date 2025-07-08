import React, { useState, useEffect, useRef } from 'react'
import { FileText, Save, Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Profile } from '../../lib/supabase'

export function ResumeUpload() {
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [currentFileName, setCurrentFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('resume_text, resume_file_name')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile exists, create one
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (upsertError) {
          console.error('Error creating profile:', upsertError)
        }
        return
      }

      if (error) {
        throw error
      }

      if (data?.resume_text) {
        setResumeText(data.resume_text)
      }
      if (data?.resume_file_name) {
        setCurrentFileName(data.resume_file_name)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        showMessage('Please select a PDF file.', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showMessage('File size must be less than 10MB.', 'error')
        return
      }
      setResumeFile(file)
    }
  }

  const handleFileUpload = async () => {
    if (!resumeFile || !user) return

    setUploading(true)
    setExtracting(false)

    try {
      // Upload file to Supabase Storage
      const fileExt = 'pdf'
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploading(false)
      setExtracting(true)

      // Call the PDF extraction edge function
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: fileName,
            userId: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to extract PDF text')
        }

        const result = await response.json()
        
        if (result.success && result.extractedText) {
          setResumeText(result.extractedText)
          showMessage('PDF text extracted successfully! You can edit the text below if needed.')
        } else {
          throw new Error('No text could be extracted from the PDF')
        }
      } catch (extractError) {
        console.error('PDF extraction error:', extractError)
        
        // Fallback: Create a basic placeholder with file info
        const placeholderText = `Resume uploaded from file: ${resumeFile.name}

[PDF text extraction failed - please manually add your resume content below]

File uploaded on: ${new Date().toLocaleString()}
File size: ${(resumeFile.size / 1024 / 1024).toFixed(2)} MB

Please copy and paste your resume content here to replace this placeholder text.`

        // Update profile with placeholder text and file info
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            resume_text: placeholderText,
            resume_file_path: fileName,
            resume_file_name: resumeFile.name,
            updated_at: new Date().toISOString()
          })

        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(`Failed to save file info: ${updateError.message}`)
        }

        setResumeText(placeholderText)
        showMessage('PDF uploaded but text extraction failed. Please manually add your resume content below.', 'error')
      }

      // Update file info regardless of extraction success
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          resume_file_path: fileName,
          resume_file_name: resumeFile.name,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('File info update error:', updateError)
      }

      setCurrentFileName(resumeFile.name)
      setResumeFile(null)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error uploading resume:', error)
      showMessage(`Error uploading resume: ${error.message}`, 'error')
    } finally {
      setUploading(false)
      setExtracting(false)
    }
  }

  const handleTextSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          resume_text: resumeText,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      showMessage('Resume text saved successfully!')
    } catch (error) {
      console.error('Error saving resume text:', error)
      showMessage('Error saving resume text. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeSelectedFile = () => {
    setResumeFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Resume Upload</h3>
      </div>

      <div className="space-y-6">
        {/* PDF Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">Upload PDF Resume</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload your resume as a PDF file for automatic text extraction
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <File className="h-4 w-4 mr-2" />
              Choose PDF File
            </label>
            
            <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
          </div>

          {/* Selected File Display */}
          {resumeFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{resumeFile.name}</span>
                  <span className="text-xs text-blue-600">
                    ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={handleFileUpload}
                disabled={uploading || extracting}
                className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : extracting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Extracting text...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload & Extract Text</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Current File Display */}
          {currentFileName && !resumeFile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Current file: {currentFileName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Manual Text Input Section */}
        <div>
          <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 mb-2">
            Resume Text
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Edit your resume content here. Text will be automatically extracted from uploaded PDFs.
          </p>
          <textarea
            id="resume-text"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Upload a PDF file above or paste your resume text here..."
          />
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center space-x-2 ${
            messageType === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-600' 
              : 'bg-green-50 border border-green-200 text-green-600'
          }`}>
            {messageType === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleTextSave}
          disabled={saving || !resumeText.trim()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Resume Text'}</span>
        </button>
      </div>
    </div>
  )
}