# Anagnosis

一个现代化的电子书阅读器应用，支持 EPUB、PDF、TXT 格式，集成 AI 智能解析功能。

## 功能特性

### 📚 文件管理
- 支持多种格式：EPUB、PDF、TXT
- 拖拽上传，简单易用
- 智能文件解析和元数据提取
- 本地存储，数据安全

### 🤖 AI 智能解析
- 集成 OpenAI API
- 智能内容解析和总结
- 个性化阅读建议
- 多语言支持

### 📖 阅读体验
- 响应式设计，适配多设备
- 自定义阅读设置（字体、主题等）
- 阅读进度同步
- 智能笔记系统
  - 文本高亮标记
- AI分析结果保存为笔记
  - 笔记侧栏管理
  - 多种笔记类型（词汇、语法、文化、语义）

### 🔐 准入控制
- 邀请码验证机制
- 安全的用户认证
- 会话管理

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router DOM
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **UI 组件**: Tailwind CSS + Lucide React
- **文件处理**: 
  - EPUB: epub.js
  - PDF: PDF.js
  - TXT: 原生支持
- **存储**: IndexedDB (Dexie.js)
- **AI 集成**: OpenAI API

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置必要的环境变量：
```env
# AI API配置
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_DEFAULT_AI_MODEL=gpt-3.5-turbo

# 应用配置
VITE_APP_ENV=development
VITE_APP_TITLE=Anagnosis
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
Anagnosis/
├── public/                 # 静态资源
├── src/
│   ├── components/         # React 组件
│   │   ├── auth/          # 认证相关组件
│   │   ├── layout/        # 布局组件
│   │   ├── notes/         # 笔记功能组件
│   │   └── ui/            # UI 基础组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具库
│   ├── pages/             # 页面组件
│   ├── services/          # API 服务
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript 类型定义
│   └── utils/             # 工具函数
├── docs/                  # 项目文档
└── tests/                 # 测试文件
```

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范化：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式
npm run lint:fix

# 格式化代码
npm run format
```

### 类型检查

```bash
# TypeScript 类型检查
npm run type-check
```

### 测试

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

## 部署

### 环境变量配置

生产环境需要配置以下环境变量：

- `VITE_OPENAI_API_KEY`: OpenAI API 密钥
- `VITE_APP_ENV`: 设置为 `production`
- 其他根据需要配置的变量

### 构建和部署

1. 构建生产版本：
```bash
npm run build
```

2. 部署 `dist` 目录到静态文件服务器

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您遇到问题或有建议，请创建 [Issue](../../issues)。

---

**Anagnosis** - 让阅读更智能 📚✨