/**
 * EPUB文件解析器
 * 使用epubjs库解析EPUB文件，提取书籍信息和章节内容
 */

import ePub from 'epubjs'
import type { Book, Chapter, FileParser, ParseProgress, BookFormat } from '../../types'
import { BookStatus } from '../../types'

export class EPUBParser implements FileParser {
  private onProgress?: (progress: ParseProgress) => void

  /**
   * 解析EPUB文件
   */
  async parse(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<{ book: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>; chapters: Omit<Chapter, 'id' | 'bookId'>[] }> {
    if (onProgress) {
      this.onProgress = onProgress
    }
    
    try {
      // 报告开始解析
      this.reportProgress(0, '开始解析EPUB文件...')

      // 创建EPUB实例并转换文件为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const book = ePub()
      await book.open(arrayBuffer)

      this.reportProgress(20, '正在提取书籍信息...')

      // 提取书籍基本信息
      const bookInfo = await this.extractBookInfo(book, file)
      
      this.reportProgress(40, '正在解析目录结构...')

      // 解析章节
      const chapters = await this.extractChapters(book)
      
      this.reportProgress(100, '解析完成')

      return {
        book: bookInfo,
        chapters
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.reportProgress(-1, `解析失败: ${errorMessage}`)
      throw new Error(`EPUB解析失败: ${errorMessage}`)
    }
  }

  /**
   * 提取书籍基本信息
   */
  private async extractBookInfo(epubBook: any, file: File): Promise<Omit<Book, 'id' | 'addedAt' | 'updatedAt'>> {
    const metadata = epubBook.packaging.metadata
    const cover = await this.extractCover(epubBook)
    
    const bookInfo: Omit<Book, 'id' | 'addedAt' | 'updatedAt'> = {
      title: metadata.title || file.name.replace(/\.epub$/i, ''),
      author: metadata.creator || '未知作者',
      description: metadata.description || '',
      format: 'epub' as BookFormat,
      filePath: file.name,
      fileSize: file.size,
      status: BookStatus.UNREAD,
      progress: 0,
      language: metadata.language || 'zh-CN',
      publisher: metadata.publisher || '',
      totalPages: 0, // EPUB没有固定页数概念
      wordCount: 0   // 将在章节解析后计算
    }

    // 只在有封面时才添加coverUrl属性
    if (cover) {
      bookInfo.coverUrl = cover
    }

    // 只在有出版日期时才添加publishDate属性
    if (metadata.date) {
      bookInfo.publishDate = metadata.date
    }

    // 只在有ISBN时才添加isbn属性
    if (metadata.identifier) {
      bookInfo.isbn = metadata.identifier
    }

    return bookInfo
  }

  /**
   * 提取章节内容
   */
  private async extractChapters(epubBook: any): Promise<Omit<Chapter, 'id' | 'bookId'>[]> {
    const chapters: Omit<Chapter, 'id' | 'bookId'>[] = []
    const spine = epubBook.spine.spineItems
    let totalWordCount = 0

    for (let i = 0; i < spine.length; i++) {
      const spineItem = spine[i]
      
      try {
        this.reportProgress(
          40 + (i / spine.length) * 50,
          `正在解析第 ${i + 1}/${spine.length} 章...`
        )

        // 获取章节内容 - 使用正确的epubjs API
        const section = epubBook.section(spineItem.href)
        const doc = await section.load(epubBook.load.bind(epubBook))
        
        // 确保doc是有效的Document对象
        let content = ''
        let title = `第 ${i + 1} 章`
        
        if (doc && (doc.body || doc.documentElement)) {
          content = this.extractTextFromDocument(doc)
          title = this.extractChapterTitle(doc, i + 1)
        } else {
          // 如果无法获取Document，尝试直接获取文本内容
          const htmlContent = await section.render()
          if (htmlContent && typeof htmlContent === 'string') {
            // 创建临时DOM来解析HTML
            const parser = new DOMParser()
            const tempDoc = parser.parseFromString(htmlContent, 'text/html')
            content = this.extractTextFromDocument(tempDoc)
            title = this.extractChapterTitle(tempDoc, i + 1)
          }
        }
        
        const wordCount = this.countWords(content)
        totalWordCount += wordCount

        const chapter: Omit<Chapter, 'id' | 'bookId'> = {
          title,
          content,
          order: i + 1,
          wordCount,
          href: spineItem.href,
          startLocation: '0',
          endLocation: content.length.toString()
        }

        chapters.push(chapter)
      } catch (error) {
        console.warn(`解析第 ${i + 1} 章失败:`, error)
        // 创建一个错误章节占位符
        chapters.push({
          title: `第 ${i + 1} 章 (解析失败)`,
          content: '该章节解析失败，请检查文件格式。',
          order: i + 1,
          wordCount: 0,
          href: spineItem.href,
          startLocation: '0',
          endLocation: '0'
        })
      }
    }

    return chapters
  }

  /**
   * 从文档中提取纯文本
   */
  private extractTextFromDocument(doc: Document): string {
    try {
      // 添加更严格的检查
      if (!doc) {
        return ''
      }

      // 移除script和style标签
      const scripts = doc.querySelectorAll('script, style')
      scripts.forEach(el => el.remove())

      // 提取文本内容
      const body = doc.body || doc.documentElement
      if (!body) {
        return ''
      }
      
      let text = body.textContent || body.innerText || ''
      
      // 清理文本：移除多余空白字符
      text = text.replace(/\s+/g, ' ').trim()
      
      return text
    } catch (error) {
      console.warn('提取文档文本时出错:', error)
      return ''
    }
  }

  /**
   * 提取章节标题
   */
  private extractChapterTitle(doc: Document, defaultOrder: number): string {
    try {
      // 添加文档有效性检查
      if (!doc) {
        return `第 ${defaultOrder} 章`
      }
      
      // 尝试从各种标题标签中提取标题
      const titleSelectors = ['h1', 'h2', 'h3', '.title', '.chapter-title']
      
      for (const selector of titleSelectors) {
        try {
          const titleElement = doc.querySelector(selector)
          if (titleElement && titleElement.textContent?.trim()) {
            return titleElement.textContent.trim()
          }
        } catch (selectorError) {
          // 忽略单个选择器的错误，继续尝试下一个
          continue
        }
      }

      // 如果没有找到标题，使用默认格式
      return `第 ${defaultOrder} 章`
    } catch (error) {
      console.warn('提取章节标题时出错:', error)
      return `第 ${defaultOrder} 章`
    }
  }

  /**
   * 提取封面图片
   */
  private async extractCover(epubBook: any): Promise<string | undefined> {
    try {
      const coverUrl = await epubBook.coverUrl()
      if (coverUrl) {
        // 将blob URL转换为base64
        const response = await fetch(coverUrl)
        const blob = await response.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      }
    } catch (error) {
      console.warn('提取封面失败:', error)
    }
    return undefined
  }

  /**
   * 统计字数
   */
  private countWords(text: string): number {
    // 中文字符统计
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    // 英文单词统计
    const englishWords = (text.match(/\b[a-zA-Z]+\b/g) || []).length
    
    return chineseChars + englishWords
  }

  

  /**
   * 报告解析进度
   */
  private reportProgress(percentage: number, message: string): void {
    if (this.onProgress) {
      this.onProgress({
        stage: 'parsing',
        progress: Math.max(0, Math.min(100, percentage)),
        percentage: Math.max(0, Math.min(100, percentage)),
        message,
        isComplete: percentage >= 100,
        hasError: percentage < 0
      })
    }
  }

  /**
   * 检查文件是否为EPUB格式
   */
  static isSupported(file: File): boolean {
    return file.type === 'application/epub+zip' || 
           file.name.toLowerCase().endsWith('.epub')
  }

  /**
   * 检查是否可以解析该文件
   */
  canParse(file: File): boolean {
    return EPUBParser.isSupported(file)
  }
}