/**
 * 书籍管理服务
 * 提供书籍的完整生命周期管理，包括导入、存储、查询、更新等功能
 */

import { storageService } from '../storage'
import { createParser, isFileSupported, getFileInfo } from '../parsers'
import type {
  Book,
  Chapter,
  ReadingProgress,
  BookServiceInterface,
  ParseProgress
} from '../../types'
import { BookFormat, BookStatus } from '../../types'

export class BookService implements BookServiceInterface {
  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    await storageService.init()
  }

  /**
   * 导入书籍文件
   * @param file 书籍文件
   * @param onProgress 进度回调
   * @returns 导入的书籍信息
   */
  async importBook(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<Book> {
    try {
      // 验证文件
      this.validateFile(file)
      
      // 检查是否已存在相同文件
      const existingBook = await this.findBookByFileName(file.name)
      if (existingBook) {
        throw new Error(`书籍 "${file.name}" 已存在`)
      }

      // 解析文件
      const parser = createParser(file)
      const { book: parsedBook, chapters: parsedChapters } = await parser.parse(file, onProgress)

      // 为书籍添加缺失的属性
      const bookId = crypto.randomUUID()
      const now = new Date()
      const completeBook: Book = {
        ...parsedBook,
        id: bookId,
        addedAt: now,
        updatedAt: now
      }

      // 为章节添加缺失的属性
      const completeChapters: Chapter[] = parsedChapters.map((chapter) => ({
        ...chapter,
        id: crypto.randomUUID(),
        bookId: bookId
      }))

      // 保存到数据库
      await this.saveBookWithChapters(completeBook, completeChapters)

      return completeBook
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      throw new Error(`导入书籍失败: ${errorMessage}`)
    }
  }

  /**
   * 获取所有书籍
   * @returns 书籍列表
   */
  async getAllBooks(): Promise<Book[]> {
    try {
      return await storageService.getAll<Book>('books')
    } catch (error) {
      throw new Error('获取书籍列表失败')
    }
  }

  /**
   * 根据ID获取书籍
   * @param bookId 书籍ID
   * @returns 书籍信息
   */
  async getBookById(bookId: string): Promise<Book | null> {
    try {
      return await storageService.get<Book>('books', bookId)
    } catch (error) {
      throw new Error('获取书籍信息失败')
    }
  }

  /**
   * 获取书籍章节
   * @param bookId 书籍ID
   * @returns 章节列表
   */
  async getBookChapters(bookId: string): Promise<Chapter[]> {
    try {
      const chapters = await storageService.getByIndex<Chapter>('chapters', 'by-book-id', bookId)
      return chapters.sort((a, b) => a.order - b.order)
    } catch (error) {
      throw new Error('获取章节列表失败')
    }
  }

  /**
   * 获取指定章节
   * @param chapterId 章节ID
   * @returns 章节信息
   */
  async getChapterById(chapterId: string): Promise<Chapter | null> {
    try {
      return await storageService.get<Chapter>('chapters', chapterId)
    } catch (error) {
      throw new Error('获取章节信息失败')
    }
  }

  /**
   * 更新书籍信息
   * @param bookId 书籍ID
   * @param updates 更新数据
   */
  async updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
    try {
      await storageService.update<Book>('books', bookId, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      throw new Error('更新书籍信息失败')
    }
  }

  /**
   * 删除书籍
   * @param bookId 书籍ID
   */
  async deleteBook(bookId: string): Promise<void> {
    try {
      // 删除相关章节
      const chapters = await this.getBookChapters(bookId)
      const deleteChapterOps = chapters.map(chapter => ({
        type: 'delete' as const,
        storeName: 'chapters',
        id: chapter.id
      }))

      // 删除阅读进度
      const deleteProgressOp = {
        type: 'delete' as const,
        storeName: 'progress',
        id: bookId
      }

      // 删除书籍
      const deleteBookOp = {
        type: 'delete' as const,
        storeName: 'books',
        id: bookId
      }

      // 批量删除
      await storageService.batch([
        ...deleteChapterOps,
        deleteProgressOp,
        deleteBookOp
      ])
    } catch (error) {
      throw new Error('删除书籍失败')
    }
  }

  /**
   * 获取阅读进度
   * @param bookId 书籍ID
   * @returns 阅读进度
   */
  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    try {
      return await storageService.get<ReadingProgress>('progress', bookId)
    } catch (error) {
      throw new Error('获取阅读进度失败')
    }
  }

  /**
   * 更新阅读进度
   * @param progress 阅读进度
   */
  async updateReadingProgress(progress: Partial<ReadingProgress> & { bookId: string }): Promise<void> {
    try {
      const existing = await this.getReadingProgress(progress.bookId)
      
      const updatedProgress: ReadingProgress = {
        bookId: progress.bookId,
        currentLocationIndex: progress.currentLocationIndex ?? existing?.currentLocationIndex ?? 0,
        currentLocation: progress.currentLocation ?? existing?.currentLocation ?? '',
        progress: progress.progress ?? existing?.progress ?? 0,
        totalLocations: progress.totalLocations ?? existing?.totalLocations ?? 0,
        readingTime: progress.readingTime ?? existing?.readingTime ?? 0,
        lastReadAt: new Date()
      }

      if (existing) {
        await storageService.update<ReadingProgress>('progress', progress.bookId, updatedProgress)
      } else {
        await storageService.save('progress', updatedProgress)
      }

      // 更新书籍状态
      if (updatedProgress.progress > 0) {
        const status: BookStatus = updatedProgress.progress >= 100 ? BookStatus.COMPLETED : BookStatus.READING
        await this.updateBook(progress.bookId, { status })
      }
    } catch (error) {
      throw new Error('更新阅读进度失败')
    }
  }

  /**
   * 搜索书籍
   * @param query 搜索关键词
   * @returns 匹配的书籍列表
   */
  async searchBooks(query: string): Promise<Book[]> {
    try {
      const allBooks = await this.getAllBooks()
      const lowercaseQuery = query.toLowerCase()
      
      return allBooks.filter(book => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery) ||
        (book.description && book.description.toLowerCase().includes(lowercaseQuery))
      )
    } catch (error) {
      throw new Error('搜索书籍失败')
    }
  }

  /**
   * 按格式筛选书籍
   * @param format 书籍格式
   * @returns 指定格式的书籍列表
   */
  async getBooksByFormat(format: BookFormat): Promise<Book[]> {
    try {
      return await storageService.getByIndex<Book>('books', 'by-format', format)
    } catch (error) {
      throw new Error('按格式获取书籍失败')
    }
  }

  /**
   * 按状态筛选书籍
   * @param status 书籍状态
   * @returns 指定状态的书籍列表
   */
  async getBooksByStatus(status: BookStatus): Promise<Book[]> {
    try {
      return await storageService.getByIndex<Book>('books', 'by-status', status)
    } catch (error) {
      throw new Error('按状态获取书籍失败')
    }
  }

  /**
   * 获取最近添加的书籍
   * @param limit 数量限制
   * @returns 最近添加的书籍列表
   */
  async getRecentBooks(limit: number = 10): Promise<Book[]> {
    try {
      const allBooks = await this.getAllBooks()
      return allBooks
        .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
        .slice(0, limit)
    } catch (error) {
      throw new Error('获取最近书籍失败')
    }
  }

  /**
   * 保存书籍和章节
   * @param book 书籍信息
   * @param chapters 章节列表
   * @returns 书籍ID
   */
  async saveBook(book: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>, chapters: Omit<Chapter, 'id' | 'bookId'>[]): Promise<string> {
    try {
      const now = new Date()
      const bookWithMeta: Book = {
        ...book,
        id: crypto.randomUUID(),
        addedAt: now,
        updatedAt: now
      }

      const chaptersWithMeta: Chapter[] = chapters.map((chapter, index) => ({
        ...chapter,
        id: crypto.randomUUID(),
        bookId: bookWithMeta.id,
        order: index + 1
      }))

      await this.saveBookWithChapters(bookWithMeta, chaptersWithMeta)
      return bookWithMeta.id
    } catch (error) {
      throw new Error('保存书籍失败')
    }
  }

  /**
   * 获取正在阅读的书籍
   * @returns 正在阅读的书籍列表
   */
  async getCurrentlyReading(): Promise<Book[]> {
    try {
      return await this.getBooksByStatus(BookStatus.READING)
    } catch (error) {
      throw new Error('获取正在阅读的书籍失败')
    }
  }

  /**
   * 获取统计信息
   * @returns 书籍统计信息
   */
  async getStatistics(): Promise<{
    totalBooks: number
    totalChapters: number
    readingBooks: number
    completedBooks: number
    unreadBooks: number
    formatStats: Record<BookFormat, number>
  }> {
    try {
      const [allBooks, storageInfo] = await Promise.all([
        this.getAllBooks(),
        storageService.getStorageInfo()
      ])

      const formatStats: Record<BookFormat, number> = {
        [BookFormat.EPUB]: 0,
        [BookFormat.PDF]: 0,
        [BookFormat.TXT]: 0
      }

      const statusStats = {
        [BookStatus.READING]: 0,
        [BookStatus.COMPLETED]: 0,
        [BookStatus.UNREAD]: 0
      }

      allBooks.forEach(book => {
        formatStats[book.format]++
        statusStats[book.status]++
      })

      return {
        totalBooks: storageInfo.booksCount,
        totalChapters: storageInfo.chaptersCount,
        readingBooks: statusStats[BookStatus.READING],
        completedBooks: statusStats[BookStatus.COMPLETED],
        unreadBooks: statusStats[BookStatus.UNREAD],
        formatStats
      }
    } catch (error) {
      throw new Error('获取统计信息失败')
    }
  }

  /**
   * 验证文件
   * @param file 文件对象
   */
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('文件不能为空')
    }

    if (!isFileSupported(file)) {
      throw new Error('不支持的文件格式')
    }

    const fileInfo = getFileInfo(file)
    if (!fileInfo.isSizeValid) {
      throw new Error('文件大小超出限制（最大50MB）')
    }
  }

  /**
   * 根据文件名查找书籍
   * @param fileName 文件名
   * @returns 书籍信息或null
   */
  private async findBookByFileName(fileName: string): Promise<Book | null> {
    try {
      const allBooks = await this.getAllBooks()
      return allBooks.find(book => book.filePath === fileName) || null
    } catch {
      return null
    }
  }

  /**
   * 保存书籍和章节
   * @param book 书籍信息
   * @param chapters 章节列表
   */
  private async saveBookWithChapters(book: Book, chapters: Chapter[]): Promise<void> {
    try {
      // 准备批量操作
      const operations = [
        {
          type: 'put' as const,
          storeName: 'books',
          data: book
        },
        ...chapters.map(chapter => ({
          type: 'put' as const,
          storeName: 'chapters',
          data: chapter
        }))
      ]

      // 批量保存
      await storageService.batch(operations)
    } catch (error) {
      throw new Error('保存书籍数据失败')
    }
  }
}

// 导出单例实例
export const bookService = new BookService()