/**
 * 解析器工厂
 * 根据文件类型自动选择合适的解析器
 */

import { EPUBParser } from './epub-parser'
import { TXTParser } from './txt-parser'
import type { FileParser, BookFormat } from '../../types'
import { BookFormat as BookFormatEnum } from '../../types'

/**
 * 支持的MIME类型映射
 */
const SUPPORTED_FORMATS: Record<string, BookFormat> = {
  'application/epub+zip': BookFormatEnum.EPUB,
  'text/plain': BookFormatEnum.TXT
}

/**
 * 支持的文件扩展名映射
 */
const EXTENSION_FORMATS: Record<string, BookFormat> = {
  '.epub': BookFormatEnum.EPUB,
  '.txt': BookFormatEnum.TXT
}

/**
 * 创建文件解析器
 * @param file 要解析的文件
 * @returns 对应的解析器实例
 */
export function createParser(file: File): FileParser {
  const format = detectFileFormat(file)
  
  switch (format) {
    case 'epub':
      return new EPUBParser()
    case 'txt':
      return new TXTParser()
    default:
      throw new Error(`不支持的文件格式: ${file.type || '未知'}`)
  }
}

/**
 * 检测文件格式
 * @param file 文件对象
 * @returns 文件格式
 */
export function detectFileFormat(file: File): BookFormat {
  // 首先检查MIME类型
  if (file.type && SUPPORTED_FORMATS[file.type]) {
    return SUPPORTED_FORMATS[file.type]
  }
  
  // 然后检查文件扩展名
  const extension = getFileExtension(file.name)
  if (extension && EXTENSION_FORMATS[extension]) {
    return EXTENSION_FORMATS[extension]
  }
  
  // 如果都无法识别，抛出错误
  throw new Error(`无法识别文件格式: ${file.name}`)
}

/**
 * 检查文件是否支持
 * @param file 文件对象
 * @returns 是否支持该文件格式
 */
export function isFileSupported(file: File): boolean {
  try {
    detectFileFormat(file)
    return true
  } catch {
    return false
  }
}

/**
 * 获取支持的文件格式列表
 * @returns 支持的格式数组
 */
export function getSupportedFormats(): BookFormat[] {
  return Object.values(SUPPORTED_FORMATS)
}

/**
 * 获取支持的文件扩展名
 * @returns 支持的扩展名数组
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_FORMATS)
}

/**
 * 获取支持的MIME类型
 * @returns 支持的MIME类型数组
 */
export function getSupportedMimeTypes(): string[] {
  return Object.keys(SUPPORTED_FORMATS)
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（包含点号）
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : ''
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeMB 最大文件大小（MB）
 * @returns 是否在允许的大小范围内
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 获取文件信息摘要
 * @param file 文件对象
 * @returns 文件信息对象
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    type: file.type,
    format: detectFileFormat(file),
    lastModified: new Date(file.lastModified),
    isSupported: isFileSupported(file),
    isSizeValid: validateFileSize(file)
  }
}