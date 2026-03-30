'use client';

import {
  MousePointer2,
  Type,
  Square,
  Upload,
  ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCanvasStore, Tool } from '@/stores/canvasStore';

const sidebarItems: { id: Tool | string; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'upload', icon: Upload, label: '上传' },
  { id: 'text', icon: Type, label: '文字' },
  { id: 'shape', icon: Square, label: '形状' },
  { id: 'templates', icon: Layers, label: '模板' },
  { id: 'ai', icon: Sparkles, label: 'AI 生图' },
  { id: 'gallery', icon: ImageIcon, label: '素材库' },
];

// Demo images
const demoImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
];

export default function LeftSidebar() {
  const { activeTool, setTool } = useCanvasStore();

  const handleClick = (id: string) => {
    if (id === 'upload') {
      (window as any).__canvasEditor?.handleUpload?.();
      return;
    }
    if (id === 'text') {
      (window as any).__canvasEditor?.addText?.();
      return;
    }
    if (id === 'shape') {
      (window as any).__canvasEditor?.addShape?.();
      return;
    }
    setTool(id as Tool);
  };

  const handleDemoImage = (url: string) => {
    (window as any).__canvasEditor?.addImage?.(url);
  };

  return (
    <aside className="left-sidebar">
      {/* Tool buttons */}
      <div className="tool-buttons">
        {sidebarItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`tool-btn ${activeTool === id ? 'active' : ''}`}
            onClick={() => handleClick(id)}
            title={label}
          >
            <Icon size={20} />
            <span className="tool-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Quick assets */}
      <div className="assets-section">
        <h3 className="section-title">快速素材</h3>
        <div className="asset-grid">
          {demoImages.map((url, i) => (
            <button
              key={i}
              className="asset-thumb"
              onClick={() => handleDemoImage(url)}
            >
              <img src={url} alt={`素材 ${i + 1}`} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
