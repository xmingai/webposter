import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * 对已生成的底图做二次 Vision 定位
 * 精确找到产品各部件的像素坐标，用于 Fabric.js 标注定位
 *
 * 输入:
 *   - baseImage: 无文字的底图 base64
 *   - subParts: 产品部件描述列表 [{ id, description }]
 *   - sellingPoints: 卖点列表 [{ id, headline, subtitle, targetId }]
 *   - mainTitle: 主标题
 *
 * 输出:
 *   - layout: { mainTitle: {text, x, y}, callouts: [{id, headline, subtitle, labelX, labelY, anchorX, anchorY}] }
 */
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { baseImage, subParts, sellingPoints, mainTitle } = await request.json();

    if (!baseImage) {
      return NextResponse.json({ error: 'baseImage is required' }, { status: 400 });
    }

    const partsDesc = (subParts || [])
      .map((p: any) => `  - "${p.id}": ${p.description}`)
      .join('\n');

    const spMapping = (sellingPoints || [])
      .map((sp: any) => `  - 卖点 "${sp.id}" (「${sp.headline}」) → 对应部件 "${sp.targetId}"`)
      .join('\n');

    const prompt = `你是一位精准的电商视觉排版师。请分析这张产品场景图，完成以下任务：

## 任务 1: 精确定位产品部件
在图中找到以下部件的中心点坐标（归一化 0-1，相对于图片宽高）:
${partsDesc}

## 任务 2: 计算卖点标注的最佳位置
每个卖点需要指向对应的产品部件:
${spMapping}

## 排版规则
1. 标注框（label）必须放在产品区域外侧，不能遮挡产品
2. 奇数位标注放左侧（labelX ≈ 0.08-0.22），偶数位放右侧（labelX ≈ 0.78-0.92）
3. 标注框纵向均匀分布，从画面上部 25% 到下部 85%
4. 标注间最小纵向间距 ≥ 0.12
5. 引线锚点（anchorX, anchorY）是部件中心点的精确坐标
6. 主标题居中放在画面顶部 (x ≈ 0.5, y ≈ 0.08)

## 返回格式（严格 JSON，不要 markdown 包裹）
{
  "mainTitle": {
    "text": "${mainTitle}",
    "x": 0.5,
    "y": 0.08
  },
  "callouts": [
    {
      "id": "sp_1",
      "headline": "四字标题",
      "subtitle": "补充说明",
      "labelX": 0.15,
      "labelY": 0.3,
      "anchorX": 0.45,
      "anchorY": 0.35
    }
  ]
}`;

    const base64Data = baseImage.replace(/^data:image\/\w+;base64,/, '');

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
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
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini locate-parts error:', errorText);
      return NextResponse.json(
        { error: `Gemini error: ${geminiResponse.status}`, detail: errorText },
        { status: 502 }
      );
    }

    const result = await geminiResponse.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 502 });
    }

    const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const layout = JSON.parse(jsonStr);

    return NextResponse.json({ layout, success: true });
  } catch (err: any) {
    console.error('Locate parts error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
