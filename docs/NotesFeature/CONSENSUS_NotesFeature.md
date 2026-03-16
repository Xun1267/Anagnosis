# 笔记功能共识文档

## 需求确认

基于用户反馈，明确以下功能需求和技术实现方案：

### 核心功能
1. **AI分析结果保存为笔记**
2. **四种下划线样式标识**
3. **笔记查看和管理**
4. **侧栏展示界面**

## 技术实现方案

### 1. 下划线样式定义

| AI分析类型 | 下划线样式 | CSS实现 |
|-----------|-----------|----------|
| 词汇分析 | 虚线下划线 | `border-bottom: 2px dashed #3b82f6` |
| 语法分析 | 实线下划线 | `border-bottom: 2px solid #10b981` |
| 文化背景分析 | 波浪线 | `text-decoration: underline wavy #f59e0b` |
| 语义分析 | 双下划线 | `border-bottom: 3px double #ef4444` |

### 2. 数据结构设计

```typescript
interface Note {
  id: string;
  type: 'vocabulary' | 'grammar' | 'cultural' | 'semantic';
  originalText: string;
  analysis: string;
  position: {
    startOffset: number;
    endOffset: number;
    documentId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface NoteStorage {
  notes: Note[];
  getByPosition(documentId: string, offset: number): Note[];
  save(note: Note): void;
  update(id: string, updates: Partial<Note>): void;
  delete(id: string): void;
}
```

### 3. 组件架构设计

#### 3.1 新增组件
- `NoteSidebar`: 右侧笔记侧栏组件
- `NoteHighlight`: 文本高亮下划线组件
- `NoteManager`: 笔记管理服务
- `useNotes`: 笔记管理Hook

#### 3.2 修改现有组件
- `AIModal`: 添加"保存为笔记"按钮
- `ReaderPage`: 集成笔记高亮和侧栏
- `TextSelectionPopup`: 显示已有笔记提示

### 4. 交互流程设计

#### 4.1 保存笔记流程
1. 用户选择文本并进行AI分析
2. AI分析完成后，在结果下方显示"保存为笔记"按钮
3. 点击保存后，原文添加对应样式的下划线
4. 笔记数据保存到本地存储

#### 4.2 查看笔记流程
1. 用户点击带下划线的文本
2. 右侧滑出笔记侧栏
3. 显示该位置的所有笔记（支持多种分析类型）
4. 提供编辑、删除操作

#### 4.3 笔记管理流程
1. 侧栏默认隐藏
2. 点击下划线文本时显示
3. 点击侧栏外区域或关闭按钮隐藏
4. 支持笔记内容编辑和删除

### 5. 存储方案

#### 5.1 本地存储
- 使用 `localStorage` 存储笔记数据
- 按文档ID分组存储
- 支持数据导入导出

#### 5.2 数据持久化
```typescript
class NoteStorageService {
  private storageKey = 'lexicon-notes';
  
  save(notes: Note[]): void;
  load(): Note[];
  export(): string;
  import(data: string): void;
}
```

### 6. 性能优化策略

#### 6.1 渲染优化
- 使用虚拟滚动处理大量笔记
- 按需加载笔记内容
- 防抖处理文本选择事件

#### 6.2 存储优化
- 增量更新笔记数据
- 定期清理过期笔记
- 压缩存储数据

### 7. 集成方案

#### 7.1 与现有系统集成
- 复用现有的文本选择系统
- 集成到现有的AI分析流程
- 保持现有UI风格一致性

#### 7.2 兼容性考虑
- 支持不同文档格式
- 处理文本位置变化
- 向后兼容现有功能

## 验收标准

### 功能验收
1. ✅ 四种AI分析类型对应四种不同下划线样式
2. ✅ 点击"保存为笔记"后原文正确添加下划线
3. ✅ 点击下划线文本正确显示右侧笔记侧栏
4. ✅ 侧栏支持查看、编辑、删除笔记
5. ✅ 笔记数据正确保存和加载
6. ✅ 多种分析类型的下划线可以叠加显示

### 性能验收
1. ✅ 页面加载时间不超过现有基准的10%
2. ✅ 笔记渲染流畅，无明显卡顿
3. ✅ 存储操作响应时间小于100ms

### 兼容性验收
1. ✅ 不影响现有文本选择功能
2. ✅ 不影响现有AI分析功能
3. ✅ UI风格与现有系统保持一致

## 技术约束

1. **框架约束**: 使用React + TypeScript + Tailwind CSS
2. **存储约束**: 仅使用浏览器本地存储，不涉及服务器
3. **性能约束**: 不影响现有功能的性能表现
4. **兼容性约束**: 保持与现有代码的完全兼容

## 风险评估

### 技术风险
1. **文本位置定位**: 动态内容可能导致位置偏移
2. **下划线叠加**: 多种样式叠加的视觉效果
3. **性能影响**: 大量笔记对页面性能的影响

### 缓解策略
1. 使用相对位置和文本内容双重定位
2. 设计清晰的视觉层次和优先级
3. 实施懒加载和虚拟滚动

## 开发计划

本功能将按照6A工作流的后续阶段进行开发：
- **Architect**: 详细架构设计
- **Atomize**: 任务原子化拆分
- **Approve**: 开发计划审批
- **Automate**: 自动化实现
- **Assess**: 质量评估和验收

所有不确定性已解决，可以进入下一阶段的详细设计。