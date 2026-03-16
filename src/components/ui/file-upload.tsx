/**
 * 文件上传组件
 * 支持拖拽上传、文件格式验证、进度显示等功能
 */

import * as React from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn, formatFileSize } from '../../lib/utils'
import { isFileSupported, getFileInfo } from '../../lib/parsers'
import type { ParseProgress } from '../../types'

export interface FileUploadProps {
  /** 是否允许多文件上传 */
  multiple?: boolean
  /** 文件上传回调 */
  onFileSelect?: (files: File[]) => void
  /** 文件上传进度回调 */
  onProgress?: (progress: ParseProgress) => void
  /** 上传完成回调 */
  onComplete?: (results: any[]) => void
  /** 错误回调 */
  onError?: (error: string) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 最大文件大小（字节） */
  maxSize?: number
  /** 接受的文件类型 */
  accept?: string
}

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

export interface FileUploadRef {
  clearFiles: () => void
  updateFileStatus: (fileId: string, status: UploadFile['status'], progress?: number, error?: string) => void
  files: UploadFile[]
}

/**
 * 文件上传组件
 */
export const FileUpload = React.forwardRef<FileUploadRef, FileUploadProps>(
  ({
    multiple = false,
    onFileSelect,
    onProgress,
    onComplete,
    onError,
    disabled = false,
    className,
    maxSize = 50 * 1024 * 1024, // 50MB
    accept = '.epub,.txt',
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false)
    const [uploadFiles, setUploadFiles] = React.useState<UploadFile[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    /**
     * 处理文件选择
     */
    const handleFileSelect = React.useCallback((files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const validFiles: File[] = []
      const errors: string[] = []

      // 验证文件
      fileArray.forEach(file => {
        if (!isFileSupported(file)) {
          errors.push(`不支持的文件格式: ${file.name}`)
          return
        }

        if (file.size > maxSize) {
          errors.push(`文件过大: ${file.name} (${formatFileSize(file.size)})`)
          return
        }

        validFiles.push(file)
      })

      // 处理错误
      if (errors.length > 0) {
        onError?.(errors.join('\n'))
      }

      // 处理有效文件
      if (validFiles.length > 0) {
        const newUploadFiles: UploadFile[] = validFiles.map(file => ({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: 'pending',
          progress: 0
        }))

        setUploadFiles(prev => multiple ? [...prev, ...newUploadFiles] : newUploadFiles)
        onFileSelect?.(validFiles)
      }
    }, [maxSize, multiple, onError, onFileSelect])

    /**
     * 处理拖拽事件
     */
    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragOver(true)
      }
    }, [disabled])

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    }, [])

    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files)
      }
    }, [disabled, handleFileSelect])

    /**
     * 处理点击上传
     */
    const handleClick = React.useCallback(() => {
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }, [disabled])

    /**
     * 处理文件输入变化
     */
    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files)
      // 清空input值，允许重复选择同一文件
      e.target.value = ''
    }, [handleFileSelect])

    /**
     * 移除文件
     */
    const removeFile = React.useCallback((fileId: string) => {
      setUploadFiles(prev => prev.filter(f => f.id !== fileId))
    }, [])

    /**
     * 清空所有文件
     */
    const clearFiles = React.useCallback(() => {
      setUploadFiles([])
    }, [])

    /**
     * 更新文件状态
     */
    const updateFileStatus = React.useCallback((fileId: string, status: UploadFile['status'], progress?: number, error?: string) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status, progress: progress ?? f.progress, error: error ?? f.error } as UploadFile
          : f
      ))
    }, [])

    /**
     * 获取文件图标
     */
    const getFileIcon = React.useCallback(() => {
      return <FileText className="h-8 w-8 text-blue-500" />
    }, [])

    /**
     * 获取状态图标
     */
    const getStatusIcon = React.useCallback((status: UploadFile['status']) => {
      switch (status) {
        case 'completed':
          return <CheckCircle2 className="h-4 w-4 text-green-500" />
        case 'error':
          return <AlertCircle className="h-4 w-4 text-red-500" />
        case 'uploading':
        case 'processing':
          return (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          )
        default:
          return null
      }
    }, [])

    // 暴露方法给父组件
    React.useImperativeHandle(ref, () => ({
      clearFiles,
      updateFileStatus,
      files: uploadFiles
    }), [clearFiles, updateFileStatus, uploadFiles])

    return (
      <div className={cn('w-full', className)} {...props}>
        {/* 拖拽上传区域 */}
        <div
          className={cn(
            'relative cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors sm:p-8',
            isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <Upload className={cn(
              'h-12 w-12',
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            )} />
            
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 sm:text-lg">
                {isDragOver ? '释放文件以上传' : '拖拽文件到此处或点击选择'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                支持 EPUB、TXT 格式，最大 {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {uploadFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                已选择文件 ({uploadFiles.length})
              </h3>
              {uploadFiles.length > 1 && (
                <button
                  onClick={clearFiles}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  清空全部
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {uploadFiles.map((uploadFile) => {
                const fileInfo = getFileInfo(uploadFile.file)
                
                return (
                  <div
                    key={uploadFile.id}
                    className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800 sm:flex-row sm:items-start"
                  >
                    {/* 文件图标 */}
                    <div className="flex flex-shrink-0 items-center">
                      {getFileIcon()}
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="break-all text-sm font-medium text-gray-900 dark:text-gray-100">
                          {uploadFile.file.name}
                        </p>
                        <div className="flex-shrink-0">
                          {getStatusIcon(uploadFile.status)}
                        </div>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {fileInfo.sizeFormatted} • {fileInfo.format.toUpperCase()}
                        </p>
                        
                        {uploadFile.status === 'uploading' && (
                          <div className="w-full sm:max-w-xs">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {uploadFile.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {uploadFile.error}
                        </p>
                      )}
                    </div>
                    
                    {/* 移除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(uploadFile.id)
                      }}
                      className="self-end rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 sm:self-start"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export default FileUpload
