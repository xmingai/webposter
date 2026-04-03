import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const LAYOUT_PROMPT = `你是一位专业的电商视觉排版师。我给你一张已经合成好的产品图（产品+背景），以及需要标注的卖点列表。

## 你的任务
请分析这张图，找到最佳的文字放置位置，使标注框：
1. 不遮挡产品主体
2. 不互相重叠
3. 均匀分布在产品周围
4. 箭头锚点精准指向对应的产品部件

## 卖点列表
{SELLING_POINTS}

## 输出格式（严格 JSON，不要 markdown 包裹）
{
  "mainTitle": {
    "text": "主标题文字",
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
      "anchorX": 0.4,
      "anchorY": 0.35
    }
  ]
}

## 坐标说明
- 所有坐标为归一化值 (0-1)，相对于图片宽高
- labelX/labelY 是标注文字框的中心位置
- anchorX/anchorY 是箭头指向的产品部件位置
- 标注框一般放在产品两侧留白区域
- 标题通常在顶部居中 (x≈0.5, y≈0.06-0.10)

## 排版规则
- 必须返回所有卖点的位置，不许省略任何一个！callouts 数组的长度必须等于卖点列表的长度
- 标注框交替分布在产品左右两侧：奇数标注放左侧 (labelX: 0.05-0.22)，偶数标注放右侧 (labelX: 0.78-0.95)
- 相邻标注的 labelY 至少间隔 0.15
- 标注框不要放在图片边缘 (留至少 0.04 的边距)
- 不要把标注放在产品正上方或正下方，应该放在左右两侧`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { compositeImage, mainTitle, sellingPoints } = await request.json();

    if (!compositeImage) {
      return NextResponse.json({ error: 'compositeImage is required' }, { status: 400 });
    }

    // Build selling points description
    const spDesc = sellingPoints
      .map((sp: any, i: number) => `${i + 1}. [${sp.id}] ${sp.headline} — ${sp.subtitle}（目标部件: ${sp.targetDescription || sp.targetId}）`)
      .join('\n');

    const prompt = LAYOUT_PROMPT
      .replace('{SELLING_POINTS}', spDesc);

    const base64Data = compositeImage.replace(/^data:image\/\w+;base64,/, '');

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${prompt}\n\n主标题: ${mainTitle}` },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Layout API error:', errorText);
      return NextResponse.json({ error: `Gemini layout error: ${geminiResponse.status}` }, { status: 502 });
    }

    const result = await geminiResponse.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'No layout response' }, { status: 502 });
    }

    const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const layoutData = JSON.parse(jsonStr);

    return NextResponse.json(layoutData);
  } catch (err: any) {
    console.error('Layout callouts error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
