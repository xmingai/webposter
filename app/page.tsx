'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/toolbar/TopBar';
import LeftSidebar from '@/components/sidebar/LeftSidebar';
import RightSidebar from '@/components/sidebar/RightSidebar';
import BottomToolbar from '@/components/toolbar/BottomToolbar';

// Dynamic import to avoid SSR issues with Fabric.js (requires window/document)
const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#e8e8e8',
      color: '#999',
      fontSize: 14,
    }}>
      Loading editor...
    </div>
  ),
});

export default function EditorPage() {
  return (
    <div className="editor-layout">
      <TopBar projectName="商品海报 Demo" />

      <div className="editor-body">
        <LeftSidebar />

        <main className="canvas-area">
          <CanvasEditor />
        </main>

        <RightSidebar />
      </div>

      <BottomToolbar />
    </div>
  );
}
