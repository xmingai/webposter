# WebPoster 技术栈汇总

> AI 驱动的无限画布海报编辑器 · **shadcn/ui 迁移已完成**

---

## 预览

````carousel
![空白画布状态](/Users/sgx/.gemini/antigravity/brain/35fc3e07-2332-46e2-8016-68b173b64d81/artifacts/webposter_final.png)
<!-- slide -->
![选中图片 + AI 工具栏](/Users/sgx/.gemini/antigravity/brain/35fc3e07-2332-46e2-8016-68b173b64d81/artifacts/webposter_selected.png)
````

---

## 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | `16.2.1` | App Router, SSR/CSR 混合渲染 |
| **React** | `19.2.4` | UI 渲染引擎 |
| **TypeScript** | `^5` | 类型安全 |

## UI 组件库

| 技术 | 版本 | 用途 |
|------|------|------|
| **shadcn/ui** | `v4.1.1` (base-nova 风格) | 组件系统 — Button, Input, Tooltip, Avatar 等 |
| **@base-ui/react** | `^1.3.0` | 无样式原语（shadcn v4 底层） |
| **class-variance-authority** | `^0.7.1` | 组件变体管理 (CVA) |
| **clsx** + **tailwind-merge** | latest | 条件 className 合并与去重 |
| **tw-animate-css** | `^1.4.0` | shadcn 动画预设 |
| **Lucide React** | `^1.7.0` | 图标库 |

### 已安装的 shadcn 组件

`Button` · `Input` · `Tooltip` · `Separator` · `ScrollArea` · `Badge` · `Avatar`

## 样式方案

| 技术 | 版本 | 用途 |
|------|------|------|
| **TailwindCSS** | `^4` | 主力样式 — 所有组件均使用 Tailwind utilities |
| **CSS Variables (oklch)** | — | 设计 tokens，支持 light/dark 双模式 |

> 项目始终运行在 **dark mode**（`<html class="dark">`），色彩系统使用 oklch 色彩空间。

## 画布引擎

| 技术 | 版本 | 用途 |
|------|------|------|
| **Fabric.js** | `^6.9.1` | 无限画布核心 — 对象操作、序列化、导出 |

### 画布能力

- **无限画布** — 点阵网格背景，`after:render` 实时绘制
- **平移** — `Space + 拖拽` 或鼠标中键
- **缩放** — 滚轮缩放 `0.05x – 10x`，底栏统一显示
- **对象操作** — Image / Textbox / Rect 增删改
- **撤销/重做** — `⌘Z / ⌘⇧Z`，JSON 快照历史栈
- **导出** — `toDataURL()` 2x PNG

## 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| **Zustand** | `^5.0.12` | 全局状态 (工具/选择/缩放/历史) |

## 动画 / 实验

| 技术 | 版本 | 用途 |
|------|------|------|
| **@rive-app/react-canvas** | `^4.27.3` | Rive 动画引擎（已安装，待集成） |
| **SVG + CSS JSX** | — | `/rive-demo` 实验页 |

## 部署

| 平台 | 说明 |
|------|------|
| **Vercel** | 已绑定，GitHub push 自动部署 |

---

## 项目结构

```
webposter/
├── app/
│   ├── globals.css          # TailwindCSS + shadcn tokens (155 行)
│   ├── layout.tsx           # 根布局 (TooltipProvider + dark mode)
│   ├── page.tsx             # 主编辑器页（纯 Tailwind layout）
│   └── rive-demo/page.tsx   # SVG 角色动画实验页
├── components/
│   ├── canvas/
│   │   └── CanvasEditor.tsx # Fabric.js 无限画布 (328 行)
│   ├── sidebar/
│   │   ├── LeftSidebar.tsx  # 工具栏 + 快速素材
│   │   └── RightSidebar.tsx # AI 聊天 + 快捷操作卡片
│   ├── toolbar/
│   │   ├── TopBar.tsx       # 顶栏（品牌 + 状态 + 分享）
│   │   └── BottomToolbar.tsx# 底栏（AI 工具 + 撤销 + 缩放 + 导出）
│   └── ui/                  # ← shadcn 组件目录
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       └── tooltip.tsx
├── lib/
│   └── utils.ts             # cn() 工具函数
├── stores/
│   └── canvasStore.ts       # Zustand
├── components.json          # shadcn 配置
└── package.json
```

## 设计规范

| 属性 | 值 |
|------|------|
| 主色 | Indigo (`#6366f1` → `#818cf8`) |
| 背景层级 | `#111111` → `#141414` → `#1a1a1a` → `#2a2a2a` |
| 文字层级 | `white/90` → `white/50` → `white/30` |
| 边框 | `white/[0.08]` (统一可见度) |
| 圆角 | `rounded-lg` (8px) 为主 |
| 字体 | Geist Sans (via `next/font/google`) |
| 图标 | Lucide, `strokeWidth={1.8}` |

## 功能状态

| 功能 | 状态 |
|------|------|
| 无限画布 + 点阵网格 | ✅ |
| Space 平移 / 滚轮缩放 | ✅ |
| 图片上传 / 文字 / 矩形 | ✅ |
| 撤销 / 重做 | ✅ |
| 导出 PNG | ✅ |
| shadcn/ui 组件迁移 | ✅ |
| Tailwind 样式统一 | ✅ |
| Dark mode 设计系统 | ✅ |
| AI 聊天面板 | 🔶 UI 完成，API 模拟 |
| AI 工具 (去背景 / 超分) | 🔶 UI 完成，功能占位 |
| 快捷操作卡片 | 🔶 UI 完成，点击触发模拟 |
| 模板库 / 素材库 | 🔶 Demo 图片 |
| Rive 动画集成 | 🔶 依赖已安装 |

---

> **环境要求**: Node.js `>= 20.9.0` · 推荐 `nvm use 22`
