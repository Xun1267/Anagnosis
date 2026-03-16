/**
 * 服务层入口文件
 * 导出所有服务实例，提供统一的服务访问接口
 */

export { bookService, BookService } from './book-service'
export { storageService, StorageService } from '../storage'
export { aiService, AIService } from './ai-service'
export { createParser, isFileSupported, getFileInfo } from '../parsers'

// 导入服务实例
import { bookService } from './book-service'
import { storageService } from '../storage'
import { aiService } from './ai-service'

// 服务初始化函数
export async function initializeServices(): Promise<void> {
  try {
    await bookService.init()
    await aiService.initialize()
    console.log('所有服务初始化完成')
  } catch (error) {
    console.error('服务初始化失败:', error)
    throw error
  }
}

// 服务健康检查
export async function checkServicesHealth(): Promise<{
  storage: boolean
  book: boolean
  ai: boolean
  overall: boolean
}> {
  const health = {
    storage: false,
    book: false,
    ai: false,
    overall: false
  }

  try {
    // 检查存储服务
    await storageService.getStorageInfo()
    health.storage = true
  } catch {
    health.storage = false
  }

  try {
    // 检查书籍服务
    await bookService.getAllBooks()
    health.book = true
  } catch {
    health.book = false
  }

  try {
    // 检查AI服务
    health.ai = aiService.isAvailable()
  } catch {
    health.ai = false
  }

  health.overall = health.storage && health.book && health.ai
  return health
}