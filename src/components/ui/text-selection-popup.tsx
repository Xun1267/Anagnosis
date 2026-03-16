import React from 'react'
import { Brain, X } from 'lucide-react'
import type { TextSelection } from '../../types'
import { cn } from '../../lib/utils'

interface TextSelectionPopupProps {
  selection: TextSelection | null
  onAIAnalyze: () => void
  onClose: () => void
  className?: string
}

/**
 * 文本选择浮动按钮组件
 * 当用户选择文本时显示，提供AI分析功能
 */
const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  selection,
  onAIAnalyze,
  onClose,
  className
}) => {
  if (!selection || !selection.text.trim()) {
    return null
  }

  // 如果没有选择文本，不显示弹窗
  if (!selection || !selection.boundingRect) {
    return null
  }

  const { boundingRect: rect } = selection
  
  // 计算弹窗位置
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: rect.left + rect.width / 2,
    top: rect.top - 50,
    transform: 'translateX(-50%)',
    zIndex: 1000
  }

  return (
    <div
      data-selection-ui
      style={popupStyle}
      className={cn(
        'flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      {/* AI分析按钮 */}
      <button
        onClick={onAIAnalyze}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        title="AI分析选中文本"
      >
        <Brain size={14} />
        <span>AI分析</span>
      </button>
      
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
        title="关闭"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default TextSelectionPopup
