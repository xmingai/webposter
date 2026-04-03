import { Canvas, FabricImage, Textbox, Rect, Group, Gradient, Line, Triangle } from 'fabric';
import type { FeatureCalloutJSON } from '@/types/featureCallout';

const CANVAS_W = 800;
const CANVAS_H = 800;

/** 文字测量（估算像素宽度） */
function measureText(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += ch.charCodeAt(0) > 127 ? fontSize : fontSize * 0.55;
  }
  return width;
}

/**
 * 创建一条从 (x1,y1) 到 (x2,y2) 的带箭头线
 */
function addArrow(
  canvas: Canvas,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string = 'rgba(60,60,60,0.45)',
  id?: string
) {
  const line = new Line([x1, y1, x2, y2], {
    stroke: color,
    strokeWidth: 1.2,
    selectable: false,
    evented: false,
  });
  (line as any).id = id ? `line_${id}` : undefined;
  canvas.add(line);

  // 小圆点在锚点端
  const dot = new Rect({
    left: x2 - 3,
    top: y2 - 3,
    width: 6,
    height: 6,
    rx: 3,
    ry: 3,
    fill: color,
    selectable: false,
    evented: false,
  });
  (dot as any).id = id ? `dot_${id}` : undefined;
  canvas.add(dot);
}

/**
 * Phase 1: 合成产品 + 背景（不含标注），返回合成图的 data URL
 * 供 Phase 2 送回 VLM 做精准定位
 */
export async function compositeBase(
  canvas: Canvas,
  cutoutImage: string,
  sceneImage: string | null,
  fallbackGradient?: { from: string; to: string }
): Promise<string> {
  canvas.clear();
  canvas.setDimensions({ width: CANVAS_W, height: CANVAS_H });

  // 背景
  if (sceneImage) {
    try {
      const bgImg = await FabricImage.fromURL(sceneImage, { crossOrigin: 'anonymous' });
      const bgScale = Math.max(CANVAS_W / bgImg.width!, CANVAS_H / bgImg.height!);
      bgImg.set({
        left: CANVAS_W / 2, top: CANVAS_H / 2,
        originX: 'center', originY: 'center',
        scaleX: bgScale, scaleY: bgScale,
        selectable: false, evented: false,
      });
      (bgImg as any).id = 'scene_background';
      canvas.add(bgImg);
    } catch {
      applyGradientBg(canvas, fallbackGradient);
    }
  } else {
    applyGradientBg(canvas, fallbackGradient);
  }

  // 产品居中
  const productImg = await FabricImage.fromURL(cutoutImage, { crossOrigin: 'anonymous' });
  const maxSize = CANVAS_W * 0.52;
  const pScale = maxSize / Math.max(productImg.width!, productImg.height!);
  productImg.set({
    left: CANVAS_W / 2, top: CANVAS_H / 2 + 15,
    originX: 'center', originY: 'center',
    scaleX: pScale, scaleY: pScale,
    selectable: true,
  });
  (productImg as any).id = 'product_foreground';
  canvas.add(productImg);
  canvas.renderAll();

  // 导出合成图
  return canvas.toDataURL({ format: 'jpeg', quality: 0.85, multiplier: 1 });
}

/** VLM 精准定位返回的布局数据 */
export interface LayoutPlacement {
  mainTitle: { text: string; x: number; y: number };
  callouts: Array<{
    id: string;
    headline: string;
    subtitle: string;
    /** 标注框位置 (归一化 0-1) */
    labelX: number;
    labelY: number;
    /** 箭头指向的产品锚点 (归一化 0-1) */
    anchorX: number;
    anchorY: number;
  }>;
}

/**
 * Phase 2: 在已合成的画布上叠加 VLM 返回的精准定位标注
 */
export function overlayCallouts(
  canvas: Canvas,
  layout: LayoutPlacement
) {
  // ── 主标题 ──
  const { mainTitle } = layout;
  const titleFontSize = 26;
  const titleW = measureText(mainTitle.text, titleFontSize) + 50;
  const titleH = titleFontSize + 22;

  const titleBg = new Rect({
    left: 0, top: 0,
    width: Math.max(titleW, 180),
    height: titleH,
    fill: 'rgba(0,0,0,0.68)',
    rx: titleH / 2, ry: titleH / 2,
    selectable: false, evented: false,
  });
  const titleText = new Textbox(mainTitle.text, {
    left: 25, top: 9,
    fontSize: titleFontSize,
    fontWeight: '800',
    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
    fill: '#ffffff',
    width: Math.max(titleW, 180) - 50,
    textAlign: 'center',
    selectable: false, evented: false,
  });
  const titleGroup = new Group([titleBg, titleText], {
    left: mainTitle.x * CANVAS_W - Math.max(titleW, 180) / 2,
    top: mainTitle.y * CANVAS_H - titleH / 2,
    selectable: true,
    objectCaching: false,
  });
  (titleGroup as any).id = 'main_title';
  canvas.add(titleGroup);

  // ── 卖点标注 ──
  layout.callouts.forEach((c) => {
    const content = `${c.headline}  ${c.subtitle}`;
    const textWidth = measureText(content, 13);
    const boxW = Math.min(Math.max(textWidth + 28, 130), 220);
    const boxH = 38;

    const lx = c.labelX * CANVAS_W;
    const ly = c.labelY * CANVAS_H;
    const ax = c.anchorX * CANVAS_W;
    const ay = c.anchorY * CANVAS_H;

    // 文字胶囊
    const bg = new Rect({
      left: 0, top: 0,
      width: boxW, height: boxH,
      fill: 'rgba(255,255,255,0.93)',
      rx: boxH / 2, ry: boxH / 2,
      stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1,
      selectable: false, evented: false,
    });
    const text = new Textbox(content, {
      left: 14, top: 9,
      fontSize: 13,
      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      fill: '#1a1a1a', fontWeight: '600',
      width: boxW - 28,
      textAlign: 'center',
      selectable: false, evented: false,
    });
    const group = new Group([bg, text], {
      left: lx - boxW / 2,
      top: ly - boxH / 2,
      selectable: true,
      objectCaching: false,
    });
    (group as any).id = `callout_${c.id}`;
    canvas.add(group);

    // 连线 + 锚点圆点
    addArrow(canvas, lx, ly, ax, ay, 'rgba(60,60,60,0.4)', c.id);
  });

  canvas.renderAll();
}

/**
 * Fallback: 不使用 VLM 二次定位时的简单布局
 * 强制左右交替 + 均匀纵向分布
 */
export async function renderFeatureCallout(
  canvas: Canvas,
  options: {
    cutoutImage: string;
    sceneImage: string | null;
    fallbackGradient?: { from: string; to: string };
    calloutData: FeatureCalloutJSON;
  }
): Promise<void> {
  const { cutoutImage, sceneImage, fallbackGradient, calloutData } = options;

  canvas.clear();
  canvas.setDimensions({ width: CANVAS_W, height: CANVAS_H });

  // ── 背景 ──
  if (sceneImage) {
    try {
      const bgImg = await FabricImage.fromURL(sceneImage, { crossOrigin: 'anonymous' });
      const bgScale = Math.max(CANVAS_W / bgImg.width!, CANVAS_H / bgImg.height!);
      bgImg.set({
        left: CANVAS_W / 2, top: CANVAS_H / 2,
        originX: 'center', originY: 'center',
        scaleX: bgScale, scaleY: bgScale,
        selectable: false, evented: false,
      });
      canvas.add(bgImg);
    } catch {
      applyGradientBg(canvas, fallbackGradient);
    }
  } else {
    applyGradientBg(canvas, fallbackGradient);
  }

  // ── 产品居中 ──
  const productImg = await FabricImage.fromURL(cutoutImage, { crossOrigin: 'anonymous' });
  const maxSize = CANVAS_W * 0.48;
  const pScale = maxSize / Math.max(productImg.width!, productImg.height!);
  productImg.set({
    left: CANVAS_W / 2, top: CANVAS_H * 0.52,
    originX: 'center', originY: 'center',
    scaleX: pScale, scaleY: pScale,
    selectable: true,
  });
  (productImg as any).id = 'product_foreground';
  canvas.add(productImg);

  // ── 标题 ──
  const titleFontSize = 26;
  const titleW = measureText(calloutData.mainTitle, titleFontSize) + 50;
  const titleH = titleFontSize + 22;
  const titleBg = new Rect({
    left: 0, top: 0,
    width: Math.max(titleW, 180), height: titleH,
    fill: 'rgba(0,0,0,0.68)',
    rx: titleH / 2, ry: titleH / 2,
    selectable: false, evented: false,
  });
  const titleText = new Textbox(calloutData.mainTitle, {
    left: 25, top: 9,
    fontSize: titleFontSize, fontWeight: '800',
    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
    fill: '#ffffff',
    width: Math.max(titleW, 180) - 50,
    textAlign: 'center',
    selectable: false, evented: false,
  });
  const titleGroup = new Group([titleBg, titleText], {
    left: (CANVAS_W - Math.max(titleW, 180)) / 2,
    top: 45,
    selectable: true, objectCaching: false,
  });
  (titleGroup as any).id = 'main_title';
  canvas.add(titleGroup);

  // ── 卖点标注 — 左右交替，均匀分布 ──
  const sps = calloutData.sellingPoints;
  const totalCount = sps.length;
  if (totalCount === 0) { canvas.renderAll(); return; }

  // 纵向区间：标题下方到底部
  const yStart = 140;
  const yEnd = CANVAS_H - 50;
  const ySpacing = (yEnd - yStart) / (totalCount + 1);

  // 左右 X 坐标
  const LEFT_X = 30;      // 左侧标注框左边缘
  const RIGHT_X_END = CANVAS_W - 30; // 右侧标注框右边缘

  // 产品实际区域
  const pw = productImg.width! * pScale;
  const ph = productImg.height! * pScale;
  const pLeft = CANVAS_W / 2 - pw / 2;
  const pTop = CANVAS_H * 0.52 - ph / 2;

  sps.forEach((sp, i) => {
    const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
    const yCenter = yStart + ySpacing * (i + 1);

    const content = `${sp.headline}  ${sp.subtitle}`;
    const textWidth = measureText(content, 13);
    const boxW = Math.min(Math.max(textWidth + 28, 130), 200);
    const boxH = 38;

    let boxLeft: number;
    if (side === 'left') {
      boxLeft = LEFT_X;
    } else {
      boxLeft = RIGHT_X_END - boxW;
    }

    // 胶囊背景
    const bg = new Rect({
      left: 0, top: 0,
      width: boxW, height: boxH,
      fill: 'rgba(255,255,255,0.93)',
      rx: boxH / 2, ry: boxH / 2,
      stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1,
      selectable: false, evented: false,
    });
    const text = new Textbox(content, {
      left: 14, top: 9,
      fontSize: 13,
      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      fill: '#1a1a1a', fontWeight: '600',
      width: boxW - 28,
      textAlign: 'center',
      selectable: false, evented: false,
    });
    const group = new Group([bg, text], {
      left: boxLeft,
      top: yCenter - boxH / 2,
      selectable: true, objectCaching: false,
    });
    (group as any).id = `callout_${sp.id}`;
    canvas.add(group);

    // 箭头：标注框内边缘 → 产品对应侧面
    const arrowStartX = side === 'left' ? boxLeft + boxW + 4 : boxLeft - 4;
    const arrowStartY = yCenter;
    // 锚点：对应 subPart 映射到产品实际坐标
    const targetPart = calloutData.subParts.find((p) => p.id === sp.targetId);
    let anchorX: number, anchorY: number;
    if (targetPart) {
      anchorX = pLeft + (targetPart.bbox.x + targetPart.bbox.w / 2) * pw;
      anchorY = pTop + (targetPart.bbox.y + targetPart.bbox.h / 2) * ph;
    } else {
      anchorX = CANVAS_W / 2;
      anchorY = CANVAS_H / 2;
    }

    addArrow(canvas, arrowStartX, arrowStartY, anchorX, anchorY, 'rgba(60,60,60,0.4)', sp.id);
  });

  canvas.renderAll();
}

function applyGradientBg(canvas: Canvas, gradient?: { from: string; to: string }) {
  const { from, to } = gradient || { from: '#f0f0f0', to: '#d0d0d0' };
  const bg = new Rect({
    left: 0, top: 0,
    width: CANVAS_W, height: CANVAS_H,
    selectable: false, evented: false,
  });
  bg.set('fill', new Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 0, y2: CANVAS_H },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  }));
  (bg as any).id = 'bg_gradient';
  canvas.add(bg);
}
