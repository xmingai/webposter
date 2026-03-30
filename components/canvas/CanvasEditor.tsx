'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Canvas, FabricImage, Textbox, Rect, FabricObject, Point, Shadow } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';

// Register custom attributes for serialization
FabricObject.customProperties = ['id'];

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, setSelectedObject, setZoom, pushHistory } = useCanvasStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: '#f0f0f0',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Resize handler
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Selection events
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

    // Save history on object modification
    canvas.on('object:modified', () => {
      pushHistory(JSON.stringify(canvas.toObject(['id'])));
    });

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (delta > 0 ? 0.95 : 1.05);
      newZoom = Math.min(Math.max(newZoom, 0.1), 5);
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), newZoom);
      setZoom(Math.round(newZoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Add a default white artboard
    const artboard = new Rect({
      left: 100,
      top: 60,
      width: 800,
      height: 600,
      fill: '#ffffff',
      shadow: new Shadow({ color: 'rgba(0,0,0,0.12)', blur: 24, offsetX: 0, offsetY: 4 }),
      selectable: false,
      evented: false,
      rx: 4,
      ry: 4,
    });
    (artboard as any).id = 'artboard';
    canvas.add(artboard);
    canvas.renderAll();

    // Save initial state
    pushHistory(JSON.stringify(canvas.toObject(['id'])));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
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
      if ((obj as any).id !== 'artboard') canvas.remove(obj);
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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  return (
    <div ref={containerRef} className="canvas-editor-container">
      <canvas ref={canvasRef} />
      <div className="zoom-indicator">{zoom}%</div>
    </div>
  );
}
