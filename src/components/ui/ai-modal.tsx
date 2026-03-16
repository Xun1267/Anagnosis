/**
 * AI分析模态框组件
 * 提供文本分析、翻译、总结等AI功能的用户界面
 */

import React, { useState, useEffect } from 'react'
import { X, Loader2, Brain, Languages, FileText, HelpCircle, Copy, Check, Save } from 'lucide-react'
import { aiService } from '../../lib/services'
import { TextSelection } from '../../types'
import { cn } from '../../lib/utils'
import { useNotes } from '../../hooks/useNotes'
import { AIAnalysisType } from '../../types/notes'

/**
 * AI模态框属性接口
 */
interface AIModalProps {
  isOpen: boolean
  onClose: () => void
  selection: TextSelection | null
  initialMode?: 'analyze' | 'translate' | 'summarize' | 'explain'
  bookTitle?: string
}

/**
 * AI分析结果接口
 */
interface AIResult {
  content: string
  type: 'analyze' | 'translate' | 'summarize' | 'explain'
  timestamp: number
}

/**
 * AI模态框组件
 */
export function AIModal({ isOpen, onClose, selection, initialMode = 'analyze', bookTitle }: AIModalProps) {
  const [mode, setMode] = useState<'analyze' | 'translate' | 'summarize' | 'explain'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [targetLanguage, setTargetLanguage] = useState('中文')
  const [maxLength, setMaxLength] = useState(200)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const { createNoteFromSelection } = useNotes()

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setResult(null)
      setError(null)
      setCopied(false)
      setIsSaving(false)
      setSaved(false)
    }
  }, [isOpen, initialMode])

  // 检查AI服务是否可用
  const isAIAvailable = aiService.isAvailable()

  /**
   * 执行AI分析
   */
  const handleAnalyze = async () => {
    if (!selection?.text || !isAIAvailable) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      let content: string
      
      switch (mode) {
        case 'analyze':
          content = await aiService.analyzeSelection(selection)
          break
        case 'translate':
          content = await aiService.translateText(selection.text, targetLanguage)
          break
        case 'summarize':
          content = await aiService.summarizeText(selection.text, maxLength)
          break
        case 'explain':
          content = await aiService.explainTerm(selection.text, selection.context)
          break
        default:
          throw new Error('未知的分析模式')
      }

      setResult({
        content,
        type: mode,
        timestamp: Date.now()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 复制结果到剪贴板
   */
  const handleCopy = async () => {
    if (!result?.content) return

    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  /**
   * 保存分析结果为笔记
   */
  const handleSaveNote = async () => {
    if (!result?.content || !selection?.text) return

    setIsSaving(true)
    try {
      // 将AI分析模式映射到笔记类型
      const noteTypeMap: Record<AIResult['type'], AIAnalysisType> = {
        analyze: AIAnalysisType.VOCABULARY,
        translate: AIAnalysisType.VOCABULARY,
        summarize: AIAnalysisType.SEMANTIC,
        explain: AIAnalysisType.VOCABULARY,
      }

      const noteType = noteTypeMap[result.type]

      await createNoteFromSelection(noteType, result.content, `${modeConfig[result.type].title}${bookTitle ? ` · ${bookTitle}` : ''}`)

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('保存笔记失败:', err)
      setError('保存笔记失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * 模式配置
   */
  const modeConfig = {
    analyze: {
      title: '文本分析',
      icon: Brain,
      description: '深入分析文本的含义、主题和文学手法',
      color: 'text-blue-600'
    },
    translate: {
      title: '文本翻译',
      icon: Languages,
      description: '将文本翻译成指定语言',
      color: 'text-green-600'
    },
    summarize: {
      title: '内容总结',
      icon: FileText,
      description: '提取文本的核心要点和主要内容',
      color: 'text-purple-600'
    },
    explain: {
      title: '词汇解释',
      icon: HelpCircle,
      description: '解释词汇的含义、用法和背景',
      color: 'text-orange-600'
    }
  }

  if (!isOpen) return null

  return (
    <div data-selection-ui className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-gray-100', modeConfig[mode].color)}>
              {React.createElement(modeConfig[mode].icon, { size: 20 })}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{modeConfig[mode].title}</h2>
              <p className="text-sm text-gray-600">{modeConfig[mode].description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* AI服务状态检查 */}
          {!isAIAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <HelpCircle size={16} />
                <span className="font-medium">AI服务未配置</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                请在环境变量中配置 VITE_OPENAI_API_KEY 以使用AI功能
              </p>
            </div>
          )}

          {/* 选中文本显示 */}
          {selection?.text && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">选中文本</h3>
              <p className="text-sm text-gray-900 leading-relaxed">
                {selection.text.length > 200 
                  ? `${selection.text.substring(0, 200)}...` 
                  : selection.text
                }
              </p>
              {selection.context && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">上下文</h4>
                  <p className="text-xs text-gray-700">
                    {selection.context.length > 100 
                      ? `${selection.context.substring(0, 100)}...` 
                      : selection.context
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 模式选择 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">分析模式</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(modeConfig).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key as any)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      mode === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{config.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 模式特定配置 */}
          {mode === 'translate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标语言
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="中文">中文</option>
                <option value="English">English</option>
                <option value="日本語">日本語</option>
                <option value="한국어">한국어</option>
                <option value="Français">Français</option>
                <option value="Deutsch">Deutsch</option>
                <option value="Español">Español</option>
              </select>
            </div>
          )}

          {mode === 'summarize' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大长度: {maxLength} 字
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50字</span>
                <span>500字</span>
              </div>
            </div>
          )}

          {/* 分析按钮 */}
          <button
            onClick={handleAnalyze}
            disabled={!selection?.text || !isAIAvailable || isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
              !selection?.text || !isAIAvailable || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                {React.createElement(modeConfig[mode].icon, { size: 16 })}
                <span>开始{modeConfig[mode].title}</span>
              </>
            )}
          </button>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 分析结果 */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-green-800">
                  {modeConfig[result.type].title}结果
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving || saved}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>保存中...</span>
                      </>
                    ) : saved ? (
                      <>
                        <Check size={12} />
                        <span>已保存</span>
                      </>
                    ) : (
                      <>
                        <Save size={12} />
                        <span>保存笔记</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 hover:bg-green-100 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIModal
