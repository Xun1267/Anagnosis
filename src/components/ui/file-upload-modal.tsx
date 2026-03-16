/**
 * 文件上传模态框组件
 * 提供完整的文件上传、解析和导入流程
 */

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Upload, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { FileUpload } from './file-upload'
import type { FileUploadRef } from './file-upload'
import { bookService } from '../../lib/services'
import type { Book, ParseProgress } from '../../types'

export interface FileUploadModalProps {
  /** 是否打开模态框 */
  open: boolean
  /** 关闭模态框回调 */
  onOpenChange: (open: boolean) => void
  /** 上传成功回调 */
  onSuccess?: (books: Book[]) => void
  /** 错误回调 */
  onError?: (error: string) => void
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  currentFile?: string
  message?: string
  uploadedBooks: Book[]
  errors: string[]
}

/**
 * 文件上传模态框组件
 */
export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  onError
}) => {
  const [uploadState, setUploadState] = React.useState<UploadState>({
    status: 'idle',
    progress: 0,
    uploadedBooks: [],
    errors: []
  })
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const fileUploadRef = React.useRef<FileUploadRef>(null)

  /**
   * 重置状态
   */
  const resetState = React.useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: 0,
      uploadedBooks: [],
      errors: []
    })
    setSelectedFiles([])
    fileUploadRef.current?.clearFiles()
  }, [])

  /**
   * 处理文件选择
   */
  const handleFileSelect = React.useCallback((files: File[]) => {
    setSelectedFiles(files)
    setUploadState(prev => ({
      ...prev,
      status: 'idle',
      errors: []
    }))
  }, [])

  /**
   * 处理文件上传
   */
  const handleUpload = React.useCallback(async () => {
    if (selectedFiles.length === 0) return

    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      progress: 0,
      uploadedBooks: [],
      errors: []
    }))

    const uploadedBooks: Book[] = []
    const errors: string[] = []
    const totalFiles = selectedFiles.length

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        setUploadState(prev => ({
          ...prev,
          currentFile: file.name,
          progress: (i / totalFiles) * 100
        }))

        // 更新文件状态为上传中
        fileUploadRef.current?.updateFileStatus(
          `${file.name}-${Date.now()}`,
          'uploading',
          0
        )

        try {
          // 导入书籍
          const book = await bookService.importBook(file, (progress: ParseProgress) => {
            const fileProgress = (i / totalFiles) * 100 + (progress.percentage / totalFiles)
            setUploadState(prev => ({
              ...prev,
              progress: fileProgress,
              message: progress.message
            }))

            // 更新文件进度
            fileUploadRef.current?.updateFileStatus(
              `${file.name}-${Date.now()}`,
              'uploading',
              progress.percentage
            )
          })

          uploadedBooks.push(book)
          
          // 更新文件状态为成功
          fileUploadRef.current?.updateFileStatus(
            `${file.name}-${Date.now()}`,
            'completed',
            100
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          errors.push(`${file.name}: ${errorMessage}`)
          
          // 更新文件状态为错误
          fileUploadRef.current?.updateFileStatus(
            `${file.name}-${Date.now()}`,
            'error',
            0,
            errorMessage
          )
        }
      }

      // 完成上传
      setUploadState({
        status: errors.length === 0 ? 'success' : 'error',
        progress: 100,
        uploadedBooks,
        errors,
        message: errors.length === 0 
          ? `成功导入 ${uploadedBooks.length} 本书籍`
          : `导入完成，${uploadedBooks.length} 本成功，${errors.length} 本失败`
      })

      // 调用成功回调
      if (uploadedBooks.length > 0) {
        onSuccess?.(uploadedBooks)
      }

      // 调用错误回调
      if (errors.length > 0) {
        onError?.(errors.join('\n'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传过程中发生未知错误'
      setUploadState({
        status: 'error',
        progress: 0,
        uploadedBooks: [],
        errors: [errorMessage],
        message: errorMessage
      })
      onError?.(errorMessage)
    }
  }, [selectedFiles, onSuccess, onError])

  /**
   * 处理模态框关闭
   */
  const handleClose = React.useCallback(() => {
    if (uploadState.status !== 'uploading') {
      onOpenChange(false)
      // 延迟重置状态，避免关闭动画时看到状态变化
      setTimeout(resetState, 300)
    }
  }, [uploadState.status, onOpenChange, resetState])

  /**
   * 处理继续添加文件
   */
  const handleContinue = React.useCallback(() => {
    resetState()
  }, [resetState])

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          {/* 标题栏 */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              导入书籍
            </Dialog.Title>
            <Dialog.Close
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              disabled={uploadState.status === 'uploading'}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </Dialog.Close>
          </div>

          {/* 内容区域 */}
          <div className="space-y-6">
            {/* 上传状态显示 */}
            {uploadState.status !== 'idle' && (
              <div className="space-y-4">
                {/* 状态指示器 */}
                <div className="flex items-center space-x-3">
                  {uploadState.status === 'uploading' && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  )}
                  {uploadState.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {uploadState.status === 'error' && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {uploadState.status === 'uploading' && '正在导入书籍...'}
                      {uploadState.status === 'success' && '导入完成'}
                      {uploadState.status === 'error' && '导入失败'}
                    </p>
                    {uploadState.message && (
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadState.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                {uploadState.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{uploadState.currentFile}</span>
                      <span>{Math.round(uploadState.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 成功结果 */}
                {uploadState.status === 'success' && uploadState.uploadedBooks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400">
                      成功导入 {uploadState.uploadedBooks.length} 本书籍：
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {uploadState.uploadedBooks.map((book) => (
                        <div key={book.id} className="flex items-center space-x-2 text-sm">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{book.title}</span>
                          <span className="text-gray-500">by {book.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 错误信息 */}
                {uploadState.errors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400">
                      导入失败的文件：
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {uploadState.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 文件上传组件 */}
            {uploadState.status === 'idle' && (
              <FileUpload
                ref={fileUploadRef}
                multiple
                onFileSelect={handleFileSelect}
                {...(onError && { onError })}
                className="min-h-[200px]"
              />
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            {uploadState.status === 'idle' && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0}
                  className={cn(
                    'px-4 py-2 text-sm font-medium text-white rounded-md transition-colors',
                    selectedFiles.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  )}
                >
                  <Upload className="h-4 w-4 mr-2 inline" />
                  开始导入 ({selectedFiles.length})
                </button>
              </>
            )}
            
            {uploadState.status === 'uploading' && (
              <button
                disabled
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-md cursor-not-allowed"
              >
                导入中...
              </button>
            )}
            
            {(uploadState.status === 'success' || uploadState.status === 'error') && (
              <>
                <button
                  onClick={handleContinue}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  继续添加
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  完成
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default FileUploadModal