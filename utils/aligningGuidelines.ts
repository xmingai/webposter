import { Canvas, FabricObject, Point } from 'fabric';

/**
 * Initializes Smart Guides (Aligning Guidelines) for a Fabric.js canvas.
 * Draws vertical and horizontal alignment lines and snaps objects into place 
 * when they align with other elements on the canvas.
 */
export function initAligningGuidelines(canvas: Canvas) {
  const aligningLineOffset = 5;
  const aligningLineMargin = 4;
  const aligningLineWidth = 1;
  const aligningLineColor = 'rgba(99, 102, 241, 0.9)'; // Primary Indigo

  let verticalLines: { x: number; y1: number; y2: number }[] = [];
  let horizontalLines: { y: number; x1: number; x2: number }[] = [];

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    ctx.save();
    ctx.lineWidth = aligningLineWidth;
    ctx.strokeStyle = aligningLineColor;
    ctx.beginPath();
    
    // Transform coordinates based on canvas zoom & pan
    const p1 = new Point(x1, y1).transform(vpt);
    const p2 = new Point(x2, y2).transform(vpt);

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  canvas.on('mouse:down', () => {
    verticalLines = [];
    horizontalLines = [];
  });

  canvas.on('object:moving', (e) => {
    if (!e.target) return;
    const activeObject = e.target;
    const canvasObjects = canvas.getObjects().filter((obj) => obj !== activeObject && obj.selectable);

    const activeBounds = activeObject.getBoundingRect();
    const activeCenterX = activeBounds.left + activeBounds.width / 2;
    const activeCenterY = activeBounds.top + activeBounds.height / 2;

    verticalLines = [];
    horizontalLines = [];

    let snapX: number | null = null;
    let snapY: number | null = null;

    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      const target = canvasObjects[i];
      const targetBounds = target.getBoundingRect();
      const targetCenterX = targetBounds.left + targetBounds.width / 2;
      const targetCenterY = targetBounds.top + targetBounds.height / 2;

      // Vertical Snapping
      if (Math.abs(activeCenterX - targetCenterX) < aligningLineMargin) {
        snapX = targetCenterX;
        verticalLines.push({
          x: targetCenterX,
          y1: Math.min(activeBounds.top, targetBounds.top) - aligningLineOffset,
          y2: Math.max(activeBounds.top + activeBounds.height, targetBounds.top + targetBounds.height) + aligningLineOffset,
        });
      }

      // Horizontal Snapping
      if (Math.abs(activeCenterY - targetCenterY) < aligningLineMargin) {
        snapY = targetCenterY;
        horizontalLines.push({
          y: targetCenterY,
          x1: Math.min(activeBounds.left, targetBounds.left) - aligningLineOffset,
          x2: Math.max(activeBounds.left + activeBounds.width, targetBounds.left + targetBounds.width) + aligningLineOffset,
        });
      }
    }

    // Apply Snapping
    // Note: If we just set left/top, we must offset by the object's origin (center in this calculation).
    // In Fabric.js v6, left/top are relative to originX/originY. By default, it's 'left' and 'top'.
    if (snapX !== null) {
      // Find the difference from the current center to the snapped center
      const diffX = snapX - activeCenterX;
      activeObject.set('left', activeObject.left + diffX);
    }
    
    if (snapY !== null) {
      const diffY = snapY - activeCenterY;
      activeObject.set('top', activeObject.top + diffY);
    }

  });

  canvas.on('before:render', () => {
    // We don't draw here to ensure lines are on top.
  });

  canvas.on('after:render', (opt: any) => {
    // Draw alignment lines over everything else
    const ctx = opt.ctx;
    if (!ctx) return;
    for (let i = 0; i < verticalLines.length; i++) {
      const line = verticalLines[i];
      drawLine(ctx, line.x, line.y1, line.x, line.y2);
    }
    for (let i = 0; i < horizontalLines.length; i++) {
      const line = horizontalLines[i];
      drawLine(ctx, line.x1, line.y, line.x2, line.y);
    }
  });

  canvas.on('mouse:up', () => {
    verticalLines = [];
    horizontalLines = [];
    canvas.requestRenderAll();
  });
}
