/**
 * 文本选择处理Hook
 * 用于处理文本选择、上下文提取和AI分析功能
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { TextSelection } from '../types'

/**
 * 文本选择Hook配置选项
 */
export interface UseTextSelectionOptions {
  /** 最小选择长度 */
  minLength?: number
  /** 最大选择长度 */
  maxLength?: number
  /** 上下文长度 */
  contextLength?: number
  /** 是否启用 */
  enabled?: boolean
  /** 选择变化回调 */
  onSelectionChange?: (selection: TextSelection | null) => void
}

/**
 * 文本选择Hook返回值
 */
export interface UseTextSelectionReturn {
  /** 当前选择 */
  selection: TextSelection | null
  /** 是否有选择 */
  hasSelection: boolean
  /** 清除选择 */
  clearSelection: () => void
  /** 手动设置选择 */
  setSelection: (selection: TextSelection | null) => void
}

/**
 * 文本选择处理Hook
 */
export function useTextSelection(options: UseTextSelectionOptions = {}): UseTextSelectionReturn {
  const {
    minLength = 1,
    maxLength = 1000,
    contextLength = 100,
    enabled = true,
    onSelectionChange
  } = options

  const [selection, setSelectionState] = useState<TextSelection | null>(null)
  const selectionTimeoutRef = useRef<number>()

  /**
   * 提取文本上下文
   */
  const extractContext = useCallback((range: Range, selectedText: string): string => {
    try {
      const container = range.commonAncestorContainer
      const textContent = container.textContent || ''
      
      // 找到选中文本在容器中的位置
      const selectedIndex = textContent.indexOf(selectedText)
      if (selectedIndex === -1) return ''
      
      // 计算上下文范围
      const start = Math.max(0, selectedIndex - contextLength)
      const end = Math.min(textContent.length, selectedIndex + selectedText.length + contextLength)
      
      return textContent.substring(start, end)
    } catch (error) {
      console.warn('提取上下文失败:', error)
      return ''
    }
  }, [contextLength])

  /**
   * 处理文本选择
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled) return

    // 清除之前的延时
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }

    // 延时处理选择变化，避免频繁触发
    selectionTimeoutRef.current = setTimeout(() => {
      const windowSelection = window.getSelection()
      
      if (!windowSelection || windowSelection.rangeCount === 0) {
        setSelectionState(null)
        onSelectionChange?.(null)
        return
      }

      const range = windowSelection.getRangeAt(0)
      const selectedText = windowSelection.toString().trim()
      
      // 检查选择长度
      if (selectedText.length < minLength || selectedText.length > maxLength) {
        setSelectionState(null)
        onSelectionChange?.(null)
        return
      }

      // 获取选择位置信息
      const rect = range.getBoundingClientRect()
      const context = extractContext(range, selectedText)
      
      const newSelection: TextSelection = {
        text: selectedText,
        context,
        range: range,
        boundingRect: rect
      }

      setSelectionState(newSelection)
      onSelectionChange?.(newSelection)
    }, 100)
  }, [enabled, minLength, maxLength, extractContext, onSelectionChange])

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setSelectionState(null)
    onSelectionChange?.(null)
  }, [onSelectionChange])

  /**
   * 手动设置选择
   */
  const setSelection = useCallback((newSelection: TextSelection | null) => {
    setSelectionState(newSelection)
    onSelectionChange?.(newSelection)
  }, [onSelectionChange])

  // 监听选择变化事件
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [enabled, handleSelectionChange])

  // 监听点击事件，清除选择
  useEffect(() => {
    if (!enabled) return

    const handleClick = (event: MouseEvent) => {
      // 如果点击的不是文本内容，且也不是选择相关的UI元素，则清除选择
      const target = event.target as Element
      if (!target.closest('[data-text-content]') && !target.closest('[data-selection-ui]')) {
        clearSelection()
      }
    }

    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [enabled, clearSelection])

  return {
    selection,
    hasSelection: !!selection,
    clearSelection,
    setSelection
  }
}

export default useTextSelection