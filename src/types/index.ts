/**
 * 全局类型定义文件
 * 定义应用中使用的核心数据类型
 */

/**
 * 章节数据接口
 */
export interface Chapter {
  id: string
  bookId: string
  title: string
  content: string
  order: number
  wordCount: number
  href?: string // EPUB章节链接
  startLocation: string // 章节开始位置
  endLocation: string // 章节结束位置
}

/**
 * 文件解析进度回调接口
 */
export interface ParseProgress {
  stage: 'reading' | 'parsing' | 'extracting' | 'saving'
  progress: number // 0-100
  percentage: number // 0-100
  message: string
  isComplete: boolean
  hasError: boolean
}

/**
 * 文件解析器接口
 */
export interface FileParser {
  /**
   * 解析文件
   * @param file 要解析的文件
   * @param onProgress 进度回调
   * @returns 解析后的书籍数据和章节列表
   */
  parse(file: File, onProgress?: (progress: ParseProgress) => void): Promise<{
    book: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>
    chapters: Omit<Chapter, 'id' | 'bookId'>[]
  }>

  /**
   * 验证文件格式
   * @param file 要验证的文件
   * @returns 是否支持该文件格式
   */
  canParse(file: File): boolean
}

/**
 * AI分析缓存接口
 */
export interface AIAnalysisCache {
  id: string
  textHash: string // 文本内容的哈希值
  analysisType: string
  userLevel: string
  response: AIAnalysisResponse
  createdAt: Date
  expiresAt: Date
}

/**
 * 存储服务错误类型
 */
export interface StorageError extends Error {
  code: 'DB_ERROR' | 'NOT_FOUND' | 'QUOTA_EXCEEDED' | 'TRANSACTION_ERROR'
  details?: any
}

/**
 * 书籍格式枚举
 */
export enum BookFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  TXT = 'txt'
}

/**
 * 书籍状态枚举
 */
export enum BookStatus {
  UNREAD = 'unread',
  READING = 'reading',
  COMPLETED = 'completed'
}

/**
 * 书籍数据接口
 */
export interface Book {
  id: string
  title: string
  author: string
  format: BookFormat
  fileSize: number
  filePath: string
  coverUrl?: string
  description?: string
  language: string
  publishDate?: string
  publisher?: string
  isbn?: string
  status: BookStatus
  progress: number // 0-100
  totalPages?: number
  currentPage?: number
  wordCount?: number
  lastReadAt?: Date
  addedAt: Date
  updatedAt: Date
}

/**
 * 阅读进度接口
 */
export interface ReadingProgress {
  bookId: string
  currentLocation: string // EPUB: CFI, PDF: page number, TXT: character position
  progress: number // 0-100
  totalLocations: number
  currentLocationIndex: number
  lastReadAt: Date
  readingTime: number // 总阅读时间(秒)
  sessionStartTime?: Date
}

/**
 * AI解析请求接口
 */
export interface AIAnalysisRequest {
  text: string
  context: string
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph'
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  customPrompt?: string
}

/**
 * AI解析响应接口
 */
export interface AIAnalysisResponse {
  id: string
  originalText: string
  analysis: {
    translation: string
    explanation: string
    pronunciation?: string
    partOfSpeech?: string
    examples: string[]
    synonyms?: string[]
    etymology?: string
    difficulty: 'easy' | 'medium' | 'hard'
  }
  context: string
  timestamp: Date
}

/**
 * 用户设置接口
 */
export interface UserSettings {
  // 阅读设置
  reading: {
    fontSize: number // 12-24
    fontFamily: string
    lineHeight: number // 1.2-2.0
    theme: 'light' | 'dark' | 'sepia'
    backgroundColor: string
    textColor: string
    pageWidth: number // 600-1200px
    autoSave: boolean
    autoBookmark: boolean
  }
  
  // AI设置
  ai: {
    enabled: boolean
    userLevel: 'beginner' | 'intermediate' | 'advanced'
    autoAnalysis: boolean
    customPrompts: Record<string, string>
    analysisLanguage: 'zh' | 'en'
  }
  
  // 界面设置
  ui: {
    language: 'zh' | 'en'
    sidebarCollapsed: boolean
    showProgress: boolean
    showWordCount: boolean
    animations: boolean
  }
}

/**
 * 文件上传接口
 */
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  bookId: string
  bookTitle: string
  matches: {
    text: string
    location: string
    context: string
  }[]
}

/**
 * 书签接口
 */
export interface Bookmark {
  id: string
  bookId: string
  location: string
  text: string
  note?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 笔记接口
 */
export interface Note {
  id: string
  bookId: string
  location: string
  selectedText: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 错误类型
 */
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

/**
 * 文本选择接口
 */
export interface TextSelection {
  text: string
  range: Range
  boundingRect: DOMRect
  context: string // 选择文本的上下文
}

/**
 * AI模态框状态接口
 */
export interface AIModalState {
  isOpen: boolean
  selectedText: string
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph'
  isLoading: boolean
  result?: AIAnalysisResponse
  error?: string
  history: AIAnalysisResponse[]
}

/**
 * 书籍服务接口
 */
export interface BookServiceInterface {
  /**
   * 保存书籍和章节
   */
  saveBook(book: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>, chapters: Omit<Chapter, 'id' | 'bookId'>[]): Promise<string>
  
  /**
   * 获取所有书籍
   */
  getAllBooks(): Promise<Book[]>
  
  /**
   * 根据ID获取书籍
   */
  getBookById(id: string): Promise<Book | null>
  
  /**
   * 获取书籍章节
   */
  getBookChapters(bookId: string): Promise<Chapter[]>
  
  /**
   * 删除书籍
   */
  deleteBook(id: string): Promise<void>
  
  /**
   * 获取阅读进度
   */
  getReadingProgress(bookId: string): Promise<ReadingProgress | null>
  
  /**
   * 更新阅读进度
   */
  updateReadingProgress(progress: Partial<ReadingProgress> & { bookId: string }): Promise<void>
}

/**
 * AI服务接口
 */
export interface AIServiceInterface {
  /**
   * 初始化AI服务
   */
  initialize(): Promise<void>
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean
  
  /**
   * 分析文本
   */
  analyzeText(request: AIAnalysisRequest): Promise<AIAnalysisResponse>
  
  /**
   * 获取缓存的分析结果
   */
  getCachedAnalysis(textHash: string, analysisType: string, userLevel: string): Promise<AIAnalysisResponse | null>
  
  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): Promise<void>
}

/**
 * 存储服务接口
 */
export interface StorageServiceInterface {
  /**
   * 初始化数据库
   */
  init(): Promise<void>
  
  /**
   * 保存数据
   */
  save<T>(storeName: string, data: T): Promise<string>
  
  /**
   * 获取数据
   */
  get<T>(storeName: string, id: string): Promise<T | null>
  
  /**
   * 获取所有数据
   */
  getAll<T>(storeName: string): Promise<T[]>
  
  /**
   * 更新数据
   */
  update<T>(storeName: string, id: string, data: Partial<T>): Promise<void>
  
  /**
   * 删除数据
   */
  delete(storeName: string, id: string): Promise<void>
  
  /**
   * 清空存储
   */
  clear(storeName: string): Promise<void>
}