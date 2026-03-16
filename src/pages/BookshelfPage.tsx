/**
 * 书架页面组件
 * 显示用户的书籍库，支持添加、删除、搜索书籍
 */

import { useState, useEffect } from 'react'
import { Book } from '../types'
import { bookService } from '../lib/services'
import { FileUploadModal } from '../components/ui'
import { formatFileSize, formatDate } from '../lib/utils'

/**
 * 书架页面组件
 * @returns 书架页面JSX元素
 */
function BookshelfPage(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'epub' | 'txt'>('all')

  // 加载书籍列表
  const loadBooks = async () => {
    try {
      setLoading(true)
      const allBooks = await bookService.getAllBooks()
      setBooks(allBooks)
    } catch (error) {
      console.error('加载书籍失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载书籍
  useEffect(() => {
    loadBooks()
  }, [])

  // 处理文件上传完成
  const handleUploadComplete = () => {
    loadBooks() // 重新加载书籍列表
    setShowUploadModal(false)
  }

  // 删除书籍
  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('确定要删除这本书吗？此操作不可恢复。')) {
      try {
        await bookService.deleteBook(bookId)
        await loadBooks()
      } catch (error) {
        console.error('删除书籍失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  // 过滤书籍
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFormat = selectedFormat === 'all' || book.format === selectedFormat
    return matchesSearch && matchesFormat
  })

  // 渲染书籍卡片
  const renderBookCard = (book: Book) => (
    <div key={book.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{book.author}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:gap-4">
            <span className="px-2 py-1 bg-gray-100 rounded-full">{book.format.toUpperCase()}</span>
            <span>{formatFileSize(book.fileSize)}</span>
            <span>{formatDate(book.addedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => handleDeleteBook(book.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="删除书籍"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {book.description && (
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{book.description}</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          {book.totalPages || 0} 页
        </div>
        <button 
          onClick={() => window.location.href = `/reader/${book.id}`}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 sm:w-auto"
        >
          开始阅读
        </button>
      </div>
    </div>
  )
  return (
    <div className="relative min-h-full bg-white overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-60 animate-float"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-100 to-yellow-100 rounded-full opacity-50 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-40 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* 页面标题 */}
          <div className="mb-8 text-center sm:mb-10 lg:mb-12">
            <h1 className="mb-4 animate-fade-in text-[clamp(2.25rem,6vw,3.75rem)] font-light tracking-tight text-gray-900">
              我的书架
            </h1>
            <div className="w-24 h-0.5 bg-gray-300 mx-auto mb-6"></div>
            <p className="px-4 text-sm font-light text-gray-600 sm:text-base lg:text-lg" style={{fontFamily: 'SimSun, serif'}}>管理您的电子书籍收藏</p>
          </div>

          {/* 搜索和筛选栏 */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full flex-1 lg:max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索书名或作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as 'all' | 'epub' | 'txt')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 sm:w-auto"
              >
                <option value="all">所有格式</option>
                <option value="epub">EPUB</option>
                <option value="txt">TXT</option>
              </select>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-white transition-colors hover:bg-gray-800 sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加书籍
              </button>
            </div>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          )}

          {/* 书籍列表 */}
          {!loading && filteredBooks.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBooks.map(renderBookCard)}
            </div>
          )}

          {/* 空状态 */}
          {!loading && filteredBooks.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-50 rounded-full mb-6">
                  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">
                {books.length === 0 ? '暂无书籍' : '未找到匹配的书籍'}
              </h3>
              <p className="text-gray-500 mb-10 text-lg font-light">
                {books.length === 0 ? '开始添加您的第一本电子书' : '尝试调整搜索条件或筛选器'}
              </p>
              {books.length === 0 && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="group relative px-8 py-3 bg-gray-900 text-white rounded-full font-light text-lg transition-all duration-300 hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  <span className="relative z-10">添加书籍</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              )}
            </div>
          )}

          {/* 统计信息 */}
          {!loading && books.length > 0 && (
            <div className="text-center mt-16 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                共 {books.length} 本书籍 · 显示 {filteredBooks.length} 本
              </p>
            </div>
          )}

          {/* 文件上传模态框 */}
          {showUploadModal && (
            <FileUploadModal
              open={showUploadModal}
              onOpenChange={setShowUploadModal}
              onSuccess={handleUploadComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default BookshelfPage
