# 图片转 JSON：语义驱动的 AI 编辑管线

> 整理时间：2026-04-01 | 基于美图设计室逆向 + Stitch 调研 + 技术讨论

---

## 一、核心概念

**一句话定义**：用视觉大模型把一张"不可编辑的像素图"解析为"有结构的语义 JSON"，然后基于 JSON 驱动精准的 AI 编辑。

```
传统方式：用户看图 → 手动画选区 → 写描述 → AI 修改
JSON 方式：AI 看图 → 自动识别所有元素 → 用户点选 → AI 精准修改
```

**本质**：把"人理解图片"的工作交给 AI，把"决定改什么"的权利留给用户。

---

## 二、技术架构：三级管线

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Level 1: 语义理解层（LLM Vision）                        │
│  ─────────────────────────────────                      │
│  输入：任意图片（PNG/JPG）                                │
│  输出：语义 JSON（元素列表 + bbox + 可编辑操作）            │
│  模型：Gemini 2.5 Pro / GPT-4o / Claude                 │
│  耗时：3-5s | 成本：~$0.01/次                            │
│                                                         │
│                        ↓                                │
│                                                         │
│  Level 2: 精确分割层（SAM）                               │
│  ────────────────────────                               │
│  输入：原图 + bbox（来自 Level 1）或用户点击坐标            │
│  输出：像素级精确 Mask                                    │
│  模型：SAM 2（Meta 开源）                                │
│  耗时：~50ms | 成本：极低（可本地部署）                     │
│                                                         │
│                        ↓                                │
│                                                         │
│  Level 3: 精准编辑层（Inpainting）                        │
│  ──────────────────────────────                         │
│  输入：原图 + 精确 Mask + 修改指令                         │
│  输出：只修改目标区域的新图                                │
│  模型：FLUX Fill / SD Inpainting / Imagen 3              │
│  耗时：10-20s | 成本：~$0.03-0.05/次                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 各层分工

| 层级 | 回答的问题 | 不擅长的 |
|------|----------|---------|
| **LLM** | 图里有什么？在哪？能做什么？ | 精确坐标（±50px 偏差） |
| **SAM** | 这个东西的精确边界在哪？ | 不知道"这是什么"（只会抠） |
| **Inpainting** | 如何用新内容替换旧内容？ | 不知道"改哪里"（需要 Mask） |

**三者组合 = 完整的 AI 编辑能力**，缺一不可。

---

## 三、JSON Schema 规范

### 为什么必须约束 Schema？

不同模型自由发挥会导致格式混乱：
- 字段名不统一（`box` / `bounding_box` / `位置`）
- 坐标格式不统一（数组 / 对象 / 自然语言）
- 拆分粒度不统一

**原则：约束格式（Schema），不约束内容（让 LLM 自由识别）**

### 统一 Schema

```json
{
  "canvas": {
    "width": "number // 图片宽度 px",
    "height": "number // 图片高度 px",
    "category": "string // 电商产品图 | 海报 | 艺术摄影 | 社媒图 | 证件照..."
  },
  "elements": [
    {
      "id": "string // 唯一ID，格式：{type}_{3位序号}",
      "type": "string // text | product | character | environment | architecture | decoration | watermark | object",
      "role": "string // subject | background | structure | sceneProp | decoration | watermark",
      "content": "string? // 文字元素的文本内容",
      "description": "string // 视觉描述",
      "bbox": {
        "x": "number", "y": "number",
        "w": "number", "h": "number"
      },
      "style": "object // 视觉属性（颜色/字体/材质等）",
      "subParts": "array? // 子部件，仅当元素有独立可编辑的子区域时使用",
      "zIndex": "number // 层级"
    }
  ],
  "editableActions": [
    {
      "action": "string // 操作名称（换背景/改文字/去水印/换颜色...）",
      "targetId": "string // 对应 element.id",
      "description": "string // 操作说明"
    }
  ]
}
```

### role 枚举定义

| role | 含义 | 编辑策略 |
|------|------|---------|
| `subject` | 画面主体（最不能动的） | 谨慎修改，保持整体形态 |
| `background` | 最底层背景 | 可整体替换 |
| `structure` | 支撑性结构元素 | 可改材质/颜色，不改形状 |
| `sceneProp` | 场景道具 | 可删可换，影响较小 |
| `decoration` | 装饰性元素（印章/图标/涂鸦） | 可删可移位 |
| `watermark` | 水印 | 通常要去除 |

### subParts 使用规则

```
什么时候拆？
  → 当一个元素内部有"可能被独立修改的子区域"

电商产品：按物理部件拆（扇头/杆/底座）
人物：    按身体/服饰拆（头/手臂/身体/衣摆）
海报文字：不拆（标题就是标题）
```

---

## 四、bbox 精度问题与解决方案

### LLM 的 bbox 精度

```
现实情况：
  LLM 返回的 bbox 有 ±50-100px 的偏差
  对于大元素（人物、背景）→ 够用
  对于小元素（Logo、文字）→ 可能偏

原因：
  LLM "看" 图片是语义级的，不是像素级的
  它理解"人物在左半边"，但不能精确到像素
```

### 三级精度方案

```
Level 1: 纯 LLM bbox（矩形，粗略）
  → 用途：前端热区展示、元素列表
  → 精度：±50px

Level 2: LLM bbox → SAM 精细分割
  → 用途：Inpainting Mask
  → 精度：像素级

Level 3: 用户手动 Lasso 校正
  → 用途：SAM 也搞不定的复杂边界
  → 精度：用户决定
```

### 推荐默认流程

```
用户点击元素 → LLM 的 bbox 高亮 → 用户确认
                                     ↓
                               自动调用 SAM
                                     ↓
                               展示精确 Mask → 用户微调（可选）
                                     ↓
                               提交 Inpainting
```

---

## 五、不同图片类型的 JSON 差异

### 实战对比（三类图片）

| 维度 | 海报 | 电商产品图 | 艺术摄影 |
|------|------|----------|---------|
| **主要 type** | text, illustration, decoration | product, scene, watermark | character, environment, architecture |
| **subParts 重点** | 不需要 | 产品物理部件 | 人物身体/服饰区域 |
| **editableActions 重点** | 改文字、换配色、换背景 | 换背景、去水印、改产品颜色 | 换天空、换衣服颜色、加元素 |
| **metadata 重点** | 设计风格、字体、配色板 | 产品品类、拍摄风格 | 构图规则、叙事含义、情绪 |

### category 决定 AI 策略

```json
// 当 category = "电商产品图"
→ editableActions 优先推荐：去水印、换背景、改颜色
→ Inpainting 时保护 subject 不动

// 当 category = "海报"  
→ editableActions 优先推荐：改文字、换风格、换配色
→ 文字元素优先用直接渲染而非 Inpainting

// 当 category = "艺术摄影"
→ editableActions 优先推荐：换天空、换色调、加元素
→ 注意保持构图和视觉张力
```

---

## 六、业务场景映射

### 场景 1：用户上传已有图片想修改

```
用户上传一张从网上找的海报
  → LLM 解析为 JSON → 展示可编辑操作列表
  → 用户选择"改标题文字"
  → SAM 生成文字区域 Mask → Inpainting 重绘
```

**价值**：用户不需要会 PS，直接"点哪改哪"

### 场景 2：AI 生成的海报需要微调

```
WebPoster 用混合路线生成了一张海报
  → 文字层可直接编辑（Fabric.js Textbox）
  → 背景图需要 AI 修改时 → JSON + SAM + Inpainting
```

**价值**：精细编辑和 AI 编辑无缝衔接

### 场景 3：电商批量改图

```
卖家有一张白色款产品图，需要生成黑色款
  → JSON 识别产品 → SAM 抠出产品 → Inpainting 改颜色
  → 批量处理 100 张：同样的 editableAction 自动应用
```

**价值**：从"一张一张改"到"一次改全部"

### 场景 4：智能去水印

```
用户上传带水印的图
  → JSON 自动检测 watermark 元素
  → SAM 精确分割水印区域
  → Inpainting 用背景纹理填充
```

**价值**：一键自动化，不需要手动选区

---

## 七、与竞品的技术对比

```
             图片理解        选区方式         编辑方式
             ─────────       ─────────       ─────────
美图设计室    生成时记录元数据   bbox 预存        端到端 Diffusion（无痕改字）
Photoshop    无语义理解        手动/Sensei AI    图层编辑 + AI 生成式填充
Canva        模板元数据        图层选择          直接编辑图层
             
WebPoster    LLM 语义解析      LLM bbox → SAM   Fabric.js 直编 + Inpainting
(规划)       （适用于任意图片）  （自动+精确）      （混合路线）
```

**WebPoster 的独特优势**：
- 美图只能处理自己生成的图（有预存元数据）
- PS 需要用户手动选区
- **我们可以对"任意上传的图片"做语义理解 + 自动选区 + AI 编辑**

---

## 八、技术栈选型

| 组件 | 推荐方案 | 备选 |
|------|---------|------|
| **图片→JSON** | Gemini 2.5 Pro Vision | GPT-4o, Claude 3.5 |
| **精确分割** | SAM 2 (Meta) | Grounding DINO + SAM |
| **Inpainting** | FLUX Fill (Replicate) | SD Inpainting, Imagen 3 |
| **前端画布** | Fabric.js v6 | — |
| **Mask 生成** | Canvas API (toDataURL) | — |

### 成本估算（单次编辑）

```
LLM 解析：   ~$0.01     （3-5s）
SAM 分割：   ~$0.001    （50ms，可本地部署免费）
Inpainting： ~$0.03-0.05 （10-20s）
──────────────────────────
总计：       ~$0.04-0.06 / 次编辑
```

---

## 九、实施优先级

| 阶段 | 功能 | 价值 | 难度 |
|------|------|------|------|
| **P0** | 图片→JSON 解析（LLM Prompt + Schema） | 整个管线的基础 | 低 |
| **P0** | 前端 bbox 热区展示（Fabric.js 叠加层） | 用户能"看到"可编辑区域 | 低 |
| **P1** | SAM 分割服务部署 | 精确 Mask 生成 | 中 |
| **P1** | Inpainting API 对接 | 实际执行编辑 | 中 |
| **P2** | editableActions 一键执行 | 最终用户体验 | 中 |
| **P2** | 批量操作支持 | 电商场景高频需求 | 高 |
