'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText } from 'lucide-react'

interface PDFUploadProps {
  onPDFExtracted: (text: string) => void
  username: string
}

export default function PDFUpload({ onPDFExtracted, username }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }

    setIsUploading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('username', username)

      const response = await fetch('/api/pdf-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onPDFExtracted(data.text)
        alert('PDF uploaded and processed successfully!')
      } else {
        alert(data.error || 'Failed to process PDF')
      }
    } catch (error) {
      console.error('PDF upload error:', error)
      alert('Failed to upload PDF. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="pdf-upload" className="text-sm font-medium">
          Upload Diet Plan PDF
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
        <Label
          htmlFor="pdf-upload"
          className="flex items-center space-x-2 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-4 py-2 text-sm transition-colors"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Choose PDF File</span>
            </>
          )}
        </Label>
      </div>

      {fileName && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>{fileName}</span>
        </div>
      )}
    </div>
  )
}