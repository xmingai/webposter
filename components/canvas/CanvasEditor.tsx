'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Canvas, FabricImage, Textbox, Rect, FabricObject, Point, Shadow, Polygon, Polyline, Group, ActiveSelection } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { initAligningGuidelines } from '@/utils/aligningGuidelines';

// Register custom attributes for serialization
FabricObject.customProperties = ['id'];

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, setSelectedObject, setZoom, pushHistory, activeTool, setTool } = useCanvasStore();

  // Lasso Tool Effect
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (activeTool === 'lasso') {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      let isDrawing = false;
      let points: Point[] = [];
      let drawingPolyline: Polyline | null = null;

      const onMouseDown = (opt: any) => {
        isDrawing = true;
        const pointer = opt.scenePoint;
        points = [pointer];
        drawingPolyline = new Polyline(points, {
          fill: 'transparent',
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          objectCaching: false,
        });
        canvas.add(drawingPolyline);
      };

      const onMouseMove = (opt: any) => {
        if (!isDrawing || !drawingPolyline) return;
        const pointer = opt.scenePoint;
        points.push(pointer);
        
        drawingPolyline.set({ points: [...points] });
        canvas.requestRenderAll();
      };

      const onMouseUp = () => {
        if (!isDrawing) return;
        isDrawing = false;
        if (drawingPolyline) {
          canvas.remove(drawingPolyline);
        }
        
        if (points.length > 2) {
          const finalPolygon = new Polygon(points, {
            fill: 'rgba(99, 102, 241, 0.3)',
            stroke: '#6366f1',
            strokeWidth: 2,
            selectable: true,
            evented: true,
            cornerStyle: 'circle',
            transparentCorners: false,
          });
          (finalPolygon as any).id = `mask_${Date.now()}`;
          canvas.add(finalPolygon);
          canvas.setActiveObject(finalPolygon);
          canvas.requestRenderAll();
          pushHistory(JSON.stringify(canvas.toObject(['id'])));
        }
        setTool('select');
      };

      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);

      return () => {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
        if (drawingPolyline) {
          canvas.remove(drawingPolyline);
          canvas.requestRenderAll();
        }
      };
    }
  }, [activeTool, setTool, pushHistory]);

  // Initialize canvas — infinite canvas with dot grid
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: '#2a2a2a',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Initialize smart guides (snapping)
    initAligningGuidelines(canvas);

    // ─── Dot grid background ───
    const drawGrid = () => {
      const ctx = canvas.getContext();
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform!;
      const w = canvas.getWidth();
      const h = canvas.getHeight();

      const gridSize = 30;
      const dotRadius = Math.max(0.6, 1 * zoom);

      // Calculate the visible area in canvas coordinates
      const startX = -vpt[4] / zoom;
      const startY = -vpt[5] / zoom;
      const endX = startX + w / zoom;
      const endY = startY + h / zoom;

      // Snap to grid
      const firstX = Math.floor(startX / gridSize) * gridSize;
      const firstY = Math.floor(startY / gridSize) * gridSize;

      ctx.save();
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

      for (let x = firstX; x < endX; x += gridSize) {
        for (let y = firstY; y < endY; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fill();
        }
      }
      ctx.restore();
    };

    canvas.on('after:render', drawGrid);

    // ─── Resize handler ───
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ─── Panning (Space + Drag or Middle Mouse) ───
    let isPanning = false;
    let spaceDown = false;
    let lastPanPos = { x: 0, y: 0 };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spaceDown) {
        spaceDown = true;
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown = false;
        isPanning = false;
        canvas.defaultCursor = 'default';
        canvas.selection = true;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvas.on('mouse:down', (opt) => {
      const me = opt.e as MouseEvent;
      if (spaceDown || me.button === 1) {
        isPanning = true;
        lastPanPos = { x: me.clientX, y: me.clientY };
        canvas.defaultCursor = 'grabbing';
        me.preventDefault();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (!isPanning) return;
      const me = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform!;
      vpt[4] += me.clientX - lastPanPos.x;
      vpt[5] += me.clientY - lastPanPos.y;
      lastPanPos = { x: me.clientX, y: me.clientY };
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
      if (isPanning) {
        isPanning = false;
        canvas.defaultCursor = spaceDown ? 'grab' : 'default';
      }
    });

    // ─── Selection events ───
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj) setSelectedObject((obj as any).id || null);
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      if (obj) setSelectedObject((obj as any).id || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // ─── History ───
    canvas.on('object:modified', () => {
      pushHistory(JSON.stringify(canvas.toObject(['id'])));
    });

    // ─── Zoom (scroll wheel) ───
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (delta > 0 ? 0.95 : 1.05);
      newZoom = Math.min(Math.max(newZoom, 0.05), 10);
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), newZoom);
      setZoom(Math.round(newZoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    canvas.renderAll();

    // Save initial state
    pushHistory(JSON.stringify(canvas.toObject(['id'])));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Public methods via ref
  const addImage = useCallback(async (url: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const id = `img_${Date.now()}`;
    (img as any).id = id;

    // Scale to fit artboard
    const maxW = 300;
    const scale = maxW / Math.max(img.width!, img.height!);
    img.set({
      left: 150 + Math.random() * 300,
      top: 100 + Math.random() * 200,
      scaleX: scale,
      scaleY: scale,
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    pushHistory(JSON.stringify(canvas.toObject(['id'])));
  }, [pushHistory]);

  const addText = useCallback((text: string = 'Double click to edit') => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const id = `text_${Date.now()}`;
    const textbox = new Textbox(text, {
      left: 200 + Math.random() * 200,
      top: 150 + Math.random() * 150,
      fontSize: 32,
      fontFamily: 'Helvetica Neue, sans-serif',
      fill: '#1a1a1a',
      width: 300,
    });
    (textbox as any).id = id;

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    pushHistory(JSON.stringify(canvas.toObject(['id'])));
  }, [pushHistory]);

  const addShape = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const id = `shape_${Date.now()}`;
    const rect = new Rect({
      left: 200 + Math.random() * 200,
      top: 150 + Math.random() * 150,
      width: 150,
      height: 150,
      fill: '#6366f1',
      rx: 12,
      ry: 12,
      opacity: 0.9,
    });
    (rect as any).id = id;

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    pushHistory(JSON.stringify(canvas.toObject(['id'])));
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObjects();
    active.forEach((obj) => {
      canvas.remove(obj);
    });
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory(JSON.stringify(canvas.toObject(['id'])));
  }, [pushHistory]);

  const exportCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = 'poster.png';
    link.href = dataURL;
    link.click();
  }, []);

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        addImage(url);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addImage]);

  // Expose methods globally for toolbar communication
  useEffect(() => {
    (window as any).__canvasEditor = {
      addImage,
      addText,
      addShape,
      deleteSelected,
      exportCanvas,
      handleUpload,
      getCanvas: () => fabricRef.current,
    };
  }, [addImage, addText, addShape, deleteSelected, exportCanvas, handleUpload]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fabricRef.current?.getActiveObject();
        if (active && !(active instanceof Textbox && (active as Textbox).isEditing)) {
          deleteSelected();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        const state = e.shiftKey ? useCanvasStore.getState().redo() : useCanvasStore.getState().undo();
        if (state && fabricRef.current) {
          fabricRef.current.loadFromJSON(state).then(() => {
            fabricRef.current?.renderAll();
          });
        }
      }

      // Group / Ungroup
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const canvas = fabricRef.current;
        if (!canvas) return;

        const activeObj = canvas.getActiveObject();
        if (!activeObj) return;

        if (e.shiftKey) {
          // Ungroup
          if (activeObj.type === 'Group' || activeObj.type === 'group') {
            const group = activeObj as Group;
            const items = group.removeAll();
            canvas.remove(group);
            items.forEach((item) => canvas.add(item));
            
            const sel = new ActiveSelection(items, { canvas });
            canvas.setActiveObject(sel);
            canvas.requestRenderAll();
            useCanvasStore.getState().pushHistory(JSON.stringify(canvas.toObject(['id'])));
          }
        } else {
          // Group
          if (activeObj.type === 'ActiveSelection' || activeObj.type === 'activeSelection') {
            const sel = activeObj as ActiveSelection;
            const items = sel.removeAll();
            const group = new Group(items, {
              left: sel.left,
              top: sel.top,
              width: sel.width,
              height: sel.height,
              scaleX: sel.scaleX,
              scaleY: sel.scaleY,
              originX: sel.originX,
              originY: sel.originY,
              angle: sel.angle,
            });
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.requestRenderAll();
            useCanvasStore.getState().pushHistory(JSON.stringify(canvas.toObject(['id'])));
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  return (
    <div ref={containerRef} className="canvas-editor-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
