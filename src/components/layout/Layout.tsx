import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Book, Settings, Menu, X, LogOut, type LucideIcon } from 'lucide-react'
import { storage } from '../../lib/utils'

interface LayoutProps {
  children: ReactNode
}

/**
 * 主布局组件
 * @param props - 组件属性
 * @returns 布局JSX元素
 */
function Layout({ children }: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    storage.remove('isAuthenticated')
    storage.remove('loginTime')
    navigate('/login')
  }

  /**
   * 检查当前路径是否激活
   * @param path - 路径
   * @returns 是否激活
   */
  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/bookshelf'
    }
    return location.pathname.startsWith(path)
  }

  const navigation = [
    {
      name: '书架',
      href: '/bookshelf',
      icon: Book,
      current: isActivePath('/bookshelf') || location.pathname === '/'
    },
    {
      name: '设置',
      href: '/settings',
      icon: Settings,
      current: isActivePath('/settings')
    }
  ]

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-100">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex h-full w-full max-w-[18rem] flex-1 flex-col bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent
              navigation={navigation}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={navigation}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 px-3 py-3 backdrop-blur md:hidden">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* 页面内容 */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * 侧边栏内容组件
 */
interface SidebarContentProps {
  navigation: Array<{
    name: string
    href: string
    icon: LucideIcon
    current: boolean
  }>
  onLogout: () => void
}

function SidebarContent({ navigation, onLogout }: SidebarContentProps): JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-4 pt-5">
        <div className="flex flex-shrink-0 items-center px-2">
          <h1 className="text-[clamp(1.5rem,2vw,1.9rem)] font-bold tracking-tight text-gray-900">Anagnosis</h1>
        </div>
        
        {/* 导航菜单 */}
        <nav className="mt-5 flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors
                  ${
                    item.current
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`
                    mr-3 flex-shrink-0 h-6 w-6
                    ${
                      item.current
                        ? 'text-gray-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* 底部登出按钮 */}
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                退出登录
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default Layout
