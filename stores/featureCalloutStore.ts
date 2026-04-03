import { create } from 'zustand';
import type {
  FeatureCalloutJSON,
  SellingPoint,
  EditableAction,
  PipelineStage,
} from '@/types/featureCallout';

interface FeatureCalloutState {
  stage: PipelineStage;
  stageMessage: string;
  originalImage: string | null;
  cutoutImage: string | null;
  calloutData: FeatureCalloutJSON | null;
  finalImage: string | null;
  editableActions: EditableAction[];
  error: string | null;

  runPipeline: (imageBase64: string) => Promise<void>;
  updateSellingPoint: (id: string, changes: Partial<SellingPoint>) => void;
  updateMainTitle: (title: string) => void;
  regenerate: () => Promise<void>;
  reset: () => void;
}

function buildEditableActions(): EditableAction[] {
  return [
    { id: 'regen_scene', icon: '🎨', label: '换一个风格', description: '更换场景和排版风格，重新 AI 生图', type: 'regenerate_scene' },
    { id: 'edit_copy', icon: '✏️', label: '修改文案后重新生成', description: '编辑卖点文案，然后 AI 重新出图', type: 'edit_copy' },
    { id: 'multilingual', icon: '🌍', label: '生成多语言版本', description: '翻译卖点后重新生成英文/日文版', type: 'multilingual' },
    { id: 'ab_variant', icon: '🔀', label: '生成 A/B 变体', description: '自动生成不同构图的变体图', type: 'ab_variant' },
  ];
}

export const useFeatureCalloutStore = create<FeatureCalloutState>((set, get) => ({
  stage: 'idle',
  stageMessage: '',
  originalImage: null,
  cutoutImage: null,
  calloutData: null,
  finalImage: null,
  editableActions: [],
  error: null,

  runPipeline: async (imageBase64: string) => {
    set({ originalImage: imageBase64, error: null, finalImage: null });

    try {
      // ── Step 1: 自动抠图 ──
      set({ stage: 'removing_bg', stageMessage: '正在自动抠除背景...' });
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await fetch(imageBase64).then((r) => r.blob());
      const resultBlob = await removeBackground(blob, {
        output: { format: 'image/png' },
      });
      const cutoutBase64 = await blobToDataUrl(resultBlob);
      set({ cutoutImage: cutoutBase64 });

      // ── Step 2: 品类识别 + 卖点提炼 ──
      set({ stage: 'analyzing', stageMessage: 'AI 正在识别产品特征与卖点...' });
      const analyzeRes = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!analyzeRes.ok) throw new Error(`分析失败: ${analyzeRes.status}`);
      const calloutData: FeatureCalloutJSON = await analyzeRes.json();
      set({ calloutData });

      // ── Step 3: AI 一次性生成带字成品图 (Route 1) ──
      set({ stage: 'generating_scene', stageMessage: 'AI 正在直接生成包含排版标注的成品图...' });
      const finalRes = await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutoutImage: cutoutBase64,
          mainTitle: calloutData.mainTitle,
          category: calloutData.product.category,
          sellingPoints: calloutData.sellingPoints.map((sp) => ({
            headline: sp.headline,
            subtitle: sp.subtitle,
          })),
          sceneHint: calloutData.scenePrompt,
        }),
      });

      if (!finalRes.ok) {
        const errorText = await finalRes.text();
        throw new Error(`成品图生成失败 (${finalRes.status}): ${errorText}`);
      }
      
      const finalData = await finalRes.json();

      if (!finalData.imageBase64) {
         throw new Error(finalData.feedback || '未返回图片');
      }

      set({ finalImage: finalData.imageBase64, stage: 'compositing', stageMessage: '正在渲染到画布...' });
      await renderToCanvas(finalData.imageBase64);
      
      // ── 完成 ──
      set({
        stage: 'done',
        stageMessage: '生成完成！',
        editableActions: buildEditableActions(),
      });
    } catch (err: any) {
      console.error(err);
      set({ stage: 'error', error: err.message, stageMessage: '' });
    }
  },

  updateSellingPoint: (id, changes) => {
    const { calloutData } = get();
    if (!calloutData) return;
    set({
      calloutData: {
        ...calloutData,
        sellingPoints: calloutData.sellingPoints.map((sp) =>
          sp.id === id ? { ...sp, ...changes } : sp
        ),
      },
    });
  },

  updateMainTitle: (title) => {
    const { calloutData } = get();
    if (!calloutData) return;
    set({ calloutData: { ...calloutData, mainTitle: title } });
  },

  /** 重新使用最新的文案去一次性生图 */
  regenerate: async () => {
    const { calloutData, cutoutImage } = get();
    if (!calloutData || !cutoutImage) return;

    set({ stage: 'generating_scene', stageMessage: 'AI 正在重新生成成品图...' });
    try {
      const finalRes = await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutoutImage,
          mainTitle: calloutData.mainTitle,
          category: calloutData.product.category,
          sellingPoints: calloutData.sellingPoints.map((sp) => ({
            headline: sp.headline,
            subtitle: sp.subtitle,
          })),
          sceneHint: calloutData.scenePrompt,
        }),
      });

      if (!finalRes.ok) throw new Error(`重新生成失败: ${finalRes.status}`);
      const finalData = await finalRes.json();

      if (finalData.imageBase64) {
        set({ finalImage: finalData.imageBase64, stage: 'compositing', stageMessage: '正在渲染...' });
        await renderToCanvas(finalData.imageBase64);
        set({ stage: 'done', stageMessage: '重新生成完成！', editableActions: buildEditableActions() });
      } else {
        throw new Error(finalData.feedback || '未返回图片');
      }
    } catch (err: any) {
      set({ stage: 'error', error: err.message });
    }
  },

  reset: () => {
    set({
      stage: 'idle', stageMessage: '',
      originalImage: null, cutoutImage: null,
      calloutData: null, finalImage: null,
      editableActions: [], error: null,
    });
  },
}));

/** 将 AI 直出的成品图渲染到 Fabric.js 画布 */
async function renderToCanvas(imageBase64: string) {
  const canvas = (window as any).__canvasEditor?.getCanvas?.();
  if (!canvas) return;

  const { FabricImage } = await import('fabric');
  canvas.clear();

  const img = await FabricImage.fromURL(imageBase64, { crossOrigin: 'anonymous' });
  const canvasW = 800;
  const canvasH = 800;
  canvas.setDimensions({ width: canvasW, height: canvasH });

  const scale = Math.min(canvasW / img.width!, canvasH / img.height!);
  img.set({
    left: canvasW / 2,
    top: canvasH / 2,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
    selectable: true,
  });
  (img as any).id = 'ai_final_image';
  canvas.add(img);
  canvas.renderAll();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
