/**
 * 文本位置工具实现
 * 
 * 提供文本位置计算、验证、恢复等功能
 * 用于准确定位和管理笔记在文本中的位置
 */

import {
  TextPosition,
  ITextPositionUtils,
  NoteError,
  NoteErrorType
} from '../../types/notes';

/**
 * 文本位置工具实现类
 * 处理DOM文本选择和位置计算
 */
export class TextPositionUtils implements ITextPositionUtils {
  private static instance: TextPositionUtils;
  
  /**
   * 获取单例实例
   */
  static getInstance(): TextPositionUtils {
    if (!TextPositionUtils.instance) {
      TextPositionUtils.instance = new TextPositionUtils();
    }
    return TextPositionUtils.instance;
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
   * 获取元素的文本内容（递归处理子元素）
   */
  private getElementTextContent(element: Element): string {
    let text = '';
    
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        text += this.getElementTextContent(node as Element);
      }
    }
    
    return text;
  }

  /**
   * 获取文本节点在容器中的偏移量
   */
  private getTextNodeOffset(container: Element, textNode: Node): number {
    let offset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    
    let currentNode = walker.nextNode();
    while (currentNode && currentNode !== textNode) {
      offset += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }
    
    return offset;
  }

  /**
   * 根据偏移量查找文本节点和节点内偏移
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
   * 获取元素的唯一选择器
   */
  private getElementSelector(element: Element): string {
    // 优先使用ID
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 使用类名组合
    if (element.className) {
      const classes = element.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        const selector = `${element.tagName.toLowerCase()}.${classes.join('.')}`;
        // 检查选择器是否唯一
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }
    
    // 使用路径选择器
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      // 添加nth-child选择器以确保唯一性
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children)
          .filter(sibling => sibling.tagName === current!.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  /**
   * 获取段落索引
   */
  private getParagraphIndex(element: Element, container: Element): number {
    const paragraphs = container.querySelectorAll('p, div, section, article');
    return Array.from(paragraphs).indexOf(element as HTMLElement);
  }

  /**
   * 计算选中文本的位置信息
   */
  calculatePosition(selection: Selection): TextPosition | null {
    try {
      if (!selection || selection.rangeCount === 0) {
        return null;
      }
      
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        return null; // 没有选中文本
      }
      
      // 查找包含选择的最近的文本容器
      let container: Node | null = range.commonAncestorContainer;
      
      // 如果是文本节点，向上查找元素节点
      while (container && container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentNode;
      }
      
      if (!container) {
        throw this.createError(
          NoteErrorType.POSITION_ERROR,
          'Cannot find container element for selection'
        );
      }
      
      const containerElement = container as Element;
      
      // 计算起始和结束偏移量
      const startOffset = this.getTextNodeOffset(containerElement, range.startContainer) + range.startOffset;
      const endOffset = this.getTextNodeOffset(containerElement, range.endContainer) + range.endOffset;
      
      // 获取选中的文本
      const selectedText = range.toString();
      
      if (!selectedText.trim()) {
        return null; // 只选中了空白字符
      }
      
      // 生成容器选择器
      const containerSelector = this.getElementSelector(containerElement);
      
      // 获取段落索引（可选）
      const paragraphElement = range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : range.startContainer as Element;
      
      const paragraphIndex = paragraphElement
        ? this.getParagraphIndex(paragraphElement, containerElement)
        : undefined;
      
      const position: TextPosition = {
        startOffset,
        endOffset,
        selectedText: selectedText.trim(),
        containerSelector,
        ...(paragraphIndex !== undefined ? { paragraphIndex } : {})
      };
      
      // 验证计算的位置
      if (!this.validatePosition(position)) {
        throw this.createError(
          NoteErrorType.POSITION_ERROR,
          'Calculated position is invalid'
        );
      }
      
      console.log('Calculated text position:', position);
      return position;
      
    } catch (error) {
      console.error('Failed to calculate text position:', error);
      
      if (error instanceof Error && error.message.includes('position')) {
        throw error;
      }
      
      throw this.createError(
        NoteErrorType.POSITION_ERROR,
        'Failed to calculate text position',
        error
      );
    }
  }

  /**
   * 验证位置信息是否有效
   */
  validatePosition(position: TextPosition): boolean {
    try {
      // 基本验证
      if (!position.containerSelector || 
          position.startOffset < 0 || 
          position.endOffset <= position.startOffset ||
          !position.selectedText.trim()) {
        return false;
      }
      
      // 验证容器是否存在
      const container = document.querySelector(position.containerSelector);
      if (!container) {
        console.warn('Container not found for position validation:', position.containerSelector);
        return false;
      }
      
      // 验证偏移量是否在容器文本范围内
      const containerText = this.getElementTextContent(container);
      if (position.endOffset > containerText.length) {
        console.warn('Position offset exceeds container text length');
        return false;
      }
      
      // 验证选中文本是否匹配
      const actualText = containerText.substring(position.startOffset, position.endOffset);
      if (actualText.trim() !== position.selectedText.trim()) {
        console.warn('Selected text does not match position:', {
          expected: position.selectedText,
          actual: actualText
        });
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Position validation failed:', error);
      return false;
    }
  }

  /**
   * 根据位置信息恢复文本选择
   */
  restoreSelection(position: TextPosition): boolean {
    try {
      // 验证位置信息
      if (!this.validatePosition(position)) {
        console.warn('Cannot restore selection: invalid position');
        return false;
      }
      
      // 查找容器元素
      const container = document.querySelector(position.containerSelector!);
      if (!container) {
        console.warn('Container not found for selection restoration');
        return false;
      }
      
      // 查找起始和结束文本节点
      const startResult = this.findTextNodeByOffset(container, position.startOffset);
      const endResult = this.findTextNodeByOffset(container, position.endOffset);
      
      if (!startResult.node || !endResult.node) {
        console.warn('Text nodes not found for selection restoration');
        return false;
      }
      
      // 创建新的选择范围
      const range = document.createRange();
      range.setStart(startResult.node, startResult.nodeOffset);
      range.setEnd(endResult.node, endResult.nodeOffset);
      
      // 应用选择
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 滚动到选择位置
        const target = startResult.node.parentElement ?? container;
        if (target instanceof Element) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        console.log('Selection restored successfully');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Failed to restore selection:', error);
      return false;
    }
  }

  /**
   * 检查两个位置是否重叠
   */
  isOverlapping(pos1: TextPosition, pos2: TextPosition): boolean {
    try {
      // 检查容器是否相同
      if (pos1.containerSelector !== pos2.containerSelector) {
        return false;
      }
      
      // 检查位置范围是否重叠
      return !(pos1.endOffset <= pos2.startOffset || pos2.endOffset <= pos1.startOffset);
      
    } catch (error) {
      console.error('Failed to check position overlap:', error);
      return false;
    }
  }

  /**
   * 合并重叠的位置
   */
  mergePositions(positions: TextPosition[]): TextPosition[] {
    try {
      if (positions.length <= 1) {
        return positions;
      }
      
      // 按容器和起始位置排序
      const sortedPositions = [...positions].sort((a, b) => {
        if (a.containerSelector !== b.containerSelector) {
          return a.containerSelector!.localeCompare(b.containerSelector!);
        }
        return a.startOffset - b.startOffset;
      });
      
      const merged: TextPosition[] = [];
      let current = sortedPositions[0];
      
      for (let i = 1; i < sortedPositions.length; i++) {
        const next = sortedPositions[i];
        
        if (this.isOverlapping(current, next)) {
          // 合并重叠的位置
          current = {
            ...current,
            startOffset: Math.min(current.startOffset, next.startOffset),
            endOffset: Math.max(current.endOffset, next.endOffset),
            selectedText: this.getTextInRange({
              ...current,
              startOffset: Math.min(current.startOffset, next.startOffset),
              endOffset: Math.max(current.endOffset, next.endOffset)
            }) || current.selectedText
          };
        } else {
          merged.push(current);
          current = next;
        }
      }
      
      merged.push(current);
      return merged;
      
    } catch (error) {
      console.error('Failed to merge positions:', error);
      return positions;
    }
  }

  /**
   * 获取位置范围内的文本
   */
  getTextInRange(position: TextPosition): string | null {
    try {
      if (!this.validatePosition(position)) {
        return null;
      }
      
      const container = document.querySelector(position.containerSelector!);
      if (!container) {
        return null;
      }
      
      const containerText = this.getElementTextContent(container);
      return containerText.substring(position.startOffset, position.endOffset);
      
    } catch (error) {
      console.error('Failed to get text in range:', error);
      return null;
    }
  }

  /**
   * 获取当前选择的位置信息
   */
  getCurrentSelection(): TextPosition | null {
    const selection = window.getSelection();
    return selection ? this.calculatePosition(selection) : null;
  }

  /**
   * 清除当前选择
   */
  clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  /**
   * 检查位置是否在视口中
   */
  isPositionInViewport(position: TextPosition): boolean {
    try {
      const container = document.querySelector(position.containerSelector!);
      if (!container) {
        return false;
      }
      
      const rect = container.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
      
    } catch (error) {
      console.error('Failed to check if position is in viewport:', error);
      return false;
    }
  }

  /**
   * 滚动到指定位置
   */
  scrollToPosition(position: TextPosition): boolean {
    try {
      const container = document.querySelector(position.containerSelector!);
      if (!container) {
        return false;
      }
      
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
      
    } catch (error) {
      console.error('Failed to scroll to position:', error);
      return false;
    }
  }
}

/**
 * 默认导出工具实例
 */
export const textPositionUtils = TextPositionUtils.getInstance();
