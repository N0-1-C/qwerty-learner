# Qwerty Learner - Code Wiki

## 1. 项目概述

**Qwerty Learner** 是一款为键盘工作者设计的单词记忆与英语肌肉记忆锻炼软件。它将英语单词的记忆与英语键盘输入的肌肉记忆锻炼相结合，用户在背诵单词的同时巩固键盘输入的肌肉记忆。项目还内置了多种编程语言 API 词库，方便程序员练习工作中常用的单词和 API。

- **项目名称**: qwerty-learner
- **版本**: 0.1.0
- **许可证**: 开源
- **在线访问**: <https://qwerty.kaiyi.cool/>
- **GitHub**: <https://github.com/RealKai42/qwerty-learner>

---

## 2. 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 状态管理 | Jotai (原子化状态) + useImmer (组件内状态) |
| 路由 | React Router DOM v6 |
| 构建工具 | Vite 4 |
| 语言 | TypeScript |
| 样式 | TailwindCSS 3 + CSS Modules |
| UI 组件库 | Radix UI + Headless UI + shadcn/ui 风格 |
| 数据库 | Dexie.js (IndexedDB 封装) |
| 数据请求 | SWR |
| 图表 | ECharts 5 |
| 音频 | Howler.js + use-sound |
| 桌面端 | Tauri (Rust) |
| 代码规范 | ESLint + Prettier + Husky + lint-staged |
| E2E 测试 | Playwright |
| 分析追踪 | Mixpanel + Vercel Analytics |
| 部署 | Vercel / GitHub Pages / Docker (Nginx) |

---

## 3. 项目架构

### 3.1 目录结构总览

```
qwerty-learner/
├── public/                     # 静态资源
│   ├── dicts/                  # 词库 JSON 文件（300+ 词库）
│   └── sounds/                 # 音效资源
│       └── key-sound/          # 机械键盘音效
├── src/                        # 源代码
│   ├── @types/                 # 全局类型声明
│   ├── assets/                 # 图片、SVG 等资源
│   ├── components/             # 全局通用组件
│   ├── constants/              # 常量定义
│   ├── hooks/                  # 全局自定义 Hooks
│   ├── pages/                  # 页面模块
│   │   ├── Analysis/           # 数据分析页
│   │   ├── ErrorBook/          # 错题本页
│   │   ├── FriendLinks/        # 友情链接页
│   │   ├── Gallery-N/          # 词库选择页（新版）
│   │   ├── Mobile/             # 移动端提示页
│   │   └── Typing/             # 打字练习页（核心）
│   ├── resources/              # 词库与音效资源配置
│   ├── store/                  # 全局状态（Jotai Atoms）
│   ├── typings/                # 类型定义
│   ├── utils/                  # 工具函数
│   │   ├── db/                 # IndexedDB 数据库模块
│   │   └── sounds/             # 音效工具
│   ├── index.css               # 全局样式
│   ├── index.tsx               # 应用入口
│   └── vite-env.d.ts           # Vite 环境类型
├── src-tauri/                  # Tauri 桌面端配置
├── tests/                      # E2E 测试
├── scripts/                    # 安装/预检脚本
└── 配置文件                     # vite.config.ts, tsconfig.json, tailwind.config.js 等
```

### 3.2 架构分层

```
┌──────────────────────────────────────────────────┐
│                    页面层 (Pages)                  │
│  Typing / Gallery-N / Analysis / ErrorBook / ... │
├──────────────────────────────────────────────────┤
│                  组件层 (Components)               │
│  WordPanel / ResultScreen / Setting / Header /..│
├──────────────────────────────────────────────────┤
│                  状态层 (Store)                    │
│  Jotai Atoms (全局) + useImmer (页面内)           │
├──────────────────────────────────────────────────┤
│                  数据层 (Utils/DB)                 │
│  Dexie.js (IndexedDB) / SWR / Fetch              │
├──────────────────────────────────────────────────┤
│                  资源层 (Resources)                │
│  词库配置 / 音效配置 / 静态资源                    │
└──────────────────────────────────────────────────┘
```

### 3.3 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `TypingPage` | 打字练习主页（默认页） |
| `/gallery` | `GalleryPage` | 词库选择页 |
| `/analysis` | `AnalysisPage` | 数据分析页 |
| `/error-book` | `ErrorBook` | 错题本页 |
| `/friend-links` | `FriendLinks` | 友情链接页 |
| `/mobile` | `MobilePage` | 移动端提示页 |

> 移动端（宽度 ≤ 600px）自动重定向到 `/mobile`。

---

## 4. 核心模块详解

### 4.1 入口与路由 (`src/index.tsx`)

应用入口文件，职责包括：

- **Mixpanel 初始化**: 生产环境与开发环境使用不同的 token
- **暗色模式**: 通过 `isOpenDarkModeAtom` 控制 `dark` class 的添加/移除
- **移动端检测**: 监听窗口宽度，≤ 600px 时重定向至 `/mobile`
- **路由配置**: 使用 `BrowserRouter` + `Suspense` + `lazy` 实现路由懒加载
- **Vercel Analytics**: 嵌入分析组件

```typescript
// 关键逻辑
const isMobile = window.innerWidth <= 600
// GitHub Pages 部署时需要 basename
<BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
```

### 4.2 全局状态管理 (`src/store/`)

项目使用 **Jotai** 作为全局状态管理方案，采用原子化（Atom）设计模式。

#### 核心 Atoms

| Atom 名称 | 类型 | 说明 |
|-----------|------|------|
| `currentDictIdAtom` | `atomWithStorage` | 当前选中的词库 ID，默认 `'cet4'` |
| `currentDictInfoAtom` | 派生 Atom | 当前词库的完整信息（从 `idDictionaryMap` 查找） |
| `currentChapterAtom` | `atomWithStorage` | 当前章节索引，默认 `0` |
| `loopWordConfigAtom` | `atomForConfig` | 单词循环次数配置（1/3/5/8/∞） |
| `keySoundsConfigAtom` | `atomForConfig` | 键盘音效配置（开关、音量、音效资源） |
| `hintSoundsConfigAtom` | `atomForConfig` | 提示音效配置（正确/错误音效） |
| `pronunciationConfigAtom` | `atomForConfig` | 发音配置（开关、音量、类型、语速等） |
| `fontSizeConfigAtom` | `atomForConfig` | 字体大小配置（外文/翻译） |
| `randomConfigAtom` | `atomForConfig` | 随机模式配置 |
| `phoneticConfigAtom` | `atomForConfig` | 音标显示配置 |
| `wordDictationConfigAtom` | `atomForConfig` | 默写模式配置 |
| `isOpenDarkModeAtom` | `atomWithStorage` | 暗色模式开关 |
| `isIgnoreCaseAtom` | `atomWithStorage` | 忽略大小写 |
| `isShowPrevAndNextWordAtom` | `atomWithStorage` | 显示上/下一个单词 |
| `reviewModeInfoAtom` | 自定义 Atom | 复习模式信息（含自动持久化到 IndexedDB） |
| `infoPanelStateAtom` | `atom` | 信息面板状态（捐赠/VSC/社区/小红书） |

#### `atomForConfig` 工具函数

```typescript
// src/store/atomForConfig.ts
function atomForConfig<T extends Record<string, unknown>>(key: string, defaultValue: T): WritableAtom<T, ...>
```

- 基于 `atomWithStorage` 封装，自动将配置持久化到 `localStorage`
- **属性补全机制**: 当配置对象缺少属性时，自动合并默认值，确保向后兼容
- **类型校验**: 当存储的类型与默认值类型不匹配时，回退到默认值

#### `reviewInfoAtom` 工厂函数

```typescript
// src/store/reviewInfoAtom.ts
function reviewInfoAtom(initialValue: TReviewInfoAtomData): Atom
```

- 复习模式状态管理
- 更新 `reviewRecord` 时自动调用 `putWordReviewRecord()` 持久化到 IndexedDB

### 4.3 打字练习模块 (`src/pages/Typing/`)

这是项目的**核心模块**，负责单词输入、计时、统计等核心逻辑。

#### 4.3.1 状态管理 (`Typing/store/`)

**TypingState** 数据结构：

```typescript
type TypingState = {
  chapterData: ChapterData    // 章节数据
  timerData: TimerData        // 计时数据
  isTyping: boolean           // 是否正在输入
  isFinished: boolean         // 是否完成章节
  isShowSkip: boolean         // 是否显示跳过按钮
  isTransVisible: boolean     // 翻译是否可见
  isLoopSingleWord: boolean   // 是否循环当前单词
  isSavingRecord: boolean     // 是否正在保存记录
}
```

**ChapterData** 数据结构：

```typescript
type ChapterData = {
  words: WordWithIndex[]      // 当前章节的单词列表
  index: number               // 当前单词索引
  wordCount: number           // 输入的单词数
  correctCount: number        // 正确次数
  wrongCount: number          // 错误次数
  userInputLogs: UserInputLog[] // 每个单词的输入记录
  wordRecordIds: number[]     // 单词记录 ID 列表
}
```

**Action 类型** (`TypingStateActionType` 枚举)：

| Action | 说明 |
|--------|------|
| `SETUP_CHAPTER` | 初始化章节（支持随机排序和指定起始索引） |
| `SET_IS_TYPING` | 设置输入状态 |
| `TOGGLE_IS_TYPING` | 切换输入状态 |
| `REPORT_CORRECT_WORD` | 报告正确输入 |
| `REPORT_WRONG_WORD` | 报告错误输入（含字母级错误记录） |
| `NEXT_WORD` | 切换到下一个单词 |
| `LOOP_CURRENT_WORD` | 循环当前单词 |
| `FINISH_CHAPTER` | 完成章节 |
| `SKIP_WORD` | 跳过当前单词 |
| `REPEAT_CHAPTER` | 重复当前章节 |
| `NEXT_CHAPTER` | 进入下一章节 |
| `TICK_TIMER` | 计时器递增（同时计算正确率和 WPM） |
| `TOGGLE_TRANS_VISIBLE` | 切换翻译可见性 |

**Reducer 实现**: 使用 `useImmer` 的 reducer 模式，支持直接修改 state（immer 代理），部分 action 返回新 state 对象。

**Context**: 通过 `TypingContext` 在组件树中传递 `{ state, dispatch }`。

#### 4.3.2 核心组件

**TypingPage** (`pages/Typing/index.tsx`)
- 主页面组件，整合所有子组件
- 管理词库加载、章节切换、计时器等核心逻辑
- 使用 `useImmerReducer` 管理页面状态

**WordPanel** (`pages/Typing/components/WordPanel/index.tsx`)
- 核心输入面板，展示当前单词及输入状态
- 根据语言类型选择不同的输入处理器
- 管理单词进度、跳过逻辑

**InputHandler** (`WordPanel/components/InputHandler/index.tsx`)
- 输入处理器路由组件
- 根据词库语言类型选择 `KeyEventHandler` 或 `TextAreaHandler`

**KeyEventHandler** (`WordPanel/components/KeyEventHandler/index.tsx`)
- 键盘事件处理器
- 监听 `keydown` 事件，处理英文/德语等直接键盘输入
- 使用 `react-hotkeys-hook` 管理快捷键

**TextAreaHandler** (`WordPanel/components/TextAreaHandler/index.tsx`)
- 文本框输入处理器
- 适用于编程 API、罗马音等非直接键盘输入场景

**Word** (`WordPanel/components/Word/index.tsx`)
- 单词展示与输入反馈组件
- 逐字母渲染，显示正确/错误状态
- 集成发音图标、音标、翻译显示
- 记录字母级错误（`LetterMistakes`）

**ResultScreen** (`pages/Typing/components/ResultScreen/index.tsx`)
- 章节完成后的结果展示
- 显示正确率、WPM、耗时等统计数据
- 提供"继续"、"重复"、"下一章节"、"默写本章"等操作
- 集成 confetti 庆祝动画

**Setting** (`pages/Typing/components/Setting/index.tsx`)
- 设置对话框，包含四个标签页：
  - **音效设置** (`SoundSetting`): 键盘音效、提示音效
  - **高级设置** (`AdvancedSetting`): 随机模式、忽略大小写、循环次数等
  - **显示设置** (`ViewSetting`): 字体大小、音标、翻译等
  - **数据设置** (`DataSetting`): 数据导出/导入

**Speed** (`pages/Typing/components/Speed/index.tsx`)
- 实时显示输入速度（WPM）和正确率

**Progress** (`pages/Typing/components/Progress/index.tsx`)
- 进度条组件，展示当前章节完成百分比

#### 4.3.3 自定义 Hooks

| Hook | 文件 | 说明 |
|------|------|------|
| `useWordList` | `hooks/useWordList.ts` | 获取当前字典和章节的单词列表，处理章节边界 |
| `useConfetti` | `hooks/useConfetti.ts` | 控制完成章节时的 confetti 庆祝动画 |

### 4.4 词库选择模块 (`src/pages/Gallery-N/`)

新版词库选择页面，提供分类浏览、语言切换、章节选择等功能。

#### 核心组件

| 组件 | 说明 |
|------|------|
| `GalleryPage` | 词库主页，整合分类导航与字典列表 |
| `CategoryNavigation` | 分类导航（中国考试、国际考试、青少儿等） |
| `LanguageTabSwitcher` | 语言标签切换（英语、日语、德语等） |
| `Dictionary` / `DictionaryWithoutCover` | 字典卡片展示 |
| `CategoryDicts` | 分类下的字典列表 |
| `DictDetail` | 字典详情页，展示章节列表 |
| `Chapter` | 章节详情，加载并展示章节内容 |
| `ErrorTable` | 错误单词表格展示 |
| `ReviewDetail` | 复习模式详情页 |

#### 自定义 Hooks

| Hook | 说明 |
|------|------|
| `useDictStats` | 获取字典统计数据（单词总数、学习历史等） |
| `useChapterStats` | 获取章节统计数据（正确率、练习时间等） |
| `useErrorWords` | 获取用户错误单词列表 |
| `useRevisionWordCount` | 获取复习单词数量 |

### 4.5 数据分析模块 (`src/pages/Analysis/`)

- 使用 **ECharts** 渲染图表
- 展示用户输入历史、性能统计
- 组件包括：
  - `HeatmapCharts`: 热力图（练习日历）
  - `LineCharts`: 折线图（趋势分析）
  - `KeyboardWithBarCharts`: 键盘热力图（字母错误分布）
- 使用 `react-activity-calendar` 展示活动日历

### 4.6 错题本模块 (`src/pages/ErrorBook/`)

- 展示用户学习中出错的单词
- 支持导出功能（`DropdownExport`）
- 使用 `@tanstack/react-table` 展示数据表格
- 支持分页（`Pagination`）、行详情（`RowDetail`）
- 状态管理：独立的 store（`ErrorBook/store/index.ts`）

### 4.7 数据库模块 (`src/utils/db/`)

使用 **Dexie.js** 封装 IndexedDB，实现本地数据持久化。

#### 数据库结构 (`RecordDB`)

| 表名 | 索引 | 说明 |
|------|------|------|
| `wordRecords` | `++id, word, timeStamp, dict, chapter, wrongCount, [dict+chapter]` | 单词输入记录 |
| `chapterRecords` | `++id, timeStamp, dict, chapter, time, [dict+chapter]` | 章节练习记录 |
| `reviewRecords` | `++id, dict, createTime, isFinished` | 复习记录 |

#### 数据模型

**WordRecord** - 单词输入记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `word` | `string` | 单词文本 |
| `timeStamp` | `number` | UTC 时间戳 |
| `dict` | `string` | 词库 ID |
| `chapter` | `number \| null` | 章节号（错题场景为 null） |
| `timing` | `number[]` | 每个字母的输入时间差 |
| `wrongCount` | `number` | 错误次数 |
| `mistakes` | `LetterMistakes` | 字母级错误记录 |

**ChapterRecord** - 章节练习记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `dict` | `string` | 词库 ID |
| `chapter` | `number \| null` | 章节号 |
| `time` | `number` | 耗时（秒） |
| `correctCount` | `number` | 正确按键次数 |
| `wrongCount` | `number` | 错误按键次数 |
| `wordCount` | `number` | 输入的单词总数 |
| `correctWordIndexes` | `number[]` | 一次打对的单词索引 |
| `wpm` | `number` | 计算属性：每分钟单词数 |
| `inputAccuracy` | `number` | 计算属性：输入正确率 |
| `wordAccuracy` | `number` | 计算属性：单词正确率 |

**ReviewRecord** - 复习记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `dict` | `string` | 词库 ID |
| `index` | `number` | 当前练习进度 |
| `createTime` | `number` | 创建时间 |
| `isFinished` | `boolean` | 是否已完成 |
| `words` | `Word[]` | 复习单词列表 |

#### 核心 Hooks

| Hook | 说明 |
|------|------|
| `useSaveChapterRecord` | 保存章节练习记录到 IndexedDB |
| `useSaveWordRecord` | 保存单词输入记录（含字母时间差和错误记录） |
| `useDeleteWordRecord` | 删除指定单词的记录 |

#### 数据导出 (`data-export.ts`)

- 使用 `dexie-export-import` 导出数据库
- 使用 `pako` 进行 gzip 压缩
- 使用 `file-saver` 触发浏览器下载

### 4.8 资源配置模块 (`src/resources/`)

#### 词库配置 (`dictionary.ts`)

定义了 300+ 词库的元信息，每个词库项包含：

```typescript
type DictionaryResource = {
  id: string                    // 词库唯一标识（对应 JSON 文件名）
  name: string                  // 词库名称
  description: string           // 词库描述
  category: string              // 分类（中国考试/国际考试/青少儿/编程等）
  tags: string[]                // 标签
  url: string                   // JSON 文件路径
  length: number                // 单词总数
  language: LanguageType        // 语言类型
  languageCategory: LanguageCategoryType // 语言分类
  defaultPronIndex?: number     // 默认发音索引
}
```

词库分类包括：
- **中国考试**: CET-4, CET-6, 考研, 专四, 专八, 高考, 中考 等
- **国际考试**: IELTS, TOEFL, GRE, GMAT, SAT, PTE 等
- **青少儿英语**: RAZ, 人教版, 外研社 等
- **编程字典**: JavaScript, Python, Java, Go, Rust, Linux, SQL 等
- **多语言**: 日语 N1-N5, 德语, 哈萨克语, 印尼语 等

#### 音效配置 (`soundResource.ts`)

- `keySoundResources`: 机械键盘音效列表（通过 `import.meta.glob` 动态扫描 `public/sounds/key-sound/` 目录）
- `wrongSoundResources`: 错误提示音
- `correctSoundResources`: 正确提示音
- `LANG_PRON_MAP`: 各语言的发音配置映射（美音/英音/德语/日语/罗马音等）

### 4.9 类型系统 (`src/typings/`)

#### 核心类型

```typescript
// 单词数据结构
type Word = {
  name: string          // 单词文本
  trans: string[]       // 翻译列表
  usphone: string       // 美式音标
  ukphone: string       // 英式音标
  notation?: string     // 特殊标注
}

// 带索引的单词
type WordWithIndex = Word & { index: number }

// 语言类型
type LanguageType = 'en' | 'romaji' | 'zh' | 'ja' | 'code' | 'de' | 'kk' | 'hapin' | 'id'
type LanguageCategoryType = 'en' | 'ja' | 'de' | 'code' | 'kk' | 'id'

// 发音类型
type PronunciationType = 'us' | 'uk' | 'romaji' | 'zh' | 'ja' | 'de' | 'hapin' | 'kk' | 'id'

// 音标类型
type PhoneticType = 'us' | 'uk' | 'romaji' | 'zh' | 'ja' | 'de' | 'hapin' | 'kk' | 'id'

// 默写模式类型
type WordDictationType = 'hideAll' | 'hideVowel' | 'hideConsonant' | 'randomHide'

// 循环次数选项
type LoopWordTimesOption = 1 | 3 | 5 | 8 | Number.MAX_SAFE_INTEGER
```

### 4.10 工具函数 (`src/utils/`)

| 函数 | 文件 | 说明 |
|------|------|------|
| `isLegal(key)` | `index.ts` | 判断按键是否为合法输入键（排除功能键、方向键等） |
| `isChineseSymbol(val)` | `index.ts` | 判断是否为中文标点符号 |
| `IsDesktop()` | `index.ts` | 判断是否为桌面端浏览器 |
| `IS_MAC_OS` | `index.ts` | 是否为 macOS 系统 |
| `addHowlListener(howl, ...)` | `index.ts` | 为 Howl 实例添加监听器，返回取消函数 |
| `classNames(...)` | `index.ts` | 类名拼接工具 |
| `getCurrentDate()` | `index.ts` | 获取当前日期字符串（YYYYMMDD） |
| `calcChapterCount(length)` | `index.ts` | 计算章节数（`Math.ceil(length / 20)`） |
| `getUTCUnixTimestamp()` | `index.ts` | 获取 UTC Unix 时间戳（秒） |
| `timeStamp2String(ts)` | `index.ts` | 时间戳转可读字符串 |
| `wordListFetcher(url)` | `wordListFetcher.ts` | 通过 fetch 加载词库 JSON 数据 |
| `shuffle(array)` | `shuffle.ts` | Fisher-Yates 洗牌算法 |
| `clamp(value, min, max)` | `clamp.ts` | 数值范围限制 |
| `groupBy(array, key)` | `groupBy.ts` | 数组分组 |
| `range(start, end)` | `range.ts` | 生成数字范围数组 |
| `noop()` | `noop.ts` | 空函数 |
| `mergeLetterMistake(a, b)` | `db/utils.ts` | 合并字母错误记录 |
| `exportDB(progressCallback)` | `db/data-export.ts` | 导出数据库为 gzip 压缩文件 |

### 4.11 全局自定义 Hooks (`src/hooks/`)

| Hook | 说明 |
|------|------|
| `usePronunciation` | 单词发音控制，集成 Howler.js，支持美音/英音切换 |
| `useSpeech` | 语音合成（Web Speech API），用于翻译朗读 |
| `useKeySounds` | 键盘音效控制，管理按键音、正确音、错误音 |
| `useIntersectionObserver` | Intersection Observer 封装，用于懒加载 |
| `useWindowSize` | 窗口尺寸监听 |

### 4.12 全局通用组件 (`src/components/`)

| 组件 | 说明 |
|------|------|
| `Layout` | 页面布局容器 |
| `Header` | 顶部导航栏（词库切换、设置入口等） |
| `Footer` | 底部信息栏 |
| `Drawer` | 抽屉组件 |
| `Loading` | 加载状态组件 |
| `InfoPanel` | 信息面板（捐赠、VSCode 插件、社区等提示） |
| `DonateCard` | 捐赠卡片 |
| `DonatingCard` | 捐赠交互卡片（含金额选择和二维码） |
| `StarCard` | GitHub Star 卡片 |
| `Tooltip` | 提示工具 |
| `EnhancedPromotionModal` | 增强版推广弹窗 |
| `WordPronunciationIcon` | 单词发音图标（音量/声波图标） |
| `ui/*` | 基础 UI 组件库（Button, Dialog, Tabs, Table, Alert 等） |

---

## 5. 数据流

### 5.1 打字练习核心数据流

```
用户键盘输入
    │
    ▼
KeyEventHandler / TextAreaHandler
    │
    ▼
Word 组件（逐字母匹配）
    │
    ├── 正确 → dispatch(REPORT_CORRECT_WORD) → 更新 correctCount
    │
    └── 错误 → dispatch(REPORT_WRONG_WORD) → 更新 wrongCount + LetterMistakes
    │
    ▼
单词完成 → dispatch(NEXT_WORD) / dispatch(FINISH_CHAPTER)
    │
    ├── 保存 WordRecord → useSaveWordRecord() → IndexedDB
    │
    └── 章节完成 → 保存 ChapterRecord → useSaveChapterRecord() → IndexedDB
                    │
                    ▼
              ResultScreen（展示统计结果）
```

### 5.2 词库加载数据流

```
GalleryPage（词库选择）
    │
    ▼
用户选择词库 → currentDictIdAtom 更新
    │
    ▼
currentDictInfoAtom（派生）→ 获取词库信息
    │
    ▼
DictDetail → 展示章节列表
    │
    ▼
用户选择章节 → currentChapterAtom 更新
    │
    ▼
TypingPage → useWordList() → wordListFetcher(url) → fetch JSON
    │
    ▼
dispatch(SETUP_CHAPTER) → 初始化 TypingState
```

### 5.3 配置持久化数据流

```
用户修改设置
    │
    ▼
atomForConfig 包装的 Atom 更新
    │
    ▼
atomWithStorage → localStorage 自动持久化
    │
    ▼
组件通过 useAtomValue / useSetAtom 响应更新
```

---

## 6. 依赖关系

### 6.1 核心依赖关系图

```
React
├── react-router-dom          # 路由
├── jotai                     # 全局状态管理
│   └── atomWithStorage       # localStorage 持久化
├── use-immer                 # 不可变状态更新
├── swr                       # 数据请求
├── dexie                     # IndexedDB
│   ├── dexie-export-import   # 数据库导入导出
│   └── dexie-react-hooks     # React 集成
├── howler                    # 音频播放
│   └── use-sound             # React Hook 封装
├── echarts                   # 图表
├── canvas-confetti           # 庆祝动画
├── mixpanel-browser          # 用户行为分析
├── @vercel/analytics         # Vercel 分析
├── @radix-ui/*               # 无障碍 UI 原语
├── @headlessui/react         # 无样式 UI 组件
├── @tanstack/react-table     # 表格
├── file-saver                # 文件下载
├── pako                      # gzip 压缩
├── xlsx                      # Excel 导出
├── dayjs                     # 日期处理
├── html-to-image             # HTML 转图片（分享功能）
├── react-activity-calendar   # 活动日历
├── embla-carousel-react      # 轮播组件
└── lucide-react              # 图标库
```

### 6.2 模块间依赖

```
pages/Typing ──→ store/ (全局 Atoms)
              ──→ utils/db/ (数据持久化)
              ──→ resources/ (词库/音效配置)
              ──→ hooks/ (全局 Hooks)
              ──→ components/ (通用组件)

pages/Gallery-N ──→ store/ (词库/章节选择)
                 ──→ utils/db/ (统计数据)

pages/Analysis ──→ utils/db/ (历史数据查询)

pages/ErrorBook ──→ utils/db/ (错词记录)
                 ──→ store/ (词库信息)
```

---

## 7. 构建与运行

### 7.1 环境要求

- **Node.js** (推荐 v18+)
- **Yarn** (包管理器)
- **Git**

### 7.2 开发运行

```bash
# 克隆项目
git clone https://github.com/RealKai42/qwerty-learner.git
cd qwerty-learner

# 安装依赖
yarn install

# 启动开发服务器
yarn start
# 或
yarn dev

# 访问 http://localhost:5173/
```

### 7.3 构建生产版本

```bash
yarn build
# 输出目录: build/
# 使用 cross-env CI=false 避免 CI 环境下的警告视为错误
```

### 7.4 Docker 部署

```bash
# 构建并运行
docker-compose up -d
```

Docker 构建流程：
1. Node.js 20 镜像中执行 `npm install` + `npm run build`
2. 将构建产物复制到 Nginx Alpine 镜像
3. 使用自定义 Nginx 配置 (`public/default.conf`)

### 7.5 Vercel 部署

1. 点击 [Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRealKai42%2Fqwerty-learner)
2. 更新 Build Settings → Output Directory 为 `"build"`
3. 点击 Deploy

### 7.6 Tauri 桌面端

```bash
# 需要 Rust 环境
cd src-tauri
cargo tauri dev    # 开发模式
cargo tauri build  # 构建桌面应用
```

配置文件: `src-tauri/tauri.conf.json`
- 窗口尺寸: 800 × 600
- 标识符: `com.litongjava.qwerty.learner`

### 7.7 NPM Scripts

| 命令 | 说明 |
|------|------|
| `yarn dev` / `yarn start` | 启动 Vite 开发服务器 |
| `yarn build` | 构建生产版本 |
| `yarn lint` | ESLint 代码检查 |
| `yarn prettier` | Prettier 格式化 |
| `yarn test:e2e` | 运行 Playwright E2E 测试 |
| `yarn prepare` | 安装 Husky Git Hooks |

---

## 8. Vite 构建配置要点

```typescript
// vite.config.ts 关键配置
{
  plugins: [
    react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
    visualizer(),           // 打包分析
    Icons({ compiler: 'jsx', jsx: 'react' }), // 图标自动导入
  ],
  build: {
    minify: true,
    outDir: 'build',
    sourcemap: false,
  },
  esbuild: {
    drop: mode === 'development' ? [] : ['console', 'debugger'], // 生产环境移除 console
  },
  define: {
    REACT_APP_DEPLOY_ENV: JSON.stringify(process.env.REACT_APP_DEPLOY_ENV),
    LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash), // 注入 Git commit hash
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }, // @ 路径别名
  },
  css: {
    modules: { localsConvention: 'camelCaseOnly' }, // CSS Modules 驼峰命名
  },
}
```

---

## 9. 代码规范

- **ESLint**: 使用 `eslint-config-react-app` + `eslint-config-prettier`
- **Prettier**: 集成 `prettier-plugin-tailwindcss` + `@trivago/prettier-plugin-sort-imports`（自动排序 import）
- **Husky**: `pre-commit` Hook 触发 `lint-staged`
- **lint-staged**: 对 `src/**/*.{js,jsx,ts,tsx,json,css,scss,md}` 执行 `prettier --write`
- **TypeScript**: 严格模式 (`strict: true`)，目标 ES5

---

## 10. 测试

### E2E 测试 (Playwright)

测试文件位于 `tests/e2e/` 目录：

| 文件 | 测试内容 |
|------|---------|
| `main.spec.ts` | 主页面基本功能 |
| `dictionary.spec.ts` | 词库选择功能 |
| `practice.spec.ts` | 打字练习功能 |
| `practice-list.spec.ts` | 练习列表功能 |
| `theme.spec.ts` | 主题切换功能 |

运行测试:

```bash
yarn test:e2e
```

---

## 11. 多语言支持

项目支持多种语言的词库和发音：

| 语言 | 语言类型标识 | 发音类型 |
|------|------------|---------|
| 英语 | `en` | 美音 (`us`) / 英音 (`uk`) |
| 日语 | `ja` | 日语 (`ja`) |
| 德语 | `de` | 德语 (`de`) |
| 哈萨克语 | `kk` / `hapin` | 哈萨克语 (`kk`) / 哈拼 (`hapin`) |
| 印尼语 | `id` | 印尼语 (`id`) |
| 中文 | `zh` | 普通话 (`zh`) |
| 编程 | `code` | 美音 (`us`) / 英音 (`uk`) |
| 罗马音 | `romaji` | 罗马音 (`romaji`) |

不同语言类型会影响输入处理方式：
- `en` / `de`: 使用 `KeyEventHandler`（键盘直接输入）
- `code` / `romaji` / 其他: 使用 `TextAreaHandler`（文本框输入）

---

## 12. 关键设计决策

1. **原子化状态管理**: 选择 Jotai 而非 Redux，因为状态分散且独立，原子化模式更轻量
2. **Immer Reducer**: 打字练习页面使用 `useImmerReducer`，简化复杂状态的不可变更新
3. **IndexedDB 而非后端**: 使用 Dexie.js 在客户端存储所有用户数据，无需后端服务
4. **词库静态化**: 词库以 JSON 文件存储在 `public/dicts/`，通过 fetch 按需加载
5. **CSS Modules + TailwindCSS**: 混合使用，TailwindCSS 用于快速布局，CSS Modules 用于组件级样式隔离
6. **路径别名**: `@/` 映射到 `src/`，简化导入路径
7. **懒加载**: `AnalysisPage` 和 `GalleryPage` 使用 `React.lazy` 实现路由级代码分割
