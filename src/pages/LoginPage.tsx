/**
 * 登录页面组件
 * 处理用户邀请码验证和登录逻辑
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../lib/utils'
import LoginFlipBook from '../components/auth/LoginFlipBook'

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
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4">
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
      <main className="pt-24 min-h-screen relative overflow-hidden">
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
        <div className="absolute inset-y-0 right-0 w-[42vw] min-w-[360px] bg-gradient-to-l from-slate-100/70 via-stone-50/30 to-transparent -z-10 hidden lg:block"></div>

        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10 lg:py-16 relative z-10">
          <div
            className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] min-h-[calc(100vh-8rem)]"
            style={{
              transform: `translateY(${scrollY * -0.03}px)`
            }}
          >
            <div className="relative z-20 max-w-2xl pr-0 lg:pr-8">
              <div className="mb-14">
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
        
              <div 
                className={`max-w-md transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transform: `translateY(${scrollY * -0.04}px)`,
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
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-slate-500 via-stone-400 to-slate-300 transition-all duration-500 opacity-0 focus-within:opacity-100 scale-x-0 focus-within:scale-x-100 origin-left"></div>
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

            <div
              className={`relative z-10 hidden lg:flex justify-end transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                transform: `translateY(${scrollY * -0.02}px)`
              }}
            >
              <LoginFlipBook />
            </div>
          </div>
        </div>
      </main>
      
    </div>
  )
}

export default LoginPage
