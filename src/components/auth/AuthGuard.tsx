import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../../lib/utils'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * 认证守卫组件
 * @param props - 组件属性
 * @returns 认证守卫JSX元素或null
 */
function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const navigate = useNavigate()

  useEffect(() => {
    /**
     * 检查用户认证状态
     */
    const checkAuth = () => {
      const isAuthenticated = storage.get<boolean>('isAuthenticated', false)
      const loginTime = storage.get<string>('loginTime')
      
      // 检查是否已认证
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
        return
      }
      
      // 检查登录是否过期（24小时）
      if (loginTime) {
        const loginDate = new Date(loginTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff > 24) {
          // 登录已过期，清除认证状态
          storage.remove('isAuthenticated')
          storage.remove('loginTime')
          navigate('/login', { replace: true })
          return
        }
      }
    }

    checkAuth()
  }, [navigate])

  // 检查当前认证状态
  const isAuthenticated = storage.get<boolean>('isAuthenticated', false)
  
  if (!isAuthenticated) {
    return null // 或者显示加载状态
  }

  return <>{children}</>
}

export default AuthGuard