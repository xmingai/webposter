'use client';

import { MousePointer2, Type, Square, Upload, ImageIcon, Layers, Sparkles, Lasso, Tag } from 'lucide-react';
import dynamic from 'next/dynamic';

const FeatureCalloutPanel = dynamic(() => import('@/components/feature-callout/FeatureCalloutPanel'), { ssr: false });
import { useCanvasStore, Tool } from '@/stores/canvasStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const sidebarItems: { id: Tool | string; icon: React.ElementType; label: string; special?: boolean }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'lasso', icon: Lasso, label: '局部重绘' },
  { id: 'featureCallout', icon: Tag, label: 'AI 卖点图', special: true },
  { id: 'upload', icon: Upload, label: '上传图片' },
  { id: 'text', icon: Type, label: '编辑文本' },
  { id: 'shape', icon: Square, label: '基础图形' },
  { id: 'templates', icon: Layers, label: '所有模板' },
  { id: 'ai', icon: Sparkles, label: 'AI 生成', special: true },
  { id: 'gallery', icon: ImageIcon, label: '贴纸图库' },
];

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
    <aside className="relative flex w-[280px] shrink-0 flex-col border-r bg-card/50 backdrop-blur-xl z-10">
      {/* 导航区 */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-6 py-8">
          {sidebarItems.map(({ id, icon: Icon, label, special }) => {
            const isActive = activeTool === id;
            return (
              <Button
                key={id}
                variant={isActive ? 'secondary' : 'ghost'}
                size="lg"
                className={cn(
                  'relative w-full justify-start gap-4 h-12',
                  isActive && 'font-semibold',
                )}
                onClick={() => handleClick(id)}
              >
                <Icon className={cn(
                  'h-[18px] w-[18px]',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  special && !isActive && 'text-chart-1',
                )} />
                <span className={cn(
                  'text-sm tracking-wide',
                  isActive ? 'text-secondary-foreground' : 'text-muted-foreground',
                  special && !isActive && 'text-primary font-semibold',
                )}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Feature Callout Panel (条件渲染) */}
      {activeTool === 'featureCallout' && (
        <div className="absolute left-full top-0 bottom-0 w-[320px] border-r bg-card/95 backdrop-blur-xl z-20 overflow-y-auto shadow-xl">
          <FeatureCalloutPanel />
        </div>
      )}

      <Separator />

      {/* 素材区 */}
      <div className="p-6">
        <h4 className="mb-5 text-[11px] font-bold tracking-widest uppercase text-muted-foreground">素材库推荐</h4>
        <div className="grid grid-cols-2 gap-4">
          {demoImages.map((url, i) => (
            <button
              key={i}
              onClick={() => handleDemoImage(url)}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/30 transition-all hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={url}
                alt={`素材 ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                <span className="text-[10px] text-foreground font-medium tracking-wide">添加到画布</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
