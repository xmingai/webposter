'use client';

import { ChevronLeft, Share2 } from 'lucide-react';

interface TopBarProps {
  projectName?: string;
}

export default function TopBar({ projectName = 'Untitled Project' }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="left">
        <button className="back-btn" title="返回">
          <ChevronLeft size={20} />
        </button>
        <div className="project-info">
          <h1 className="project-name">{projectName}</h1>
          <span className="save-status">已保存</span>
        </div>
      </div>

      <div className="center">
        <span className="brand">WebPoster</span>
      </div>

      <div className="right">
        <button className="share-btn">
          <Share2 size={16} />
          <span>分享</span>
        </button>
        <div className="avatar">S</div>
      </div>
    </header>
  );
}
