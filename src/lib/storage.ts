/**
 * IndexedDB存储服务
 * 提供统一的数据存储接口，支持书籍、章节、进度、AI缓存等数据管理
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type {
  Book,
  Chapter,
  ReadingProgress,
  AIAnalysisCache,
  StorageServiceInterface,
  StorageError,
  BookFormat,
  BookStatus
} from '../types'

/**
 * 数据库模式定义
 */
interface LexiconDB extends DBSchema {
  books: {
    key: string
    value: Book
    indexes: {
      'by-format': BookFormat
      'by-status': BookStatus
      'by-added-date': Date
    }
  }
  chapters: {
    key: string
    value: Chapter
    indexes: {
      'by-book-id': string
      'by-order': number
    }
  }
  progress: {
    key: string
    value: ReadingProgress
    indexes: {
      'by-book-id': string
      'by-updated-date': Date
    }
  }
  ai_cache: {
    key: string
    value: AIAnalysisCache
    indexes: {
      'by-text-hash': string
      'by-expires-at': Date
    }
  }
}

/**
 * 数据库配置
 */
const DB_NAME = 'LexiconDB'
const DB_VERSION = 1

/**
 * 存储服务类
 */
export class StorageService implements StorageServiceInterface {
  private db: IDBPDatabase<LexiconDB> | null = null
  private initPromise: Promise<void> | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._initDB()
    return this.initPromise
  }

  /**
   * 内部数据库初始化方法
   */
  private async _initDB(): Promise<void> {
    try {
      this.db = await openDB<LexiconDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 创建books表
          if (!db.objectStoreNames.contains('books')) {
            const booksStore = db.createObjectStore('books', { keyPath: 'id' })
            booksStore.createIndex('by-format', 'format')
            booksStore.createIndex('by-status', 'status')
            booksStore.createIndex('by-added-date', 'addedAt')
          }

          // 创建chapters表
          if (!db.objectStoreNames.contains('chapters')) {
            const chaptersStore = db.createObjectStore('chapters', { keyPath: 'id' })
            chaptersStore.createIndex('by-book-id', 'bookId')
            chaptersStore.createIndex('by-order', 'order')
          }

          // 创建progress表
          if (!db.objectStoreNames.contains('progress')) {
            const progressStore = db.createObjectStore('progress', { keyPath: 'bookId' })
            progressStore.createIndex('by-book-id', 'bookId')
            progressStore.createIndex('by-updated-date', 'updatedAt')
          }

          // 创建ai_cache表
          if (!db.objectStoreNames.contains('ai_cache')) {
            const cacheStore = db.createObjectStore('ai_cache', { keyPath: 'id' })
            cacheStore.createIndex('by-text-hash', 'textHash')
            cacheStore.createIndex('by-expires-at', 'expiresAt')
          }
        },
      })
    } catch (error) {
      throw this.createStorageError('DB_ERROR', 'Failed to initialize database', error)
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBPDatabase<LexiconDB>> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw this.createStorageError('DB_ERROR', 'Database not initialized')
    }
    return this.db
  }

  /**
   * 保存数据
   */
  async save<T>(storeName: string, data: T): Promise<string> {
    try {
      const db = await this.ensureDB()
      const id = this.generateId()
      const dataWithId = { ...data, id }
      
      await db.put(storeName as any, dataWithId)
      return id
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to save data to ${storeName}`, error)
    }
  }

  /**
   * 获取数据
   */
  async get<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.ensureDB()
      const result = await db.get(storeName as any, id)
      return result || null
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to get data from ${storeName}`, error)
    }
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.ensureDB()
      return await db.getAll(storeName as any)
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to get all data from ${storeName}`, error)
    }
  }

  /**
   * 更新数据
   */
  async update<T>(storeName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const db = await this.ensureDB()
      const existing = await db.get(storeName as any, id)
      
      if (!existing) {
        throw this.createStorageError('NOT_FOUND', `Data with id ${id} not found in ${storeName}`)
      }

      const updated = { ...existing, ...data, updatedAt: new Date() }
      await db.put(storeName as any, updated)
    } catch (error) {
      if (error instanceof Error && error.name === 'StorageError') {
        throw error
      }
      throw this.createStorageError('DB_ERROR', `Failed to update data in ${storeName}`, error)
    }
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      await db.delete(storeName as any, id)
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to delete data from ${storeName}`, error)
    }
  }

  /**
   * 清空存储
   */
  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      await db.clear(storeName as any)
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to clear ${storeName}`, error)
    }
  }

  /**
   * 根据索引查询数据
   */
  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    try {
      const db = await this.ensureDB()
      // 类型安全的索引查询
      if (storeName === 'books') {
        return await db.getAllFromIndex('books', indexName as keyof LexiconDB['books']['indexes'], value) as T[]
      } else if (storeName === 'chapters') {
        return await db.getAllFromIndex('chapters', indexName as keyof LexiconDB['chapters']['indexes'], value) as T[]
      } else if (storeName === 'progress') {
        return await db.getAllFromIndex('progress', indexName as keyof LexiconDB['progress']['indexes'], value) as T[]
      } else if (storeName === 'ai_cache') {
        return await db.getAllFromIndex('ai_cache', indexName as keyof LexiconDB['ai_cache']['indexes'], value) as T[]
      } else {
        throw new Error(`Unknown store name: ${storeName}`)
      }
    } catch (error) {
      throw this.createStorageError('DB_ERROR', `Failed to query by index ${indexName}`, error)
    }
  }

  /**
   * 批量操作
   */
  async batch(operations: Array<{
    type: 'put' | 'delete'
    storeName: string
    data?: any
    id?: string
  }>): Promise<void> {
    try {
      const db = await this.ensureDB()
      const storeNames = [...new Set(operations.map(op => op.storeName))] as ('books' | 'chapters' | 'progress' | 'ai_cache')[]
      const tx = db.transaction(storeNames, 'readwrite')

      await Promise.all(
        operations.map(async (op) => {
          const store = tx.objectStore(op.storeName as any)
          if (op.type === 'put' && op.data) {
            await store.put(op.data)
          } else if (op.type === 'delete' && op.id) {
            await store.delete(op.id)
          }
        })
      )

      await tx.done
    } catch (error) {
      throw this.createStorageError('TRANSACTION_ERROR', 'Batch operation failed', error)
    }
  }

  /**
   * 保存AI缓存
   */
  async saveAICache(cache: AIAnalysisCache): Promise<string> {
    return await this.save('ai_cache', cache)
  }

  /**
   * 获取AI缓存
   */
  async getAICache(key: string): Promise<AIAnalysisCache | null> {
    return await this.get<AIAnalysisCache>('ai_cache', key)
  }

  /**
   * 删除AI缓存
   */
  async deleteAICache(key: string): Promise<void> {
    await this.delete('ai_cache', key)
  }

  /**
   * 获取AI缓存统计信息
   */
  async getAICacheStats(): Promise<{ count: number; size: number }> {
    try {
      const db = await this.ensureDB()
      const caches = await db.getAll('ai_cache')
      const count = caches.length
      const size = caches.reduce((total, cache) => {
         return total + (cache.response?.originalText?.length || 0) + (cache.response?.analysis?.translation?.length || 0)
       }, 0)
      return { count, size }
    } catch (error) {
      throw this.createStorageError('DB_ERROR', 'Failed to get cache stats', error)
    }
  }

  /**
   * 清理所有AI缓存
   */
  async clearAICache(): Promise<void> {
    await this.clear('ai_cache')
  }

  /**
   * 清理过期的AI缓存
   */
  async cleanExpiredAICache(): Promise<void> {
    try {
      const db = await this.ensureDB()
      const now = new Date()
      const expiredItems = await db.getAllFromIndex('ai_cache', 'by-expires-at', IDBKeyRange.upperBound(now))
      
      if (expiredItems.length > 0) {
        const tx = db.transaction('ai_cache', 'readwrite')
        await Promise.all(
          expiredItems.map(item => tx.store.delete(item.id))
        )
        await tx.done
      }
    } catch (error) {
      throw this.createStorageError('DB_ERROR', 'Failed to clean expired cache', error)
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{
    booksCount: number
    chaptersCount: number
    progressCount: number
    cacheCount: number
  }> {
    try {
      const db = await this.ensureDB()
      const [booksCount, chaptersCount, progressCount, cacheCount] = await Promise.all([
        db.count('books'),
        db.count('chapters'),
        db.count('progress'),
        db.count('ai_cache')
      ])

      return {
        booksCount,
        chaptersCount,
        progressCount,
        cacheCount
      }
    } catch (error) {
      throw this.createStorageError('DB_ERROR', 'Failed to get storage info', error)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建存储错误
   */
  private createStorageError(
    code: StorageError['code'],
    message: string,
    details?: any
  ): StorageError {
    const error = new Error(message) as StorageError
    error.name = 'StorageError'
    error.code = code
    error.details = details
    return error
  }
}

// 导出单例实例
export const storageService = new StorageService()

// 导出类型
export type { StorageError }