'use client';

import {
  Eraser,
  ImageOff,
  Maximize,
  Type,
  Palette,
  Move,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

const tools = [
  { id: 'removeBg', icon: ImageOff, label: 'Remove BG' },
  { id: 'upscale', icon: Maximize, label: 'Upscale' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'editText', icon: Type, label: 'Edit Text' },
  { id: 'adjustColor', icon: Palette, label: 'Adjust' },
  { id: 'moveObj', icon: Move, label: 'Move Object' },
];

export default function BottomToolbar() {
  const { zoom, setZoom } = useCanvasStore();

  const handleToolClick = (id: string) => {
    if (id === 'removeBg') {
      alert('🎨 Remove BG: 选中一张图后，将调用 Cloudflare Images segment=foreground 进行抠图');
      return;
    }
    if (id === 'upscale') {
      alert('🔍 Upscale: 选中一张图后，将调用超分辨率 API 放大图片');
      return;
    }
    alert(`🛠 ${id}: 功能开发中...`);
  };

  const handleUndo = () => {
    const state = useCanvasStore.getState().undo();
    if (state) {
      const canvas = (window as any).__canvasEditor?.getCanvas?.();
      canvas?.loadFromJSON(state).then(() => canvas?.renderAll());
    }
  };

  const handleRedo = () => {
    const state = useCanvasStore.getState().redo();
    if (state) {
      const canvas = (window as any).__canvasEditor?.getCanvas?.();
      canvas?.loadFromJSON(state).then(() => canvas?.renderAll());
    }
  };

  const handleDelete = () => {
    (window as any).__canvasEditor?.deleteSelected?.();
  };

  const handleExport = () => {
    (window as any).__canvasEditor?.exportCanvas?.();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const canvas = (window as any).__canvasEditor?.getCanvas?.();
    if (!canvas) return;
    const current = canvas.getZoom();
    const newZoom = direction === 'in' ? current * 1.15 : current / 1.15;
    const clamped = Math.min(Math.max(newZoom, 0.1), 5);
    canvas.setZoom(clamped);
    canvas.renderAll();
    setZoom(Math.round(clamped * 100));
  };

  return (
    <div className="bottom-toolbar">
      {/* Left: AI Tools */}
      <div className="tool-group">
        {tools.map(({ id, icon: Icon, label }) => (
          <button key={id} className="tb-btn" onClick={() => handleToolClick(id)} title={label}>
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Center: History */}
      <div className="tool-group center">
        <button className="tb-btn icon-only" onClick={handleUndo} title="Undo (⌘Z)">
          <RotateCcw size={16} />
        </button>
        <button className="tb-btn icon-only" onClick={handleRedo} title="Redo (⌘⇧Z)">
          <RotateCw size={16} />
        </button>
        <div className="separator" />
        <button className="tb-btn icon-only" onClick={handleDelete} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Right: Zoom & Export */}
      <div className="tool-group right">
        <button className="tb-btn icon-only" onClick={() => handleZoom('out')}>
          <ZoomOut size={16} />
        </button>
        <span className="zoom-text">{zoom}%</span>
        <button className="tb-btn icon-only" onClick={() => handleZoom('in')}>
          <ZoomIn size={16} />
        </button>
        <div className="separator" />
        <button className="tb-btn export" onClick={handleExport}>
          <Download size={16} />
          <span>导出</span>
        </button>
      </div>
    </div>
  );
}
