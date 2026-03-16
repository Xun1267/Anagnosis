/**
 * TXT文件解析器
 * 解析纯文本文件，智能分割章节
 */

import type { Book, Chapter, FileParser, ParseProgress, BookFormat } from '../../types'
import { BookStatus } from '../../types'

export class TXTParser implements FileParser {
  private onProgress?: (progress: ParseProgress) => void

  /**
   * 解析TXT文件
   */
  async parse(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<{ book: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>; chapters: Omit<Chapter, 'id' | 'bookId'>[] }> {
    
    try {
      this.reportProgress(0, '开始解析TXT文件...', onProgress)
      
      // 读取文件内容
      const content = await this.readFileContent(file)
      this.reportProgress(30, '正在分析文本结构...', onProgress)
      
      // 创建书籍信息
      const book = this.createBookInfo(file, content)
      this.reportProgress(60, '正在分割章节...', onProgress)
      
      // 分割章节
      const chapters = this.splitIntoChapters(content)
      this.reportProgress(100, '解析完成', onProgress)
      
      return { book, chapters }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.reportProgress(-1, `解析失败: ${errorMessage}`, onProgress)
      throw new Error(`TXT文件解析失败: ${errorMessage}`)
    }
  }

  /**
   * 读取文件内容
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          resolve(content)
        } else {
          reject(new Error('文件内容为空'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      // 尝试以UTF-8编码读取，如果失败则尝试GBK
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * 创建书籍信息
   */
  private createBookInfo(file: File, content: string): Omit<Book, 'id' | 'addedAt' | 'updatedAt'> {
    const title = this.extractTitle(file.name, content)
    const author = this.extractAuthor(content)
    const wordCount = this.countWords(content)
    return {
      title,
      author,
      description: this.generateDescription(content),
      format: 'txt' as BookFormat,
      filePath: file.name,
      fileSize: file.size,
      status: BookStatus.UNREAD,
      progress: 0,
      language: this.detectLanguage(content),
      publisher: '',
      totalPages: Math.ceil(wordCount / 500), // 假设每页500字
      wordCount
    }
  }

  /**
   * 提取书名
   */
  private extractTitle(filename: string, content: string): string {
    // 首先尝试从文件名提取
    let title = filename.replace(/\.txt$/i, '')
    
    // 尝试从内容开头提取标题
    const lines = content.split('\n').slice(0, 10) // 检查前10行
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 0 && trimmed.length < 50) {
        // 如果这行看起来像标题（不太长，不太短）
        if (this.looksLikeTitle(trimmed)) {
          title = trimmed
          break
        }
      }
    }
    
    return title
  }

  /**
   * 判断文本是否像标题
   */
  private looksLikeTitle(text: string): boolean {
    // 标题特征：
    // 1. 长度适中（2-30字符）
    // 2. 不包含过多标点符号
    // 3. 可能包含书名号、引号等
    const titlePattern = /^[\u4e00-\u9fff\w\s《》""''\(\)（）]{2,30}$/
    return titlePattern.test(text) && !text.includes('。') && !text.includes('！')
  }

  /**
   * 提取作者信息
   */
  private extractAuthor(content: string): string {
    const lines = content.split('\n').slice(0, 20) // 检查前20行
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // 匹配常见的作者格式
      const authorPatterns = [
        /作者[：:](.*)/,
        /著[：:](.*)/,
        /by[：:]\s*(.*)/i,
        /author[：:]\s*(.*)/i
      ]
      
      for (const pattern of authorPatterns) {
        const match = trimmed.match(pattern)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
    }
    
    return '未知作者'
  }

  /**
   * 生成描述
   */
  private generateDescription(content: string): string {
    // 取前200字符作为描述
    const description = content.substring(0, 200).trim()
    return description.length < content.length ? description + '...' : description
  }

  /**
   * 检测语言
   */
  private detectLanguage(content: string): string {
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length
    const totalChars = content.length
    
    // 如果中文字符占比超过30%，认为是中文
    return chineseChars / totalChars > 0.3 ? 'zh-CN' : 'en'
  }

  /**
   * 分割章节
   */
  private splitIntoChapters(content: string): Omit<Chapter, 'id' | 'bookId'>[] {
    const chapters: Omit<Chapter, 'id' | 'bookId'>[] = []
    
    // 章节分割模式
    const chapterPatterns = [
      /^\s*第[一二三四五六七八九十百千万\d]+[章节回部]/m,
      /^\s*Chapter\s+\d+/im,
      /^\s*[第]?\d+[章节回部]/m,
      /^\s*[一二三四五六七八九十百千万]+[、\s]/m
    ]
    
    let chapterSplits: { index: number; title: string }[] = []
    
    // 尝试不同的分割模式
    for (const pattern of chapterPatterns) {
      const matches = Array.from(content.matchAll(new RegExp(pattern.source, pattern.flags + 'g')))
      if (matches.length > 1) { // 至少要有2个章节才认为分割有效
        chapterSplits = matches.map(match => ({
          index: match.index || 0,
          title: match[0].trim()
        }))
        break
      }
    }
    
    // 如果没有找到章节分割，将整个文本作为一章
    if (chapterSplits.length === 0) {
      chapters.push({
        title: '正文',
        content: content.trim(),
        order: 1,
        wordCount: this.countWords(content),
        startLocation: '0',
        endLocation: content.length.toString()
      })
      return chapters
    }
    
    // 根据分割点创建章节
    for (let i = 0; i < chapterSplits.length; i++) {
      const currentSplit = chapterSplits[i]
      const nextSplit = chapterSplits[i + 1]
      
      const startIndex = currentSplit.index
      const endIndex = nextSplit ? nextSplit.index : content.length
      
      const chapterContent = content.substring(startIndex, endIndex).trim()
      
      if (chapterContent.length > 0) {
        chapters.push({
          title: this.cleanChapterTitle(currentSplit.title),
          content: chapterContent,
          order: i + 1,
          wordCount: this.countWords(chapterContent),
          startLocation: startIndex.toString(),
          endLocation: endIndex.toString()
        })
      }
    }
    
    return chapters
  }

  /**
   * 清理章节标题
   */
  private cleanChapterTitle(title: string): string {
    return title.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ')
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
  private reportProgress(percentage: number, message: string, onProgress?: (progress: ParseProgress) => void): void {
    const progressCallback = onProgress || this.onProgress
    if (progressCallback) {
      progressCallback({
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
   * 检查文件是否为TXT格式
   */
  static isSupported(file: File): boolean {
    return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')
  }

  /**
   * 检查是否可以解析该文件
   */
  canParse(file: File): boolean {
    return TXTParser.isSupported(file)
  }
}