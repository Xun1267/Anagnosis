/**
 * 笔记样式工具实现
 * 
 * 提供四种AI分析类型对应的下划线样式：
 * - 词汇分析：虚线下划线
 * - 语法分析：实线下划线  
 * - 文化背景：波浪线下划线
 * - 语义分析：双下划线
 */

import {
  AIAnalysisType,
  NoteStyleConfig,
  TextPosition,
  NoteError,
  NoteErrorType
} from '../../types/notes';

/**
 * 样式配置常量
 */
export const NOTE_STYLE_CONFIG: Record<AIAnalysisType, NoteStyleConfig> = {
  [AIAnalysisType.VOCABULARY]: {
    className: 'note-highlight-vocabulary',
    underlineStyle: 'dashed',
    color: '#3b82f6', // 蓝色
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6'
  },
  [AIAnalysisType.GRAMMAR]: {
    className: 'note-highlight-grammar',
    underlineStyle: 'solid',
    color: '#10b981', // 绿色
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981'
  },
  [AIAnalysisType.CULTURAL]: {
    className: 'note-highlight-cultural',
    underlineStyle: 'wavy',
    color: '#f59e0b', // 橙色
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b'
  },
  [AIAnalysisType.SEMANTIC]: {
    className: 'note-highlight-semantic',
    underlineStyle: 'double',
    color: '#8b5cf6', // 紫色
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: '#8b5cf6'
  }
};

/**
 * CSS样式字符串
 */
export const NOTE_STYLES_CSS = `
/* 笔记高亮基础样式 */
.note-highlight {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 2px;
  padding: 1px 2px;
  margin: 0 1px;
}

.note-highlight:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 词汇分析 - 虚线下划线 */
.note-highlight-vocabulary {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
  border-bottom: 2px dashed #3b82f6;
}

.note-highlight-vocabulary:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

/* 语法分析 - 实线下划线 */
.note-highlight-grammar {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
  border-bottom: 2px solid #10b981;
}

.note-highlight-grammar:hover {
  background-color: rgba(16, 185, 129, 0.2);
}

/* 文化背景 - 波浪线下划线 */
.note-highlight-cultural {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: #f59e0b;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

.note-highlight-cultural:hover {
  background-color: rgba(245, 158, 11, 0.2);
}

/* 语义分析 - 双下划线 */
.note-highlight-semantic {
  color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.1);
  border-bottom: 3px double #8b5cf6;
}

.note-highlight-semantic:hover {
  background-color: rgba(139, 92, 246, 0.2);
}

/* 活跃状态样式 */
.note-highlight.active {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  z-index: 10;
}

/* 选中状态样式 */
.note-highlight.selected {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .note-highlight {
    padding: 2px 3px;
    margin: 0 2px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .note-highlight-vocabulary {
    color: #60a5fa;
    background-color: rgba(96, 165, 250, 0.15);
    border-bottom-color: #60a5fa;
  }
  
  .note-highlight-grammar {
    color: #34d399;
    background-color: rgba(52, 211, 153, 0.15);
    border-bottom-color: #34d399;
  }
  
  .note-highlight-cultural {
    color: #fbbf24;
    background-color: rgba(251, 191, 36, 0.15);
    text-decoration-color: #fbbf24;
  }
  
  .note-highlight-semantic {
    color: #a78bfa;
    background-color: rgba(167, 139, 250, 0.15);
    border-bottom-color: #a78bfa;
  }
}
`;

/**
 * 笔记样式工具类
 */
export class NoteStyleUtils {
  private static instance: NoteStyleUtils;
  private styleElement: HTMLStyleElement | null = null;
  private appliedHighlights = new Map<string, HTMLElement>();

  /**
   * 获取单例实例
   */
  static getInstance(): NoteStyleUtils {
    if (!NoteStyleUtils.instance) {
      NoteStyleUtils.instance = new NoteStyleUtils();
    }
    return NoteStyleUtils.instance;
  }

  /**
   * 初始化样式
   */
  initializeStyles(): void {
    try {
      if (this.styleElement) {
        return; // 已经初始化
      }

      // 创建样式元素
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'note-highlight-styles';
      this.styleElement.textContent = NOTE_STYLES_CSS;
      
      // 添加到文档头部
      document.head.appendChild(this.styleElement);
      
      console.log('Note styles initialized successfully');
    } catch (error) {
      console.error('Failed to initialize note styles:', error);
      throw this.createError(
        NoteErrorType.STYLE_ERROR,
        'Failed to initialize note styles',
        error
      );
    }
  }

  /**
   * 创建错误对象
   */
  private createError(type: NoteErrorType, message: string, details?: any): NoteError {
    return {
      type,
      message,
      details,
      timestamp: new Date()
    };
  }

  /**
   * 获取分析类型对应的样式配置
   */
  getStyleConfig(analysisType: AIAnalysisType): NoteStyleConfig {
    return NOTE_STYLE_CONFIG[analysisType];
  }

  /**
   * 获取分析类型对应的CSS类名
   */
  getClassName(analysisType: AIAnalysisType): string {
    return NOTE_STYLE_CONFIG[analysisType].className;
  }

  /**
   * 应用高亮样式到文本位置
   */
  applyHighlight(
    position: TextPosition,
    analysisType: AIAnalysisType,
    noteId: string,
    onClick?: (noteId: string) => void
  ): boolean {
    try {
      // 确保样式已初始化
      this.initializeStyles();

      // 查找容器元素
      const container = document.querySelector(position.containerSelector!);
      if (!container) {
        console.warn('Container not found for highlight application');
        return false;
      }

      // 查找文本节点和创建范围
      const range = this.createRangeFromPosition(container, position);
      if (!range) {
        console.warn('Failed to create range from position');
        return false;
      }

      // 创建高亮元素
      const highlightElement = document.createElement('span');
      const styleConfig = this.getStyleConfig(analysisType);
      
      // 设置样式类
      highlightElement.className = `note-highlight ${styleConfig.className}`;
      highlightElement.setAttribute('data-note-id', noteId);
      highlightElement.setAttribute('data-analysis-type', analysisType);
      highlightElement.setAttribute('data-selection-ui', 'true'); // 标记为选择相关UI
      
      // 设置点击事件
      if (onClick) {
        highlightElement.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(noteId);
        });
      }

      // 包装选中的文本
      try {
        range.surroundContents(highlightElement);
        
        // 记录应用的高亮
        this.appliedHighlights.set(noteId, highlightElement);
        
        console.log(`Applied ${analysisType} highlight for note ${noteId}`);
        return true;
        
      } catch (error) {
        // 如果surroundContents失败，尝试使用extractContents和appendChild
        const contents = range.extractContents();
        highlightElement.appendChild(contents);
        range.insertNode(highlightElement);
        
        this.appliedHighlights.set(noteId, highlightElement);
        
        console.log(`Applied ${analysisType} highlight for note ${noteId} (fallback method)`);
        return true;
      }
      
    } catch (error) {
      console.error('Failed to apply highlight:', error);
      return false;
    }
  }

  /**
   * 移除高亮样式
   */
  removeHighlight(noteId: string): boolean {
    try {
      const highlightElement = this.appliedHighlights.get(noteId);
      if (!highlightElement) {
        console.warn(`Highlight not found for note ${noteId}`);
        return false;
      }

      // 获取父节点
      const parent = highlightElement.parentNode;
      if (!parent) {
        console.warn('Highlight element has no parent');
        return false;
      }

      // 将高亮元素的内容移动到父节点
      while (highlightElement.firstChild) {
        parent.insertBefore(highlightElement.firstChild, highlightElement);
      }

      // 移除高亮元素
      parent.removeChild(highlightElement);
      
      // 从记录中移除
      this.appliedHighlights.delete(noteId);
      
      // 合并相邻的文本节点
      if (parent.nodeType === Node.ELEMENT_NODE) {
        parent.normalize();
      }
      
      console.log(`Removed highlight for note ${noteId}`);
      return true;
      
    } catch (error) {
      console.error('Failed to remove highlight:', error);
      return false;
    }
  }

  /**
   * 更新高亮样式
   */
  updateHighlight(noteId: string, newAnalysisType: AIAnalysisType): boolean {
    try {
      const highlightElement = this.appliedHighlights.get(noteId);
      if (!highlightElement) {
        console.warn(`Highlight not found for note ${noteId}`);
        return false;
      }

      // 移除旧的样式类
      const oldClasses = highlightElement.className.split(' ');
      const baseClasses = oldClasses.filter(cls => 
        cls === 'note-highlight' || 
        cls === 'active' || 
        cls === 'selected'
      );

      // 添加新的样式类
      const newStyleConfig = this.getStyleConfig(newAnalysisType);
      highlightElement.className = [...baseClasses, newStyleConfig.className].join(' ');
      highlightElement.setAttribute('data-analysis-type', newAnalysisType);
      
      console.log(`Updated highlight for note ${noteId} to ${newAnalysisType}`);
      return true;
      
    } catch (error) {
      console.error('Failed to update highlight:', error);
      return false;
    }
  }

  /**
   * 设置高亮元素的活跃状态
   */
  setHighlightActive(noteId: string, active: boolean): boolean {
    try {
      const highlightElement = this.appliedHighlights.get(noteId);
      if (!highlightElement) {
        return false;
      }

      if (active) {
        highlightElement.classList.add('active');
      } else {
        highlightElement.classList.remove('active');
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to set highlight active state:', error);
      return false;
    }
  }

  /**
   * 设置高亮元素的选中状态
   */
  setHighlightSelected(noteId: string, selected: boolean): boolean {
    try {
      const highlightElement = this.appliedHighlights.get(noteId);
      if (!highlightElement) {
        return false;
      }

      if (selected) {
        highlightElement.classList.add('selected');
      } else {
        highlightElement.classList.remove('selected');
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to set highlight selected state:', error);
      return false;
    }
  }

  /**
   * 获取所有应用的高亮
   */
  getAllHighlights(): Map<string, HTMLElement> {
    return new Map(this.appliedHighlights);
  }

  /**
   * 清除所有高亮
   */
  clearAllHighlights(): void {
    try {
      const noteIds = Array.from(this.appliedHighlights.keys());
      noteIds.forEach(noteId => this.removeHighlight(noteId));
      
      console.log('Cleared all highlights');
    } catch (error) {
      console.error('Failed to clear all highlights:', error);
    }
  }

  /**
   * 根据位置创建Range对象
   */
  private createRangeFromPosition(container: Element, position: TextPosition): Range | null {
    try {
      const range = document.createRange();
      
      // 查找起始和结束文本节点
      const startResult = this.findTextNodeByOffset(container, position.startOffset);
      const endResult = this.findTextNodeByOffset(container, position.endOffset);
      
      if (!startResult.node || !endResult.node) {
        return null;
      }
      
      range.setStart(startResult.node, startResult.nodeOffset);
      range.setEnd(endResult.node, endResult.nodeOffset);
      
      return range;
      
    } catch (error) {
      console.error('Failed to create range from position:', error);
      return null;
    }
  }

  /**
   * 根据偏移量查找文本节点
   */
  private findTextNodeByOffset(container: Element, offset: number): {
    node: Text | null;
    nodeOffset: number;
  } {
    let currentOffset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    
    let textNode = walker.nextNode() as Text;
    while (textNode) {
      const nodeLength = textNode.textContent?.length || 0;
      
      if (currentOffset + nodeLength >= offset) {
        return {
          node: textNode,
          nodeOffset: offset - currentOffset
        };
      }
      
      currentOffset += nodeLength;
      textNode = walker.nextNode() as Text;
    }
    
    return { node: null, nodeOffset: 0 };
  }

  /**
   * 销毁样式工具
   */
  destroy(): void {
    try {
      // 清除所有高亮
      this.clearAllHighlights();
      
      // 移除样式元素
      if (this.styleElement && this.styleElement.parentNode) {
        this.styleElement.parentNode.removeChild(this.styleElement);
        this.styleElement = null;
      }
      
      console.log('Note style utils destroyed');
    } catch (error) {
      console.error('Failed to destroy note style utils:', error);
    }
  }
}

/**
 * 默认导出样式工具实例
 */
export const noteStyleUtils = NoteStyleUtils.getInstance();

/**
 * 工具函数：获取分析类型的显示名称
 */
export function getAnalysisTypeDisplayName(type: AIAnalysisType): string {
  const displayNames = {
    [AIAnalysisType.VOCABULARY]: '词汇分析',
    [AIAnalysisType.GRAMMAR]: '语法分析',
    [AIAnalysisType.CULTURAL]: '文化背景',
    [AIAnalysisType.SEMANTIC]: '语义分析'
  };
  
  return displayNames[type] || type;
}

/**
 * 工具函数：获取分析类型的图标
 */
export function getAnalysisTypeIcon(type: AIAnalysisType): string {
  const icons = {
    [AIAnalysisType.VOCABULARY]: '📚',
    [AIAnalysisType.GRAMMAR]: '📝',
    [AIAnalysisType.CULTURAL]: '🌍',
    [AIAnalysisType.SEMANTIC]: '🧠'
  };
  
  return icons[type] || '📄';
}
