'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/toolbar/TopBar';
import LeftSidebar from '@/components/sidebar/LeftSidebar';
import RightSidebar from '@/components/sidebar/RightSidebar';
import BottomToolbar from '@/components/toolbar/BottomToolbar';
import { Loader2 } from 'lucide-react';

const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">加载编辑引擎</span>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* 氛围层: 顶部靛蓝光晕 */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 w-[120%] h-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08)_0%,transparent_60%)]" />
      </div>

      <TopBar projectName="未命名海报" />

      <div className="relative flex flex-1 overflow-hidden z-10">
        <LeftSidebar />
        <main className="relative flex-1 overflow-hidden">
          <CanvasEditor />
          <BottomToolbar />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
