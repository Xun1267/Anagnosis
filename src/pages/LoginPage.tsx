/**
 * 登录页面组件
 * 处理用户邀请码验证和登录逻辑
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../lib/utils'

/**
 * 登录页面组件
 * @returns 登录页面JSX元素
 */
function LoginPage(): JSX.Element {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()

  // 页面加载时触发动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // 滚动监听，实现视差效果
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /**
   * 处理登录表单提交
   * @param e - 表单提交事件
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 验证邀请码
      if (inviteCode.trim() === 'welcome') {
        // 保存认证状态
        storage.set('isAuthenticated', true)
        storage.set('loginTime', new Date().toISOString())
        
        // 跳转到书架页面
        navigate('/bookshelf')
      } else {
        setError('邀请码无效，请检查后重试')
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white animate-page-load">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-medium text-gray-900 tracking-tight hover:scale-105 transition-transform duration-300 cursor-pointer">
              Anagnosis
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="pt-20 min-h-screen pl-6 pr-6 relative overflow-hidden">
        {/* 简笔画松树背景装饰 */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" className="text-gray-300">
            {/* 松树1 - 左上角 */}
            <g transform="translate(80, 60)" opacity="0.15">
              <path d="M20 80 L20 120" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M5 80 L20 50 L35 80 Z" fill="#9ca3af" />
              <path d="M8 70 L20 45 L32 70 Z" fill="#9ca3af" />
              <path d="M10 60 L20 40 L30 60 Z" fill="#9ca3af" />
            </g>
            
            {/* 松树2 - 左侧中部 */}
            <g transform="translate(150, 200)" opacity="0.12">
              <path d="M15 60 L15 90" stroke="#9ca3af" strokeWidth="2" fill="none" />
              <path d="M3 60 L15 35 L27 60 Z" fill="#9ca3af" />
              <path d="M6 52 L15 32 L24 52 Z" fill="#9ca3af" />
              <path d="M8 45 L15 28 L22 45 Z" fill="#9ca3af" />
            </g>
            
            {/* 松树3 - 右上角 */}
            <g transform="translate(1000, 80)" opacity="0.18">
              <path d="M25 100 L25 140" stroke="#9ca3af" strokeWidth="4" fill="none" />
              <path d="M8 100 L25 65 L42 100 Z" fill="#9ca3af" />
              <path d="M12 88 L25 58 L38 88 Z" fill="#9ca3af" />
              <path d="M15 76 L25 52 L35 76 Z" fill="#9ca3af" />
            </g>
            
            {/* 松树4 - 右侧中部 */}
            <g transform="translate(1050, 300)" opacity="0.14">
              <path d="M18 70 L18 100" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M5 70 L18 45 L31 70 Z" fill="#9ca3af" />
              <path d="M8 62 L18 42 L28 62 Z" fill="#9ca3af" />
              <path d="M10 55 L18 38 L26 55 Z" fill="#9ca3af" />
            </g>
            
            {/* 松树5 - 左下角 */}
            <g transform="translate(120, 500)" opacity="0.16">
              <path d="M20 80 L20 110" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M6 80 L20 50 L34 80 Z" fill="#9ca3af" />
              <path d="M9 70 L20 48 L31 70 Z" fill="#9ca3af" />
              <path d="M12 62 L20 45 L28 62 Z" fill="#9ca3af" />
            </g>
            
            {/* 松树6 - 右下角 */}
            <g transform="translate(980, 550)" opacity="0.13">
              <path d="M22 90 L22 125" stroke="#9ca3af" strokeWidth="3" fill="none" />
              <path d="M7 90 L22 60 L37 90 Z" fill="#9ca3af" />
              <path d="M11 80 L22 55 L33 80 Z" fill="#9ca3af" />
              <path d="M14 72 L22 50 L30 72 Z" fill="#9ca3af" />
            </g>
            
            {/* 小松树7 - 中间偏左 */}
            <g transform="translate(300, 350)" opacity="0.10">
              <path d="M12 50 L12 70" stroke="#9ca3af" strokeWidth="2" fill="none" />
              <path d="M2 50 L12 30 L22 50 Z" fill="#9ca3af" />
              <path d="M5 43 L12 28 L19 43 Z" fill="#9ca3af" />
            </g>
            
            {/* 小松树8 - 中间偏右 */}
            <g transform="translate(800, 400)" opacity="0.11">
              <path d="M10 45 L10 65" stroke="#9ca3af" strokeWidth="2" fill="none" />
              <path d="M1 45 L10 25 L19 45 Z" fill="#9ca3af" />
              <path d="M4 38 L10 23 L16 38 Z" fill="#9ca3af" />
            </g>
          </svg>
        </div>
        
        {/* 右侧巨大图书装饰 - 静态浅色背景 */}
        <div 
          className="fixed top-8 right-0 -z-10 pointer-events-none"
          style={{
            opacity: 0.08
          }}
        >
          <svg
            width="600"
            height="700"
            viewBox="0 0 600 700"
            className="drop-shadow-sm"
          >
            <defs>
              {/* 渐变定义 */}
              <linearGradient id="bookSpineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
                <stop offset="50%" stopColor="#334155" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.6" />
              </linearGradient>
              
              <linearGradient id="leftPageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.7" />
              </linearGradient>
              
              <linearGradient id="rightPageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
              </linearGradient>
              
              <linearGradient id="coverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
                <stop offset="50%" stopColor="#1e293b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            
            {/* 书本封面 */}
            <rect
              x="50"
              y="50"
              width="500"
              height="600"
              fill="url(#coverGradient)"
              rx="8"
              ry="8"
            />
            
            {/* 书脊 */}
            <rect
              x="295"
              y="50"
              width="20"
              height="600"
              fill="url(#bookSpineGradient)"
              rx="4"
            />
            
            {/* 左侧页面 */}
            <rect
              x="70"
              y="70"
              width="220"
              height="560"
              fill="url(#leftPageGradient)"
              rx="4"
            />
            
            {/* 右侧页面 */}
            <rect
              x="320"
              y="70"
              width="220"
              height="560"
              fill="url(#rightPageGradient)"
              rx="4"
            />
            
            {/* 左页文字线条 */}
            <g opacity="0.6">
              <line x1="90" y1="120" x2="270" y2="120" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="150" x2="250" y2="150" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="180" x2="260" y2="180" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="210" x2="240" y2="210" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="240" x2="270" y2="240" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="270" x2="230" y2="270" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="300" x2="260" y2="300" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="330" x2="250" y2="330" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="360" x2="240" y2="360" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="390" x2="270" y2="390" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="420" x2="260" y2="420" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="450" x2="250" y2="450" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="480" x2="240" y2="480" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="510" x2="270" y2="510" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="540" x2="260" y2="540" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="570" x2="250" y2="570" stroke="#64748b" strokeWidth="2" />
            </g>
            
            {/* 右页文字线条 */}
            <g opacity="0.6">
              <line x1="340" y1="120" x2="520" y2="120" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="150" x2="500" y2="150" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="180" x2="510" y2="180" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="210" x2="490" y2="210" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="240" x2="520" y2="240" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="270" x2="480" y2="270" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="300" x2="510" y2="300" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="330" x2="500" y2="330" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="360" x2="490" y2="360" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="390" x2="520" y2="390" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="420" x2="510" y2="420" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="450" x2="500" y2="450" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="480" x2="490" y2="480" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="510" x2="520" y2="510" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="540" x2="510" y2="540" stroke="#64748b" strokeWidth="2" />
              <line x1="340" y1="570" x2="500" y2="570" stroke="#64748b" strokeWidth="2" />
            </g>
            
            {/* 书本边框 */}
            <rect
              x="50"
              y="50"
              width="500"
              height="600"
              fill="none"
              stroke="#475569"
              strokeWidth="3"
              rx="8"
              ry="8"
            />
            
            {/* 页面分隔线 */}
            <line x1="305" y1="50" x2="305" y2="650" stroke="#64748b" strokeWidth="2" opacity="0.8" />
            
            {/* 高光效果 */}
            <rect
              x="55"
              y="55"
              width="15"
              height="590"
              fill="#f8fafc"
              opacity="0.3"
              rx="2"
            />
            <rect
              x="525"
              y="55"
              width="15"
              height="590"
              fill="#f8fafc"
              opacity="0.2"
              rx="2"
            />
          </svg>
        </div>
        
        {/* 左侧装饰性几何图形 */}
        <div 
          className="absolute top-40 -left-8 hidden md:block transition-transform duration-700 ease-out cursor-pointer group hover:scale-125"
          style={{
            transform: `translateY(${scrollY * -0.15}px)`,
            opacity: Math.max(0.05, 0.1 - scrollY * 0.00008)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform += ' rotate(180deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = e.currentTarget.style.transform.replace(' rotate(180deg)', '');
          }}
        >
          <svg width="100" height="200" viewBox="0 0 100 200" className="opacity-5 group-hover:opacity-15 transition-all duration-500">
            <circle cx="20" cy="50" r="3" fill="#6b7280" className="animate-pulse group-hover:fill-blue-400 group-hover:animate-none transition-all duration-500"/>
            <circle cx="30" cy="80" r="2" fill="#9ca3af" className="animate-pulse group-hover:fill-blue-500 group-hover:animate-none transition-all duration-500" style={{animationDelay: '1s'}}/>
            <circle cx="15" cy="120" r="4" fill="#6b7280" className="animate-pulse group-hover:fill-blue-400 group-hover:animate-none transition-all duration-500" style={{animationDelay: '2s'}}/>
            <circle cx="25" cy="160" r="2.5" fill="#9ca3af" className="animate-pulse group-hover:fill-blue-500 group-hover:animate-none transition-all duration-500" style={{animationDelay: '3s'}}/>
          </svg>
        </div>
        
        <div 
          className="max-w-none relative z-10 transition-transform duration-500 ease-out"
          style={{
            transform: `translateY(${scrollY * -0.05}px)`
          }}
        >
          {/* 标题区域 - 真正的左对齐 */}
          <div className="mb-16">
            <h1 
              className={`text-4xl md:text-5xl lg:text-6xl font-light text-gray-800 leading-tight mb-2 tracking-tight transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transform: `translateY(${scrollY * -0.02}px)`,
                opacity: Math.max(0.3, 1 - scrollY * 0.001)
              }}
            >
              Welcome to
            </h1>
            <h2 
              className={`text-6xl md:text-7xl lg:text-9xl font-bold text-gray-900 leading-tight mb-6 tracking-tight transition-all duration-1000 delay-200 italic ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transform: `translateY(${scrollY * -0.03}px)`,
                opacity: Math.max(0.2, 1 - scrollY * 0.0012),
                fontFamily: '"Playfair Display", "Georgia", serif'
              }}
            >
              Anagnosis
            </h2>
            
            <p 
              className={`text-xl md:text-2xl text-gray-500 font-light max-w-2xl leading-relaxed mb-12 transition-all duration-1000 delay-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transform: `translateY(${scrollY * -0.04}px)`,
                opacity: Math.max(0.4, 1 - scrollY * 0.0008)
              }}
            >
              A thoughtfully designed reading platform that transforms how you discover, organize, and engage with digital content.
            </p>
          </div>
        
          {/* 登录表单区域 - 去掉框线，更灵活的展示 */}
          <div 
            className={`max-w-md transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              transform: `translateY(${scrollY * -0.06}px)`,
              opacity: Math.max(0.5, 1 - scrollY * 0.0006)
            }}
          >
            <div className="mb-8">
              <h3 className="text-3xl font-light text-gray-900 mb-2 border-b border-gray-200 pb-4">
                Get Started
              </h3>
              <p className="text-gray-500 text-lg font-light">Enter your invite code to continue</p>
            </div>
              
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2 group">
                <label htmlFor="invite-code" className="block text-lg font-light text-gray-600 transition-all duration-300 group-focus-within:text-gray-900 group-focus-within:scale-105 origin-left">
                  Invite Code
                </label>
                <div className="relative">
                  <input
                    id="invite-code"
                    name="inviteCode"
                    type="text"
                    required
                    className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:ring-0 focus:border-gray-900 transition-all duration-500 text-lg placeholder-gray-400 font-light hover:border-gray-400 focus:scale-105 origin-left"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading}
                  />
                  {/* 输入框装饰性光效 */}
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500 opacity-0 focus-within:opacity-100 scale-x-0 focus-within:scale-x-100 origin-left"></div>
                </div>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm font-light animate-fade-in bg-red-50 py-3 px-4 rounded-lg border-l-4 border-red-400">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="inline-flex items-center px-8 py-3 text-lg font-light text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-all duration-300 group relative overflow-hidden hover:scale-105 hover:shadow-lg active:scale-95"
                onMouseEnter={(e) => {
                  if (!isLoading && inviteCode.trim()) {
                    const ripple = document.createElement('span');
                    ripple.className = 'absolute inset-0 bg-white/20 rounded-full scale-0 animate-ping';
                    e.currentTarget.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 600);
                  }
                }}
              >
                {/* 按钮背景动画 */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse">Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span className="transition-all duration-300 group-hover:tracking-wide">Continue</span>
                      <svg className="ml-2 h-4 w-4 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>
            
            <div className="mt-8">
              <p className="text-sm text-gray-400 font-light">
                Need an invite code? <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors underline">Contact us</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  )
}

export default LoginPage