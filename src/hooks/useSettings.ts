/**
 * 用户设置管理Hook
 * 提供设置的读取、更新和持久化功能
 */

import { useState, useEffect, useCallback } from 'react'
import { UserSettings } from '../types'
import { storage } from '../lib/utils'

/**
 * 默认设置配置
 */
const DEFAULT_SETTINGS: UserSettings = {
  reading: {
    fontSize: 16,
    fontFamily: 'Georgia, serif',
    lineHeight: 1.6,
    theme: 'light',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    pageWidth: 800,
    autoSave: true,
    autoBookmark: true
  },
  ai: {
    enabled: true,
    userLevel: 'beginner',
    autoAnalysis: false,
    customPrompts: {},
    analysisLanguage: 'zh'
  },
  ui: {
    language: 'zh',
    sidebarCollapsed: false,
    showProgress: true,
    showWordCount: true,
    animations: true
  }
}

/**
 * 英文字体选项配置
 */
export const FONT_OPTIONS = [
  {
    name: 'Georgia',
    value: 'Georgia, serif',
    category: 'serif',
    description: '经典衬线字体，适合长文本阅读'
  },
  {
    name: 'Times New Roman',
    value: '"Times New Roman", serif',
    category: 'serif',
    description: '传统衬线字体，正式文档常用'
  },
  {
    name: 'Playfair Display',
    value: '"Playfair Display", serif',
    category: 'serif',
    description: '优雅的现代衬线字体'
  },
  {
    name: 'Arial',
    value: 'Arial, sans-serif',
    category: 'sans-serif',
    description: '清晰的无衬线字体'
  },
  {
    name: 'Helvetica',
    value: 'Helvetica, Arial, sans-serif',
    category: 'sans-serif',
    description: '现代无衬线字体'
  },
  {
    name: 'Open Sans',
    value: '"Open Sans", sans-serif',
    category: 'sans-serif',
    description: '友好易读的无衬线字体'
  },
  {
    name: 'Roboto',
    value: 'Roboto, sans-serif',
    category: 'sans-serif',
    description: '现代几何无衬线字体'
  },
  {
    name: 'Lato',
    value: 'Lato, sans-serif',
    category: 'sans-serif',
    description: '人文主义无衬线字体'
  },
  {
    name: 'Merriweather',
    value: 'Merriweather, serif',
    category: 'serif',
    description: '为屏幕阅读优化的衬线字体'
  },
  {
    name: 'Source Sans Pro',
    value: '"Source Sans Pro", sans-serif',
    category: 'sans-serif',
    description: 'Adobe设计的专业无衬线字体'
  },
  {
    name: 'Crimson Text',
    value: '"Crimson Text", serif',
    category: 'serif',
    description: '为书籍设计的衬线字体'
  },
  {
    name: 'Fira Sans',
    value: '"Fira Sans", sans-serif',
    category: 'sans-serif',
    description: 'Mozilla设计的现代字体'
  }
]

/**
 * useSettings Hook返回值类型
 */
export interface UseSettingsReturn {
  /** 当前设置 */
  settings: UserSettings
  /** 更新设置 */
  updateSettings: (updates: Partial<UserSettings>) => void
  /** 更新阅读设置 */
  updateReadingSettings: (updates: Partial<UserSettings['reading']>) => void
  /** 更新AI设置 */
  updateAISettings: (updates: Partial<UserSettings['ai']>) => void
  /** 更新UI设置 */
  updateUISettings: (updates: Partial<UserSettings['ui']>) => void
  /** 重置设置 */
  resetSettings: () => void
  /** 导出设置 */
  exportSettings: () => string
  /** 导入设置 */
  importSettings: (settingsJson: string) => boolean
  /** 字体选项 */
  fontOptions: typeof FONT_OPTIONS
}

/**
 * 用户设置管理Hook
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)

  /**
   * 从本地存储加载设置
   */
  useEffect(() => {
    const savedSettings = storage.get<UserSettings>('userSettings')
    if (savedSettings) {
      // 合并默认设置和保存的设置，确保新增字段有默认值
      setSettings({
        reading: { ...DEFAULT_SETTINGS.reading, ...savedSettings.reading },
        ai: { ...DEFAULT_SETTINGS.ai, ...savedSettings.ai },
        ui: { ...DEFAULT_SETTINGS.ui, ...savedSettings.ui }
      })
    }
  }, [])

  /**
   * 保存设置到本地存储
   */
  const saveSettings = useCallback((newSettings: UserSettings) => {
    storage.set('userSettings', newSettings)
    setSettings(newSettings)
  }, [])

  /**
   * 更新设置
   */
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const newSettings = {
      ...settings,
      ...updates
    }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  /**
   * 更新阅读设置
   */
  const updateReadingSettings = useCallback((updates: Partial<UserSettings['reading']>) => {
    const newSettings = {
      ...settings,
      reading: {
        ...settings.reading,
        ...updates
      }
    }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  /**
   * 更新AI设置
   */
  const updateAISettings = useCallback((updates: Partial<UserSettings['ai']>) => {
    const newSettings = {
      ...settings,
      ai: {
        ...settings.ai,
        ...updates
      }
    }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  /**
   * 更新UI设置
   */
  const updateUISettings = useCallback((updates: Partial<UserSettings['ui']>) => {
    const newSettings = {
      ...settings,
      ui: {
        ...settings.ui,
        ...updates
      }
    }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  /**
   * 重置设置
   */
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
  }, [saveSettings])

  /**
   * 导出设置
   */
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2)
  }, [settings])

  /**
   * 导入设置
   */
  const importSettings = useCallback((settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson) as UserSettings
      
      // 验证设置格式
      if (!importedSettings.reading || !importedSettings.ai || !importedSettings.ui) {
        throw new Error('Invalid settings format')
      }
      
      // 合并默认设置确保完整性
      const validatedSettings: UserSettings = {
        reading: { ...DEFAULT_SETTINGS.reading, ...importedSettings.reading },
        ai: { ...DEFAULT_SETTINGS.ai, ...importedSettings.ai },
        ui: { ...DEFAULT_SETTINGS.ui, ...importedSettings.ui }
      }
      
      saveSettings(validatedSettings)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }, [saveSettings])

  return {
    settings,
    updateSettings,
    updateReadingSettings,
    updateAISettings,
    updateUISettings,
    resetSettings,
    exportSettings,
    importSettings,
    fontOptions: FONT_OPTIONS
  }
}

export default useSettings