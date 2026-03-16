/**
 * 阅读器页面组件
 * 核心阅读界面，支持EPUB、PDF、TXT格式的书籍阅读
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Book, Chapter } from '../types'
import { bookService } from '../lib/services'
import { useSettings, useTextSelection } from '../hooks'
import { useNotes } from '../hooks/useNotes'
import AIModal from '../components/ui/ai-modal'
import TextSelectionPopup from '../components/ui/text-selection-popup'
import NoteSidebar from '../components/notes/NoteSidebar'
import { NoteHighlightContainer } from '../components/notes/NoteHighlight'

/**
 * 阅读器页面组件
 * @returns 阅读器页面JSX元素
 */
function ReaderPage(): JSX.Element {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const { settings } = useSettings()
  
  // 文本选择功能
  const { selection, clearSelection } = useTextSelection()
  
  // 笔记功能
  const { setActiveNote, restoreAllHighlights } = useNotes()
  
  // AI模态框状态
  const [showAIModal, setShowAIModal] = useState(false)
  
  // 笔记侧栏状态
  const [showNoteSidebar, setShowNoteSidebar] = useState(false)
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 计算当前章节
  const currentChapter = chapters[currentChapterIndex]

  // 加载书籍和章节数据
  useEffect(() => {
    const loadBookData = async () => {
      if (!bookId) {
        setError('书籍ID无效')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const bookData = await bookService.getBookById(bookId)
        if (!bookData) {
          setError('书籍不存在')
          return
        }
        
        setBook(bookData)
        const chaptersData = await bookService.getBookChapters(bookId)
        setChapters(chaptersData)
        
        // 获取阅读进度
        const progress = await bookService.getReadingProgress(bookId)
        if (progress && progress.currentLocationIndex < chaptersData.length) {
          setCurrentChapterIndex(progress.currentLocationIndex)
        }
      } catch (err) {
        console.error('加载书籍失败:', err)
        setError('加载书籍失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    loadBookData()
  }, [bookId])

  // 恢复笔记高亮
  useEffect(() => {
    if (book && currentChapter) {
      // 延迟恢复高亮，确保DOM已渲染
      const timer = setTimeout(() => {
        void restoreAllHighlights()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [book, currentChapter, restoreAllHighlights])

  // 处理笔记高亮点击
  const handleNoteClick = (noteIds: string[]) => {
    if (noteIds.length > 0) {
      setActiveNote(noteIds[0])
      setShowNoteSidebar(true)
    }
  }

  // 关闭笔记侧栏
  const handleCloseSidebar = () => {
    setShowNoteSidebar(false)
    setActiveNote(null)
  }

  // 更新阅读进度
  const updateProgress = async (chapterIndex: number) => {
    if (!bookId || !book) return
    
    try {
      await bookService.updateReadingProgress({
        bookId,
        currentLocationIndex: chapterIndex,
        currentLocation: chapterIndex.toString(),
        progress: Math.round((chapterIndex / chapters.length) * 100),
        totalLocations: chapters.length,
        lastReadAt: new Date(),
        readingTime: 0
      })
    } catch (err) {
      console.error('更新进度失败:', err)
    }
  }

  // 切换章节
  const goToChapter = (index: number) => {
    if (index >= 0 && index < chapters.length) {
      setCurrentChapterIndex(index)
      updateProgress(index)
    }
  }

  // 返回书架
  const goBack = () => {
    navigate('/bookshelf')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">加载失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            返回书架
          </button>
        </div>
      </div>
    )
  }

  if (!book || chapters.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">暂无内容</h2>
          <p className="text-gray-600 mb-6">该书籍暂无可阅读的章节</p>
          <button
            onClick={goBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            返回书架
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      settings.reading.theme === 'dark' ? 'bg-gray-900' :
      settings.reading.theme === 'sepia' ? 'bg-amber-50' :
      'bg-white'
    }`}>
      {/* 顶部导航栏 */}
      <div className={`sticky top-0 z-50 border-b px-4 py-3 ${
        settings.reading.theme === 'dark' ? 'bg-gray-800 border-gray-700' :
        settings.reading.theme === 'sepia' ? 'bg-amber-100 border-amber-200' :
        'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="返回书架"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-lg font-medium truncate max-w-xs ${
                settings.reading.theme === 'dark' ? 'text-gray-100' :
                settings.reading.theme === 'sepia' ? 'text-amber-900' :
                'text-gray-900'
              }`}>{book.title}</h1>
              <p className={`text-sm ${
                settings.reading.theme === 'dark' ? 'text-gray-400' :
                settings.reading.theme === 'sepia' ? 'text-amber-700' :
                'text-gray-500'
              }`}>{book.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {currentChapterIndex + 1} / {chapters.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex max-w-6xl mx-auto">
        {/* 章节目录 */}
        <div className={`w-80 border-r h-screen sticky top-16 overflow-y-auto ${
          settings.reading.theme === 'dark' ? 'bg-gray-800 border-gray-700' :
          settings.reading.theme === 'sepia' ? 'bg-amber-100 border-amber-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="p-4">
            <h3 className={`text-lg font-medium mb-4 ${
              settings.reading.theme === 'dark' ? 'text-gray-100' :
              settings.reading.theme === 'sepia' ? 'text-amber-900' :
              'text-gray-900'
            }`}>目录</h3>
            <div className="space-y-1">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    index === currentChapterIndex
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="truncate">{chapter.title}</div>
                  {chapter.wordCount && (
                    <div className="text-xs opacity-75 mt-1">
                      {chapter.wordCount.toLocaleString()} 字
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 阅读内容区域 */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* 章节标题 */}
            <div className="mb-8">
              <h2 className="text-3xl font-light text-gray-900 mb-4">{currentChapter.title}</h2>
              <div className="w-16 h-0.5 bg-gray-300"></div>
            </div>

            {/* 章节内容 */}
            <div className="prose prose-lg max-w-none">
              <NoteHighlightContainer
                documentId={`${bookId}-${currentChapterIndex}`}
                onNoteClick={handleNoteClick}
              >
                <div 
                  data-text-content
                  className={`leading-relaxed whitespace-pre-wrap ${
                    settings.reading.theme === 'dark' ? 'text-gray-100' :
                    settings.reading.theme === 'sepia' ? 'text-amber-900' :
                    'text-gray-800'
                  }`}
                  style={{ 
                    fontFamily: settings.reading.fontFamily,
                    fontSize: `${settings.reading.fontSize}px`,
                    lineHeight: '2',
                    backgroundColor: settings.reading.theme === 'dark' ? '#1f2937' :
                                   settings.reading.theme === 'sepia' ? '#fef3c7' :
                                   'transparent'
                  }}
                >
                  {currentChapter.content}
                </div>
              </NoteHighlightContainer>
            </div>

            {/* 章节导航 */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={() => goToChapter(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一章
              </button>
              <span className="text-sm text-gray-500">
                第 {currentChapterIndex + 1} 章 / 共 {chapters.length} 章
              </span>
              <button
                onClick={() => goToChapter(currentChapterIndex + 1)}
                disabled={currentChapterIndex === chapters.length - 1}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一章
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 文本选择浮动按钮 */}
      <TextSelectionPopup
        selection={selection}
        onAIAnalyze={() => setShowAIModal(true)}
        onClose={clearSelection}
      />

      {/* AI模态框 */}
      <AIModal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false)
          clearSelection()
        }}
        selection={selection}
        bookTitle={book?.title}
      />

      {/* 笔记侧栏 */}
      <NoteSidebar
        isVisible={showNoteSidebar}
        onClose={handleCloseSidebar}
      />
    </div>

  )
}

export default ReaderPage
