import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `你是一位资深电商视觉运营专家。请分析这张产品图，返回严格的 JSON。

## 任务
1. 识别产品名称和品类
2. 将产品拆分为 2-4 个视觉上可区分的部件 (subParts)，每个部件给出 bbox
3. 基于你在图中看到的视觉特征，提炼 2-4 个卖点
4. 生成一个 4-6 字的主标题
5. 基于产品品类，推荐一段适合的场景背景描述 (scenePrompt)

## 卖点提炼思路
- 看到水珠/水滴 → 防水/易清洁
- 看到光泽/反光 → 材质高级/工艺精良
- 看到弧线/曲面 → 人体工学/手感好
- 看到纹理/颗粒 → 防滑/质感
- 看到透明/通透 → 纯净/无杂质
- 看到厚实/加固 → 耐用/坚固

## 场景推荐思路
- 厨房用品 → 温暖的厨房台面，自然光
- 电子产品 → 极简桌面，高级质感
- 食品 → 木质桌面，自然装饰
- 化妆品 → 柔和粉色调，花瓣点缀

## 约束
- 卖点必须基于图中可见的特征，不要编造
- bbox 使用归一化坐标 (0-1 范围，相对于图片宽高)
- 每个卖点的 headline 为四字中文短语，subtitle 为补充说明
- 每个卖点必须通过 targetId 绑定到某个 subPart
- scenePrompt 用英文描述，用于生成背景图

## 返回格式（严格 JSON，不要 markdown 包裹）
{
  "product": {
    "name": "产品名称",
    "category": "品类英文",
    "bbox": { "x": 0, "y": 0, "w": 1, "h": 1 }
  },
  "subParts": [
    {
      "id": "part_xxx",
      "description": "部件描述",
      "bbox": { "x": 0.1, "y": 0.5, "w": 0.4, "h": 0.5 }
    }
  ],
  "mainTitle": "主标题",
  "sellingPoints": [
    {
      "id": "sp_1",
      "targetId": "part_xxx",
      "headline": "四字短语",
      "subtitle": "补充说明"
    }
  ],
  "scenePrompt": "Professional product photography on a warm wooden kitchen counter with soft natural morning light, herbs and spices scattered around"
}`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json({ error: `Gemini API error: ${geminiResponse.status}` }, { status: 502 });
    }

    const geminiResult = await geminiResponse.json();
    const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 502 });
    }

    // Parse JSON (strip markdown code fences if present)
    const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const calloutData = JSON.parse(jsonStr);

    return NextResponse.json(calloutData);
  } catch (err: any) {
    console.error('Analyze product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
