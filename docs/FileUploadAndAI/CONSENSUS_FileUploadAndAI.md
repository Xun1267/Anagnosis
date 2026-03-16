# 文件上传与AI识别功能共识文档

## 明确需求描述

### 核心功能需求

#### 1. 文件上传系统
- **支持格式**: EPUB (.epub) 和 TXT (.txt)
- **文件大小**: 最大50MB
- **上传方式**: 拖拽上传 + 点击选择
- **用户反馈**: 实时进度条、状态提示、错误信息
- **文件验证**: 格式检查、大小检查、内容完整性检查

#### 2. 文件解析系统
- **EPUB解析**: 提取章节结构、文本内容、元数据
- **TXT解析**: 智能分段、编码检测
- **解析结果**: 统一的书籍数据结构
- **错误处理**: 解析失败的友好提示和重试机制

#### 3. AI智能解析
- **触发方式**: 文本选择后显示AI按钮
- **解析类型**: 翻译、解释、总结、问答
- **API集成**: ChatAnywhere API
- **结果展示**: 弹窗形式，支持复制和保存

#### 4. 数据存储
- **本地存储**: IndexedDB
- **存储内容**: 书籍内容、元数据、AI解析历史
- **数据管理**: 增删改查、数据迁移

## 技术实现方案

### 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │    Services     │    │     Storage     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ FileUpload      │───▶│ FileParser      │───▶│ IndexedDB       │
│ BookshelfPage   │    │ AIService       │    │ BookStore       │
│ ReaderPage      │    │ BookService     │    │ AICache         │
│ AIModal         │    │ StorageService  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈确认
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **文件解析**: 
  - EPUB: `epubjs` 库
  - TXT: 原生JavaScript
- **存储**: IndexedDB (使用 `idb` 库)
- **AI服务**: ChatAnywhere API

### 组件设计

#### 1. FileUpload 组件
```typescript
interface FileUploadProps {
  onUploadSuccess: (book: Book) => void;
  onUploadError: (error: string) => void;
  acceptedFormats: string[];
  maxFileSize: number;
}
```

#### 2. AIModal 组件
```typescript
interface AIModalProps {
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: AIAnalysisResponse) => void;
}
```

### 数据模型

#### Book 接口
```typescript
interface Book {
  id: string;
  title: string;
  author?: string;
  format: 'epub' | 'txt';
  content: BookContent;
  metadata: BookMetadata;
  uploadDate: Date;
  lastReadPosition?: ReadPosition;
}
```

#### AI分析接口
```typescript
interface AIAnalysisRequest {
  text: string;
  analysisType: 'translate' | 'explain' | 'summarize' | 'qa';
  context?: string;
}

interface AIAnalysisResponse {
  id: string;
  originalText: string;
  result: string;
  analysisType: string;
  timestamp: Date;
}
```

## 技术约束

### 性能约束
- 文件上传响应时间: < 5秒（50MB文件）
- 文件解析时间: < 10秒（大型EPUB）
- AI API响应时间: < 30秒
- 页面加载时间: < 2秒

### 兼容性约束
- 支持现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
- 支持IndexedDB的浏览器
- 响应式设计（桌面端优先）

### 安全约束
- API密钥通过环境变量管理
- 文件内容本地存储，不上传到服务器
- 输入验证和XSS防护

## 集成方案

### 与现有系统集成
1. **路由集成**: 扩展现有React Router配置
2. **组件集成**: 复用现有Layout和UI组件
3. **样式集成**: 使用现有Tailwind配置和设计系统
4. **类型集成**: 扩展现有TypeScript类型定义

### API集成
```typescript
// .env 配置
VITE_OPENAI_API_KEY=your_api_key
VITE_OPENAI_BASE_URL=https://api.chatanywhere.tech/v1
VITE_DEFAULT_AI_MODEL=gpt-3.5-turbo
```

## 验收标准

### 功能验收标准

#### 文件上传
- [ ] 支持拖拽上传EPUB和TXT文件
- [ ] 显示上传进度和状态
- [ ] 文件格式和大小验证
- [ ] 上传失败时显示明确错误信息
- [ ] 上传成功后自动跳转到书架页面

#### 文件解析
- [ ] EPUB文件正确解析章节和内容
- [ ] TXT文件正确处理编码和分段
- [ ] 解析后的书籍显示在书架页面
- [ ] 解析失败时提供重试选项

#### AI功能
- [ ] 文本选择后显示AI解析按钮
- [ ] AI解析结果在弹窗中正确显示
- [ ] 支持多种解析类型切换
- [ ] AI请求失败时显示错误信息
- [ ] 解析历史可以查看和管理

#### 数据存储
- [ ] 书籍数据持久化存储
- [ ] 阅读进度自动保存
- [ ] AI解析结果缓存
- [ ] 数据导入导出功能

### 技术验收标准

#### 代码质量
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 组件可复用且符合现有架构
- [ ] 代码注释完整

#### 性能标准
- [ ] 文件上传进度实时更新
- [ ] 大文件解析不阻塞UI
- [ ] AI请求有loading状态
- [ ] 内存使用合理（无内存泄漏）

#### 错误处理
- [ ] 网络错误有重试机制
- [ ] 文件解析错误有友好提示
- [ ] API调用失败有降级方案
- [ ] 异常情况不会导致应用崩溃

## 任务边界

### 本次实现范围
- ✅ 完整的文件上传流程
- ✅ EPUB和TXT解析功能
- ✅ AI服务集成和UI
- ✅ IndexedDB数据存储
- ✅ 基础错误处理和用户反馈

### 后续版本功能
- 📋 PDF格式支持
- 📋 云端同步功能
- 📋 高级AI功能（语音合成、图像识别）
- 📋 多语言支持
- 📋 主题定制

## 风险缓解

### 技术风险
1. **EPUB解析复杂度**: 使用成熟的epubjs库，提供fallback方案
2. **大文件处理**: 实现分块上传和流式解析
3. **API稳定性**: 实现重试机制和错误恢复

### 用户体验风险
1. **上传等待时间**: 提供进度反馈和取消功能
2. **解析失败**: 提供详细错误信息和解决建议
3. **AI响应慢**: 设置合理超时和loading状态

---

**确认状态**: ✅ 已确认  
**文档版本**: v1.0  
**创建时间**: 2025-01-14  
**确认人**: AI Assistant  
**下一步**: 进入架构设计阶段