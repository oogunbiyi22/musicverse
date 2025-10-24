'use client'

import { useState } from "react"
import { supabase } from "@/utils/supabase"
import { uploadFile } from "@/lib/fileStorage"

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setUploading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to upload")
        return
      }

      const publicUrl = await uploadFile(user.id, file)
      setUrl(publicUrl)
      setFile(null) // Reset file input after successful upload
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Upload Beat / Song / Sample</h1>
      
      <div className="space-y-6">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setError("") // Clear any previous errors
            }}
            className="mb-4 w-full cursor-pointer text-sm text-gray-600
              file:mr-4 file:cursor-pointer file:rounded-full file:border-0
              file:bg-blue-50 file:px-4 file:py-2 file:text-sm
              file:font-semibold file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white
            transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2
            focus:ring-blue-500/20 disabled:bg-gray-300"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {url && (
          <div className="rounded-lg bg-green-50 p-6">
            <p className="mb-4 text-green-700">✅ Upload successful!</p>
            <audio 
              controls 
              src={url} 
              className="w-full"
            />
            <p className="mt-2 text-sm text-gray-600">
              Your audio file is now available at this URL
            </p>
          </div>
        )}
      </div>
    </div>
  )
}