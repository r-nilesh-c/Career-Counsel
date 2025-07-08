import React, { useState } from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { deleteAccount, user } = useAuth()

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await deleteAccount()
      if (error) {
        setError(error.message)
      } else {
        // Account deleted successfully, modal will close when user is signed out
        onClose()
      }
    } catch (error: any) {
      setError('Failed to delete account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 rounded-full p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">This action cannot be undone</h4>
            <p className="text-sm text-red-700">
              Deleting your account will permanently remove:
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• Your profile and resume data</li>
              <li>• All quiz responses and assessments</li>
              <li>• Career recommendations and history</li>
              <li>• All uploaded files</li>
            </ul>
          </div>

          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE" to confirm account deletion
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE here"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}