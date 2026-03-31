'use client';

import { ChevronLeft, Share2, Cloud, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  projectName?: string;
}

export default function TopBar({ projectName = '未命名海报' }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-8 z-20 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-5">
        <Tooltip>
          <TooltipTrigger className={buttonVariants({ variant: 'outline', size: 'icon' })}>
            <ChevronLeft className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>返回主页</TooltipContent>
        </Tooltip>
        
        <Separator orientation="vertical" className="h-5" />
        
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            defaultValue={projectName}
            className="bg-transparent text-sm font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/80 rounded-lg px-3 py-2 -ml-3 transition-colors w-48 border border-transparent focus:border-ring/50 focus:ring-1 focus:ring-ring/30"
          />
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-full text-primary select-none border-primary/20 bg-primary/10">
            <Cloud className="h-3 w-3" />
            <span className="text-[11px] tracking-wide">已保存</span>
          </Badge>
        </div>
      </div>

      {/* Center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 select-none">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-bold tracking-tight text-sm text-primary uppercase">WebPoster</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <Button variant="default" size="default" className="gap-2 px-5 font-semibold">
          <Share2 className="h-4 w-4" />
          共享
        </Button>
        <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-primary/50 cursor-pointer transition-all">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            SG
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
