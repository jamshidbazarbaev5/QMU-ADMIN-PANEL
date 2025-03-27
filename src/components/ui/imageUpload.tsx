import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface ImageUploadProps {
  onChange: (file: File | null) => void
  previewUrl?: string | null
  className?: string
}

export function ImageUpload({ onChange, previewUrl, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={`relative ${className || ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
          >
            ✕
          </button>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-gray-500 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <Upload className="h-10 w-10 mb-2" />
          <p className="text-sm">Click or drag image to upload</p>
        </div>
      )}
    </div>
  )
}