/**
 * AI服务实现
 * 提供文本分析、翻译、总结等AI功能
 */

import { AIAnalysisCache, AIServiceInterface, TextSelection, AIAnalysisRequest, AIAnalysisResponse } from '../../types'
import { storageService } from '../storage'
import { generateId } from '../utils'

/**
 * AI API配置接口
 */
interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
}

/**
 * AI请求参数接口
 */
interface AIRequest {
  prompt: string
  context?: string
  maxTokens?: number
  temperature?: number
}

/**
 * AI响应接口
 */
interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * AI服务类
 * 实现文本分析、翻译、总结等功能
 */
class AIService implements AIServiceInterface {
  private config: AIConfig
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7天缓存

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '1000'),
      temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7')
    }
  }

  /**
   * 初始化AI服务
   */
  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      console.warn('AI服务未配置API密钥，某些功能将不可用')
    }
    
    // 清理过期缓存
    await this.cleanExpiredCache()
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!this.config.apiKey
  }

  /**
   * 分析文本选择
   * @param selection 文本选择对象
   * @param bookTitle 书籍标题（可选）
   * @returns 分析结果
   */
  async analyzeSelection(selection: TextSelection, bookTitle?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI服务不可用，请检查API密钥配置')
    }

    const cacheKey = this.generateCacheKey('analyze', selection.text + (bookTitle || ''))
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      return cached.response.analysis.translation
    }

    const prompt = this.buildAnalysisPrompt(selection.text, selection.context, bookTitle)
    const response = await this.callAI({ prompt })
    
    // 保存到缓存
    await this.saveToCache(cacheKey, 'analyze', selection.text, response.content)
    
    return response.content
  }

  /**
   * 分析文本
   * @param request 分析请求
   * @returns 分析响应
   */
  async analyzeText(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI服务不可用，请检查API密钥配置')
    }

    const textHash = this.generateCacheKey(request.analysisType, request.text)
    
    // 尝试从缓存获取
    const cached = await this.getCachedAnalysis(textHash, request.analysisType, request.userLevel)
    if (cached) {
      return cached
    }

    const prompt = this.buildAnalysisPrompt(request.text, request.context)
    const response = await this.callAI({ prompt })
    
    // 构建分析响应
    const analysisResponse: AIAnalysisResponse = {
      id: generateId(),
      originalText: request.text,
      analysis: {
        translation: response.content,
        explanation: response.content,
        examples: [],
        difficulty: 'medium'
      },
      context: request.context,
      timestamp: new Date()
    }
    
    // 保存到缓存
    await this.saveToCache(textHash, request.analysisType, request.text, response.content)
    
    return analysisResponse
  }

  /**
   * 获取缓存的分析结果
   * @param textHash 文本哈希
   * @param analysisType 分析类型
   * @param userLevel 用户级别
   * @returns 缓存的分析结果
   */
  async getCachedAnalysis(textHash: string, analysisType: string, userLevel: string): Promise<AIAnalysisResponse | null> {
    try {
      const cached = await storageService.getAICache(textHash)
      if (cached && cached.expiresAt.getTime() > Date.now() && 
          cached.analysisType === analysisType && 
          cached.userLevel === userLevel) {
        return cached.response
      }
      return null
    } catch (error) {
      console.error('获取缓存分析失败:', error)
      return null
    }
  }

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param targetLanguage 目标语言
   * @param sourceLanguage 源语言（可选）
   * @param bookTitle 书籍标题（可选）
   * @returns 翻译结果
   */
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string, bookTitle?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI服务不可用，请检查API密钥配置')
    }

    const cacheKey = this.generateCacheKey('translate', `${text}_${targetLanguage}_${sourceLanguage || 'auto'}_${bookTitle || ''}`)
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      return cached.response.analysis.translation
    }

    const prompt = this.buildTranslationPrompt(text, targetLanguage, sourceLanguage, bookTitle)
    const response = await this.callAI({ prompt })
    
    // 保存到缓存
    await this.saveToCache(cacheKey, 'translate', text, response.content)
    
    return response.content
  }

  /**
   * 总结文本
   * @param text 要总结的文本
   * @param maxLength 最大长度
   * @param bookTitle 书籍标题（可选）
   * @returns 总结结果
   */
  async summarizeText(text: string, maxLength: number = 200, bookTitle?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI服务不可用，请检查API密钥配置')
    }

    const cacheKey = this.generateCacheKey('summarize', `${text}_${maxLength}_${bookTitle || ''}`)
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      return cached.response.analysis.translation
    }

    const prompt = this.buildSummaryPrompt(text, maxLength, bookTitle)
    const response = await this.callAI({ prompt })
    
    // 保存到缓存
    await this.saveToCache(cacheKey, 'summarize', text, response.content)
    
    return response.content
  }

  /**
   * 解释词汇或短语
   * @param term 词汇或短语
   * @param context 上下文
   * @param bookTitle 书籍标题（可选）
   * @returns 解释结果
   */
  async explainTerm(term: string, context?: string, bookTitle?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI服务不可用，请检查API密钥配置')
    }

    const cacheKey = this.generateCacheKey('explain', `${term}_${context || ''}_${bookTitle || ''}`)
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      return cached.response.analysis.translation
    }

    const prompt = this.buildExplanationPrompt(term, context, bookTitle)
    const response = await this.callAI({ prompt })
    
    // 保存到缓存
    await this.saveToCache(cacheKey, 'explain', term, response.content)
    
    return response.content
  }

  /**
   * 调用AI API
   * @param request 请求参数
   * @returns AI响应
   */
  private async callAI(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`AI API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`)
      }

      const data = await response.json()
      console.log('AI API响应数据:', data)
      
      if (!data.choices || data.choices.length === 0) {
        console.error('AI API返回数据格式错误:', data)
        throw new Error('AI API返回数据格式错误')
      }

      const content = data.choices[0].message.content
      console.log('AI返回的原始内容:', content)
      console.log('AI返回的内容类型:', typeof content)
      console.log('AI返回的内容长度:', content ? content.length : 0)
      console.log('AI返回的内容是否为空字符串:', content === '')
      console.log('AI返回的内容是否为null:', content === null)
      console.log('AI返回的内容是否为undefined:', content === undefined)
      
      // 检查content是否存在且不为null/undefined
      if (content === null || content === undefined) {
        console.warn('AI返回的content为null或undefined，但API显示有token消耗')
        throw new Error('AI返回内容为空，但API显示有token消耗，可能是模型兼容性问题')
      }
      
      // 如果content是空字符串但有token消耗，也记录警告
      if (content === '' && data.usage && data.usage.completion_tokens > 0) {
        console.warn('AI返回空字符串但有completion tokens:', data.usage.completion_tokens)
      }
      
      const trimmedContent = typeof content === 'string' ? content.trim() : String(content).trim()
      console.log('处理后的内容:', trimmedContent)
      console.log('处理后的内容长度:', trimmedContent.length)
      
      return {
        content: trimmedContent,
        usage: data.usage
      }
    } catch (error) {
      console.error('AI API调用失败:', error)
      throw error
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(text: string, context?: string, bookTitle?: string): string {
    let prompt = `请分析以下文本内容，提供深入的理解和解释：\n\n"${text}"\n\n`
    
    if (bookTitle) {
      prompt += `书籍：${bookTitle}\n\n`
    }
    
    if (context) {
      prompt += `上下文：${context}\n\n`
    }
    
    prompt += `请从以下角度进行分析：
1. 主要含义和主题
2. 文学手法或修辞技巧
3. 情感色彩和语调
4. 可能的深层含义
5. 与上下文的关系（如果提供）`
    
    if (bookTitle) {
      prompt += `
6. 在《${bookTitle}》这本书中的特殊意义`
    }
    
    prompt += `

请用中文回答，语言简洁明了。`
    
    return prompt
  }

  /**
   * 构建翻译提示词
   */
  private buildTranslationPrompt(text: string, targetLanguage: string, sourceLanguage?: string, bookTitle?: string): string {
    let prompt = `请将以下文本翻译成${targetLanguage}：\n\n"${text}"\n\n`
    
    if (sourceLanguage) {
      prompt += `源语言：${sourceLanguage}\n`
    }
    
    if (bookTitle) {
      prompt += `书籍：${bookTitle}\n`
    }
    
    prompt += `要求：
1. 保持原文的语调和风格
2. 确保翻译准确自然
3. 如果是文学作品，请保持其文学性`
    
    if (bookTitle) {
      prompt += `
4. 考虑在《${bookTitle}》这本书中的特定语境
5. 只返回翻译结果，不要添加额外说明`
    } else {
      prompt += `
4. 只返回翻译结果，不要添加额外说明`
    }
    
    return prompt
  }

  /**
   * 构建总结提示词
   */
  private buildSummaryPrompt(text: string, maxLength: number, bookTitle?: string): string {
    let prompt = `请总结以下文本内容，总结长度不超过${maxLength}字：\n\n"${text}"\n\n`
    
    if (bookTitle) {
      prompt += `书籍：${bookTitle}\n\n`
    }
    
    prompt += `要求：
1. 抓住核心要点
2. 保持逻辑清晰
3. 语言简洁明了
4. 用中文回答`
    
    if (bookTitle) {
      prompt += `
5. 结合《${bookTitle}》的整体背景进行总结`
    }
    
    return prompt
  }

  /**
   * 构建解释提示词
   */
  private buildExplanationPrompt(term: string, context?: string, bookTitle?: string): string {
    let prompt = `请解释词汇或短语："${term}"\n\n`
    
    if (bookTitle) {
      prompt += `书籍：${bookTitle}\n\n`
    }
    
    if (context) {
      prompt += `上下文：${context}\n\n`
    }
    
    prompt += `请提供：
1. 基本含义
2. 词源或来历（如果相关）
3. 在当前上下文中的具体含义
4. 相关的同义词或近义词
5. 使用示例`
    
    if (bookTitle) {
      prompt += `
6. 在《${bookTitle}》这本书中的特殊含义或重要性`
    }
    
    prompt += `

请用中文回答，语言通俗易懂。`
    
    return prompt
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(type: string, content: string): string {
    // 使用简单的哈希算法生成缓存键
    let hash = 0
    const str = `${type}_${content}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return `ai_cache_${Math.abs(hash).toString(36)}`
  }

  /**
   * 从缓存获取结果
   */
  private async getFromCache(key: string): Promise<AIAnalysisCache | null> {
    try {
      const cached = await storageService.getAICache(key)
      if (cached && cached.expiresAt.getTime() > Date.now()) {
        return cached
      }
      // 缓存过期，删除
      if (cached) {
        await storageService.deleteAICache(key)
      }
      return null
    } catch (error) {
      console.error('获取AI缓存失败:', error)
      return null
    }
  }

  /**
   * 保存结果到缓存
   */
  private async saveToCache(key: string, type: string, input: string, result: string): Promise<void> {
    try {
      const cache: AIAnalysisCache = {
        id: generateId(),
        textHash: key,
        analysisType: type,
        userLevel: 'intermediate', // 默认中级
        response: {
          id: generateId(),
          originalText: input,
          analysis: {
            translation: result,
            explanation: '',
            examples: [],
            difficulty: 'medium' as const
          },
          context: '',
          timestamp: new Date()
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_EXPIRY)
      }
      await storageService.saveAICache(cache)
    } catch (error) {
      console.error('保存AI缓存失败:', error)
      // 缓存失败不影响主要功能
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      await storageService.cleanExpiredAICache()
    } catch (error) {
      console.error('清理AI缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{ count: number; size: number }> {
    try {
      return await storageService.getAICacheStats()
    } catch (error) {
      console.error('获取AI缓存统计失败:', error)
      return { count: 0, size: 0 }
    }
  }

  /**
   * 清空所有缓存
   */
  async clearCache(): Promise<void> {
    try {
      await storageService.clearAICache()
    } catch (error) {
      console.error('清空AI缓存失败:', error)
      throw error
    }
  }
}

// 导出AI服务实例
export const aiService = new AIService()
export { AIService }
export type { AIConfig, AIRequest, AIResponse }