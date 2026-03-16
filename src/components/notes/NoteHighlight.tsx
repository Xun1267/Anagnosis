/**
 * NoteHighlight组件
 * 
 * 负责在文本中显示笔记高亮标记
 * 支持不同类型的下划线样式和交互功能
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Note,
  AIAnalysisType,
  NoteHighlightProps
} from '../../types/notes';
import { noteStyleUtils } from '../../lib/utils/note-styles';
import { textPositionUtils } from '../../lib/utils/text-position';

/**
 * NoteHighlight组件实现
 */
export const NoteHighlight: React.FC<NoteHighlightProps> = ({
  note,
  isActive = false,
  isSelected = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  className = '',
  style = {},
  children
}) => {
  // 引用和状态
  const highlightRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  /**
   * 获取样式配置
   */
  const styleConfig = noteStyleUtils.getStyleConfig(note.analysisType);

  /**
   * 处理点击事件
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onClick) {
      onClick(note, event);
    }
    
    console.log('Note highlight clicked:', note.id, note.analysisType);
  }, [note, onClick]);

  /**
   * 处理双击事件
   */
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onDoubleClick) {
      onDoubleClick(note, event);
    }
    
    console.log('Note highlight double-clicked:', note.id);
  }, [note, onDoubleClick]);

  /**
   * 处理右键菜单事件
   */
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onContextMenu) {
      onContextMenu(note, event);
    }
    
    console.log('Note highlight context menu:', note.id);
  }, [note, onContextMenu]);

  /**
   * 处理鼠标悬停
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  /**
   * 检查高亮是否在视口中
   */
  const checkVisibility = useCallback(() => {
    if (highlightRef.current && note.position) {
      const isInViewport = textPositionUtils.isPositionInViewport(note.position);
      setIsVisible(isInViewport);
    }
  }, [note.position]);

  /**
   * 滚动到高亮位置
   */
  const scrollToHighlight = useCallback(() => {
    if (note.position) {
      textPositionUtils.scrollToPosition(note.position);
    }
  }, [note.position]);

  /**
   * 生成CSS类名
   */
  const generateClassName = useCallback(() => {
    const classes = [
      'note-highlight',
      `note-highlight--${note.analysisType}`,
      className
    ];

    if (isActive) {
      classes.push('note-highlight--active');
    }

    if (isSelected) {
      classes.push('note-highlight--selected');
    }

    if (isHovered) {
      classes.push('note-highlight--hovered');
    }

    if (!isVisible) {
      classes.push('note-highlight--hidden');
    }

    if (note.isDeleted) {
      classes.push('note-highlight--deleted');
    }

    return classes.filter(Boolean).join(' ');
  }, [note.analysisType, note.isDeleted, isActive, isSelected, isHovered, isVisible, className]);

  /**
   * 生成内联样式
   */
  const generateStyle = useCallback(() => {
    const baseStyle: React.CSSProperties = {
      // 基础样式
      position: 'relative',
      display: 'inline',
      cursor: 'pointer',
      userSelect: 'none',
      
      // 下划线样式
      textDecorationLine: 'underline',
      textDecorationStyle: styleConfig.underlineStyle,
      textDecorationColor: styleConfig.color,
      textDecorationThickness: '2px',
      textUnderlineOffset: '2px',
      
      // 过渡效果
      transition: 'all 0.2s ease-in-out',
      
      // 合并用户样式
      ...style
    };

    // 活跃状态样式
    if (isActive) {
      baseStyle.backgroundColor = `${styleConfig.color}20`; // 20% 透明度
      baseStyle.textDecorationThickness = '3px';
    }

    // 选中状态样式
    if (isSelected) {
      baseStyle.backgroundColor = `${styleConfig.color}30`; // 30% 透明度
      baseStyle.outline = `2px solid ${styleConfig.color}`;
      baseStyle.outlineOffset = '1px';
    }

    // 悬停状态样式
    if (isHovered) {
      baseStyle.backgroundColor = `${styleConfig.color}15`; // 15% 透明度
      baseStyle.textDecorationThickness = '2.5px';
    }

    // 删除状态样式
    if (note.isDeleted) {
      baseStyle.opacity = 0.5;
      baseStyle.textDecorationStyle = 'dashed';
      baseStyle.cursor = 'not-allowed';
    }

    // 隐藏状态样式
    if (!isVisible) {
      baseStyle.opacity = 0.3;
    }

    return baseStyle;
  }, [styleConfig, isActive, isSelected, isHovered, isVisible, note.isDeleted, style]);

  /**
   * 生成工具提示内容
   */
  const generateTooltip = useCallback(() => {
    const parts = [
      `类型: ${getAnalysisTypeLabel(note.analysisType)}`,
      `内容: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`,
    ];

    if (note.title) {
      parts.unshift(`标题: ${note.title}`);
    }

    if (note.isDeleted) {
      parts.push('状态: 已删除');
    }

    return parts.join('\n');
  }, [note]);

  /**
   * 监听可见性变化
   */
  useEffect(() => {
    checkVisibility();
    
    // 监听滚动事件
    const handleScroll = () => {
      checkVisibility();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [checkVisibility]);

  /**
   * 活跃状态变化时滚动到视图
   */
  useEffect(() => {
    if (isActive && !isVisible) {
      scrollToHighlight();
    }
  }, [isActive, isVisible, scrollToHighlight]);

  return (
    <span
      ref={highlightRef}
      className={generateClassName()}
      style={generateStyle()}
      title={generateTooltip()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-note-id={note.id}
      data-analysis-type={note.analysisType}
      data-selection-ui="true" // 标记为选择相关UI
      role="button"
      tabIndex={0}
      aria-label={`笔记高亮: ${getAnalysisTypeLabel(note.analysisType)} - ${note.content.substring(0, 50)}`}
      aria-pressed={isActive}
      aria-selected={isSelected}
    >
      {children || note.selectedText}
    </span>
  );
};

/**
 * 获取分析类型标签
 */
function getAnalysisTypeLabel(type: AIAnalysisType): string {
  const labels: Record<AIAnalysisType, string> = {
    [AIAnalysisType.VOCABULARY]: '词汇',
    [AIAnalysisType.GRAMMAR]: '语法',
    [AIAnalysisType.CULTURAL]: '文化背景',
    [AIAnalysisType.SEMANTIC]: '语义'
  };
  
  return labels[type] || '未知';
}

/**
 * 高亮容器组件
 * 用于包装多个高亮元素
 */
export const NoteHighlightContainer: React.FC<{
  children: React.ReactNode;
  documentId?: string;
  onNoteClick?: (noteIds: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => {
  return (
    <div
      className={`note-highlight-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
      data-selection-ui="true"
    >
      {children}
    </div>
  );
};

/**
 * 高亮组合组件
 * 用于处理重叠的高亮
 */
export const NoteHighlightGroup: React.FC<{
  notes: Note[];
  activeNoteId?: string | null;
  selectedNoteIds?: string[];
  onNoteClick?: (note: Note, event: React.MouseEvent) => void;
  onNoteDoubleClick?: (note: Note, event: React.MouseEvent) => void;
  onNoteContextMenu?: (note: Note, event: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  notes,
  activeNoteId,
  selectedNoteIds = [],
  onNoteClick,
  onNoteDoubleClick,
  onNoteContextMenu,
  children,
  className = '',
  style = {}
}) => {
  // 按优先级排序笔记（活跃 > 选中 > 普通）
  const sortedNotes = [...notes].sort((a, b) => {
    const aIsActive = a.id === activeNoteId;
    const bIsActive = b.id === activeNoteId;
    const aIsSelected = selectedNoteIds.includes(a.id);
    const bIsSelected = selectedNoteIds.includes(b.id);
    
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    if (aIsSelected && !bIsSelected) return -1;
    if (!aIsSelected && bIsSelected) return 1;
    
    return 0;
  });

  // 如果只有一个笔记，直接渲染
  if (sortedNotes.length === 1) {
    const note = sortedNotes[0];
    return (
      <NoteHighlight
        note={note}
        isActive={note.id === activeNoteId}
        isSelected={selectedNoteIds.includes(note.id)}
        onClick={onNoteClick}
        onDoubleClick={onNoteDoubleClick}
        onContextMenu={onNoteContextMenu}
        className={className}
        style={style}
      >
        {children}
      </NoteHighlight>
    );
  }

  // 多个笔记时，使用容器包装
  return (
    <NoteHighlightContainer className={className} style={style}>
      {sortedNotes.map((note, index) => (
        <NoteHighlight
          key={note.id}
          note={note}
          isActive={note.id === activeNoteId}
          isSelected={selectedNoteIds.includes(note.id)}
          onClick={onNoteClick}
          onDoubleClick={onNoteDoubleClick}
          onContextMenu={onNoteContextMenu}
          style={{
            zIndex: sortedNotes.length - index // 确保活跃的在最上层
          }}
        >
          {index === 0 ? children : null} {/* 只在第一个高亮中显示文本 */}
        </NoteHighlight>
      ))}
    </NoteHighlightContainer>
  );
};

/**
 * 默认导出
 */
export default NoteHighlight;
