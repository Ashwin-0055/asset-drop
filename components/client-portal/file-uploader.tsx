"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileIcon, Image, Video, Music, Check } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  uploaded?: boolean
  driveFileId?: string
}

interface FileUploaderProps {
  fieldId: string
  label: string
  helpText?: string | null
  isRequired: boolean
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
  multiple?: boolean
  onFilesChange: (fieldId: string, files: FileWithPreview[]) => void
  value?: FileWithPreview[]
}

export function FileUploader({
  fieldId,
  label,
  helpText,
  isRequired,
  acceptedFileTypes = '*',
  maxFileSize = 100, // 100MB default
  multiple = true,
  onFilesChange,
  value = [],
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast({
              title: 'File too large',
              description: `${file.name} is larger than ${maxFileSize}MB`,
              variant: 'destructive',
            })
          } else if (error.code === 'file-invalid-type') {
            toast({
              title: 'Invalid file type',
              description: `${file.name} is not an accepted file type`,
              variant: 'destructive',
            })
          }
        })
      })

      // Process accepted files
      const newFiles: FileWithPreview[] = acceptedFiles.map(file => {
        const fileWithPreview = Object.assign(file, {
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
          uploadProgress: 0,
          uploaded: false,
        })
        return fileWithPreview
      })

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
      setFiles(updatedFiles)
      onFilesChange(fieldId, updatedFiles)
    },
    [files, multiple, fieldId, onFilesChange, maxFileSize]
  )

  // Parse accepted file types into the format react-dropzone expects
  const parseAcceptedTypes = () => {
    if (acceptedFileTypes === '*') return undefined

    // Split by comma and create object with each MIME type as a key
    const types = acceptedFileTypes.split(',').map(t => t.trim())
    const acceptObject: Record<string, string[]> = {}
    types.forEach(type => {
      acceptObject[type] = []
    })
    return acceptObject
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: parseAcceptedTypes(),
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    multiple,
  })

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange(fieldId, newFiles)
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />
    if (fileType.startsWith('audio/')) return <Music className="h-6 w-6" />
    return <FileIcon className="h-6 w-6" />
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {helpText && (
          <p className="text-sm text-gray-500 mt-1">{helpText}</p>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg font-medium text-blue-600">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              {multiple ? 'You can upload multiple files' : 'Upload one file'}
              {maxFileSize && ` (max ${maxFileSize}MB each)`}
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 mt-1">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.uploaded && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Uploaded</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                      <div className="mt-3">
                        <Progress value={file.uploadProgress} />
                        <p className="text-xs text-gray-500 mt-1">
                          {file.uploadProgress}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Image Preview */}
                    {file.preview && (
                      <div className="mt-3">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="max-w-xs max-h-48 rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isRequired && files.length === 0 && (
        <p className="text-sm text-red-500">This field is required</p>
      )}
    </div>
  )
}
