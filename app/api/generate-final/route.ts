import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

/**
 * 一步到位：产品抠图 + 卖点 → Gemini 直接生成带文字标注的成品电商图
 *
 * 输入:
 *   - cutoutImage: 抠图后的透明产品图 (base64)
 *   - mainTitle: 主标题
 *   - category: 品类
 *   - sellingPoints: 卖点列表 [{ headline, subtitle }]
 *   - sceneHint: 可选的场景提示
 *
 * 输出:
 *   - imageBase64: 完成品图 (带文字标注的最终图)
 */
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { cutoutImage, mainTitle, category, sellingPoints, sceneHint } =
      await request.json();

    if (!cutoutImage) {
      return NextResponse.json({ error: 'cutoutImage is required' }, { status: 400 });
    }

    // ── 构建生图 Prompt ──
    const spText = (sellingPoints || [])
      .map(
        (sp: any, i: number) =>
          `  ${i + 1}. 「${sp.headline}」— ${sp.subtitle}`
      )
      .join('\n');

    const sceneDesc =
      sceneHint ||
      getSceneByCategory(category || 'default');

    const prompt = `Generate an image:

Create a professional e-commerce product detail image (电商卖点图) with the following requirements:

## Product & Scene
- Place the provided product photo naturally onto this scene: ${sceneDesc}
- The product should be centered and prominent, occupying about 40-50% of the image

## Title
- Display the main title 「${mainTitle}」 at the top center of the image
- Use a pill-shaped dark semi-transparent background behind the title
- Title font: bold, white, large, clean sans-serif

## Selling Point Callouts
Arrange the following selling points around the product with thin leader lines (arrows) pointing to relevant product areas:

${spText}

## Layout Rules
- Distribute callout labels evenly on the LEFT and RIGHT sides of the product
- Each callout should be in a small rounded pill-shaped box with white background
- Draw thin lines from each callout box to the corresponding part of the product
- Callouts must NOT overlap with each other or with the product
- The overall design should look like a professional e-commerce product detail page (电商详情图)

## Style
- Professional commercial photography style
- Clean, modern typography (Chinese text use PingFang SC style)
- High contrast for readability
- 800x800 pixels, square format
- Overall aesthetic: premium, Apple-like product launch quality`;

    // ── 调用 Gemini 生图 ──
    const base64Data = cutoutImage.replace(/^data:image\/\w+;base64,/, '');

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
                  mimeType: 'image/png',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini final generation error:', errorText);
      return NextResponse.json(
        { error: `Gemini error: ${geminiResponse.status}`, detail: errorText },
        { status: 502 }
      );
    }

    const result = await geminiResponse.json();
    const parts = result.candidates?.[0]?.content?.parts || [];

    // 提取生成的图片
    const imagePart = parts.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (imagePart) {
      const imgBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;

      // 提取文本反馈 (如果有)
      const textPart = parts.find((p: any) => p.text);

      return NextResponse.json({
        imageBase64: `data:${mimeType};base64,${imgBase64}`,
        feedback: textPart?.text || null,
        success: true,
      });
    }

    // 没有返回图片
    const textPart = parts.find((p: any) => p.text);
    return NextResponse.json({
      imageBase64: null,
      success: false,
      feedback: textPart?.text || 'Gemini did not return an image',
    });
  } catch (err: any) {
    console.error('Generate final error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** 品类 → 场景描述 */
function getSceneByCategory(category: string): string {
  const scenes: Record<string, string> = {
    watch: 'elegant dark marble surface with soft ambient lighting and bokeh',
    eyewear: 'clean minimalist surface with soft gradient lighting, fashion editorial style',
    phone: 'modern desk with clean gradient background',
    food: 'rustic wooden table with warm natural light',
    cosmetics: 'soft pink gradient background with subtle rose petals',
    clothing: 'clean white lifestyle background with natural shadows',
    kitchen: 'warm kitchen countertop with morning sunlight',
    electronics: 'sleek dark desk with tech-style blue accent lighting',
    default: 'clean professional studio background with soft gradient lighting',
  };
  const key =
    Object.keys(scenes).find((k) => category.toLowerCase().includes(k)) ||
    'default';
  return scenes[key];
}
