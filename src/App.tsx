import { Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/toast'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './pages/LoginPage'
import BookshelfPage from './pages/BookshelfPage'
import ReaderPage from './pages/ReaderPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/layout/Layout'

/**
 * 主应用组件
 * 配置路由结构和全局组件
 * @returns React应用的根组件
 */
function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* 登录页面 - 无需认证 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 需要认证的页面 */}
        <Route path="/" element={
          <AuthGuard>
            <Layout>
              <BookshelfPage />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/bookshelf" element={
          <AuthGuard>
            <Layout>
              <BookshelfPage />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/reader/:bookId" element={
          <AuthGuard>
            <Layout>
              <ReaderPage />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard>
            <Layout>
              <SettingsPage />
            </Layout>
          </AuthGuard>
        } />
        
        {/* 404页面 */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600">页面未找到</p>
            </div>
          </div>
        } />
      </Routes>
      
      {/* 全局Toast通知 */}
      <Toaster />
    </div>
  )
}

export default App