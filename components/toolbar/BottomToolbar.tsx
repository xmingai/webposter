'use client';

import {
  Eraser, ImageOff, Maximize, Type, Palette,
  RotateCcw, RotateCw, Trash2, Download, ZoomIn, ZoomOut, Sparkles
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const aiTools = [
  { id: 'removeBg', icon: ImageOff, label: '一键去背', primary: true },
  { id: 'upscale', icon: Maximize, label: '超清放大' },
  { id: 'eraser', icon: Eraser, label: '智能擦除' },
];

const basicTools = [
  { id: 'editText', icon: Type, label: '排版调整' },
  { id: 'adjustColor', icon: Palette, label: '光影调色' },
];

export default function BottomToolbar() {
  const { zoom, setZoom, selectedObjectId } = useCanvasStore();
  const hasSelection = !!selectedObjectId;
  const isLassoMask = selectedObjectId?.startsWith('mask_');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleToolClick = (id: string) => {
    alert(`🛠 触发操作: ${id}`);
  };

  const handleZoom = (d: 'in' | 'out') => {
    const canvas = (window as any).__canvasEditor?.getCanvas?.();
    if (!canvas) return;
    const current = canvas.getZoom();
    const newZoom = d === 'in' ? current * 1.15 : current / 1.15;
    const clamped = Math.min(Math.max(newZoom, 0.1), 5);
    canvas.setZoom(clamped);
    canvas.renderAll();
    setZoom(Math.round(clamped * 100));
  };

  if (!mounted) return null;

  return (
    <>
      {/* AI 上下文工具栏 (选中元素后弹出) */}
      <div
        className={cn(
          'absolute bottom-32 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border bg-popover/95 p-2 shadow-xl backdrop-blur-xl transition-all duration-500 ease-out z-50',
          hasSelection
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
            : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
        )}
      >
        {isLassoMask ? (
          <div className="flex items-center gap-3 px-3 py-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <input 
              type="text" 
              placeholder="描述需要在圈选区域生成的内容..." 
              className="bg-transparent border-none outline-none text-sm w-64 text-foreground placeholder:text-muted-foreground"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleToolClick('inpaint');
              }}
            />
            <Button size="sm" className="h-8 gap-2 font-semibold" onClick={() => handleToolClick('inpaint')}>
              重绘
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-2">
              {aiTools.map(({ id, icon: Icon, label, primary }) => (
                <Tooltip key={id}>
                  <TooltipTrigger
                    className={cn(buttonVariants({ variant: primary ? 'default' : 'ghost', size: 'sm' }), 'gap-2')}
                    onClick={() => handleToolClick(id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TooltipTrigger>
                  <TooltipContent>消耗 1 ⚡️ 算力</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1 px-1">
              {basicTools.map(({ id, icon: Icon, label }) => (
                <Tooltip key={id}>
                  <TooltipTrigger
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                    onClick={() => handleToolClick(id)}
                  >
                    <Icon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底座控制栏 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex h-16 items-center gap-4 rounded-2xl border bg-popover/95 px-5 shadow-2xl backdrop-blur-xl">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger 
              className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
              onClick={() => handleToolClick('undo')}
            >
              <RotateCcw className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>撤销 (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger 
              className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
              onClick={() => handleToolClick('redo')}
            >
              <RotateCw className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>重做 (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-7" />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleZoom('out')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-mono font-semibold text-foreground tabular-nums select-none">
            {zoom}%
          </span>
          <Button variant="outline" size="icon" onClick={() => handleZoom('in')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-7" />

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger 
            className={cn(buttonVariants({ variant: 'destructive', size: 'icon' }))}
            onClick={() => handleToolClick('delete')}
          >
            <Trash2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>删除选中元素</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-7" />

        {/* Export */}
        <Button variant="default" size="lg" className="gap-2.5 px-7 font-bold" onClick={() => handleToolClick('export')}>
          <Download className="h-4 w-4" />
          导出画板
        </Button>
      </div>
    </>
  );
}
