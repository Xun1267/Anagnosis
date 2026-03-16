/**
 * 设置页面组件
 * 提供应用的各种配置选项，包括阅读设置、主题设置、AI功能等
 */

import { useSettings } from '../hooks'

/**
 * 设置页面组件
 * @returns 设置页面JSX元素
 */
function SettingsPage(): JSX.Element {
  const { 
    settings, 
    updateReadingSettings, 
    updateAISettings, 
    fontOptions 
  } = useSettings()

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-40 animate-float"></div>
      <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full opacity-50 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/3 left-1/4 w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full opacity-60 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 p-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light text-gray-900 mb-6 tracking-tight animate-fade-in">
            设置
          </h1>
          <div className="w-20 h-0.5 bg-gray-300 mx-auto mb-6"></div>
          <p className="text-lg text-gray-500 font-light">
            个性化你的阅读体验
          </p>
        </div>

        {/* 阅读设置 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 mb-8 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-2xl font-light text-gray-900 mb-6 pb-3 border-b border-gray-100">
            阅读设置
          </h2>
          
          {/* 字体大小 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              字体大小: <span className="font-mono text-blue-600">{settings.reading.fontSize}px</span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="12"
                max="24"
                value={settings.reading.fontSize}
                onChange={(e) => updateReadingSettings({ fontSize: Number(e.target.value) })}
                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>12px</span>
                <span>18px</span>
                <span>24px</span>
              </div>
            </div>
          </div>

          {/* 字体选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              字体
            </label>
            <div className="relative">
              <select
                value={settings.reading.fontFamily}
                onChange={(e) => updateReadingSettings({ fontFamily: e.target.value })}
                className="block w-full px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-blue-500 transition-colors duration-200 text-gray-700 font-light"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.name} - {font.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 p-4 bg-gray-50/50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">字体预览:</p>
              <p 
                className="text-lg leading-relaxed"
                style={{ fontFamily: settings.reading.fontFamily }}
              >
                The quick brown fox jumps over the lazy dog. 这是一个字体预览示例。
              </p>
            </div>
          </div>

          {/* 主题选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              主题
            </label>
            <div className="relative">
              <select
                value={settings.reading.theme}
                onChange={(e) => updateReadingSettings({ theme: e.target.value as 'light' | 'dark' | 'sepia' })}
                className="block w-full px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-blue-500 transition-colors duration-200 text-gray-700 font-light"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="sepia">护眼</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* AI设置 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-2xl font-light text-gray-900 mb-6 pb-3 border-b border-gray-100">
            AI设置
          </h2>
          
          {/* AI功能开关 */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
              <div>
                <label htmlFor="ai-enabled" className="text-sm font-medium text-gray-700">
                  启用AI解析功能
                </label>
                <p className="text-xs text-gray-500 mt-1">智能分析文档内容并提供解释</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  id="ai-enabled"
                  checked={settings.ai.enabled}
                  onChange={(e) => updateAISettings({ enabled: e.target.checked })}
                  className="sr-only"
                />
                <label
                  htmlFor="ai-enabled"
                  className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                    settings.ai.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                      settings.ai.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}
                  ></span>
                </label>
              </div>
            </div>
          </div>

          {/* 用户水平 */}
          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-4">
               用户水平
             </label>
             <div className="relative">
               <select
                 value={settings.ai.userLevel}
                 onChange={(e) => updateAISettings({ userLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                 className="block w-full px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-blue-500 transition-colors duration-200 text-gray-700 font-light"
               >
                 <option value="beginner">初级</option>
                 <option value="intermediate">中级</option>
                 <option value="advanced">高级</option>
               </select>
             </div>
           </div>
         </div>
         
         {/* 其他设置 */}
         <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
           <h2 className="text-2xl font-light text-gray-900 mb-6 pb-3 border-b border-gray-100">
             其他设置
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-4 bg-gray-50/50 rounded-xl">
               <h3 className="text-sm font-medium text-gray-700 mb-2">数据同步</h3>
               <p className="text-xs text-gray-500 mb-3">自动同步阅读进度和书签</p>
               <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                 配置同步
               </button>
             </div>
             
             <div className="p-4 bg-gray-50/50 rounded-xl">
               <h3 className="text-sm font-medium text-gray-700 mb-2">导入导出</h3>
               <p className="text-xs text-gray-500 mb-3">备份和恢复你的图书馆</p>
               <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                 管理数据
               </button>
             </div>
           </div>
         </div>
         
         {/* 装饰性文字 */}
         <div className="text-center mt-12">
           <p className="text-sm text-gray-400 font-light tracking-wider">— 让阅读更加个性化 —</p>
         </div>
       </div>
     </div>
   )
 }

export default SettingsPage