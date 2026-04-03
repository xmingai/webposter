import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

/** 品类 → 场景映射表 */
const SCENE_PRESETS: Record<string, string[]> = {
  watch: ['marble tabletop with soft ambient lighting', 'dark leather surface with bokeh lights', 'wooden desk with morning sunlight'],
  phone: ['clean white desk with plants', 'modern workspace with coffee cup', 'gradient colorful background'],
  food: ['rustic wooden table with natural props', 'marble kitchen counter with herbs', 'dark moody food photography setup'],
  cosmetics: ['pink gradient with rose petals', 'minimalist white vanity with mirror', 'soft pastel bokeh background'],
  clothing: ['neutral lifestyle flat lay', 'clean white background with shadows', 'outdoor natural lighting scene'],
  kitchen: ['modern kitchen countertop', 'warm home cooking atmosphere', 'clean white marble surface with herbs'],
  default: ['clean gradient background', 'soft studio lighting on neutral surface', 'minimalist product photography backdrop'],
};

function getScenePrompt(category: string, productName: string, customPrompt?: string): string {
  if (customPrompt) return customPrompt;

  const key = Object.keys(SCENE_PRESETS).find((k) => category.toLowerCase().includes(k)) || 'default';
  const presets = SCENE_PRESETS[key];
  const scene = presets[Math.floor(Math.random() * presets.length)];

  return `Professional e-commerce product photography background: ${scene}. Empty scene without any products, suitable for placing a ${productName}. High quality, 4K, commercial photography style. No text, no watermarks.`;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { productName, category, scenePrompt, regenerate } = await request.json();

    const prompt = getScenePrompt(category || 'default', productName || 'product', scenePrompt);

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate an image: ${prompt}`,
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
      console.error('Gemini scene generation error:', errorText);
      
      // Fallback: 返回一个纯色渐变占位
      return NextResponse.json({
        imageBase64: null,
        fallback: true,
        fallbackGradient: getCategoryGradient(category),
        prompt,
      });
    }

    const result = await geminiResponse.json();
    const parts = result.candidates?.[0]?.content?.parts || [];
    
    // 找到图片 part
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    
    if (imagePart) {
      const base64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;
      return NextResponse.json({
        imageBase64: `data:${mimeType};base64,${base64}`,
        fallback: false,
        prompt,
      });
    }

    // 如果没有图片返回，使用 fallback
    return NextResponse.json({
      imageBase64: null,
      fallback: true,
      fallbackGradient: getCategoryGradient(category),
      prompt,
    });
  } catch (err: any) {
    console.error('Generate scene error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** 按品类返回渐变色作为 fallback */
function getCategoryGradient(category: string): { from: string; to: string } {
  const gradients: Record<string, { from: string; to: string }> = {
    watch: { from: '#1a1a2e', to: '#16213e' },
    food: { from: '#f5f0e1', to: '#e8d5b7' },
    cosmetics: { from: '#fce4ec', to: '#f8bbd0' },
    kitchen: { from: '#efebe9', to: '#d7ccc8' },
    default: { from: '#f5f5f5', to: '#e0e0e0' },
  };
  const key = Object.keys(gradients).find((k) => category?.toLowerCase().includes(k)) || 'default';
  return gradients[key];
}
