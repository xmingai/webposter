import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

/**
 * 生成无文字的干净底图（产品 + 场景 + 光影）
 * 
 * 输入:
 *   - cutoutImage: 抠图后的产品 base64
 *   - category: 品类
 *   - sceneHint: 场景描述
 * 
 * 输出:
 *   - imageBase64: 无文字的产品场景图
 */
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { cutoutImage, category, sceneHint } = await request.json();

    if (!cutoutImage) {
      return NextResponse.json({ error: 'cutoutImage is required' }, { status: 400 });
    }

    const sceneDesc = sceneHint || getSceneByCategory(category || 'default');

    const prompt = `Generate an image:

Place this product naturally into the following scene: ${sceneDesc}

Requirements:
- The product should be centered and prominent, occupying about 40-50% of the image
- Professional commercial photography lighting and shadows
- The product should look natural in the scene with proper reflections and shadows
- DO NOT add any text, labels, titles, callouts, annotations, or watermarks
- DO NOT add any arrows, lines, or pointer elements
- The image should be a clean product scene photo only
- 800x800 pixels, square format
- Premium, Apple-like product photography quality`;

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
      console.error('Gemini base generation error:', errorText);
      return NextResponse.json(
        { error: `Gemini error: ${geminiResponse.status}`, detail: errorText },
        { status: 502 }
      );
    }

    const result = await geminiResponse.json();
    const parts = result.candidates?.[0]?.content?.parts || [];

    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (imagePart) {
      const imgBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;
      return NextResponse.json({
        imageBase64: `data:${mimeType};base64,${imgBase64}`,
        success: true,
      });
    }

    const textPart = parts.find((p: any) => p.text);
    return NextResponse.json({
      imageBase64: null,
      success: false,
      feedback: textPart?.text || 'Gemini did not return an image',
    });
  } catch (err: any) {
    console.error('Generate base error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
  const key = Object.keys(scenes).find((k) => category.toLowerCase().includes(k)) || 'default';
  return scenes[key];
}
