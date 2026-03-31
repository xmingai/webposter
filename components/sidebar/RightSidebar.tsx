'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Wand2, ImagePlus, Palette as PaletteIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickActions = [
  { icon: Wand2, label: '生成海报', prompt: '帮我生成一张科技风格海报。' },
  { icon: ImagePlus, label: '移除背景', prompt: '一键抠图，移除选中元素的背景。' },
  { icon: PaletteIcon, label: '智能调色', prompt: '优化整个画面的配色和对比度。' },
];

export default function RightSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是 AI 副驾。用自然语言描述你的设计需求，例如：\n\n- "帮我生成一张夏日饮品海报"\n- "把主角的背景去掉"\n- "画面调亮一点"',
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: '✨ 正在分析需求并生成指令...' }]);
    }, 800);
  };

  return (
    <aside className="relative flex w-[380px] shrink-0 flex-col border-l bg-card/50 backdrop-blur-xl z-10">
      
      {/* Header */}
      <div className="flex h-16 items-center gap-4 border-b px-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-foreground tracking-wide">AI 智能副驾</span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Copilot Ready</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-8 px-7 py-8">
          {/* 对话消息 */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex w-full items-start gap-4',
                msg.role === 'user' && 'flex-row-reverse'
              )}
            >
              <Avatar className="h-9 w-9 shrink-0 mt-1">
                {msg.role === 'assistant' ? (
                  <AvatarFallback className="bg-card text-primary border">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground border">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-5 py-4 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'rounded-tl-sm bg-card text-card-foreground border'
                )}
              >
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={cn(line === '' ? 'h-3' : 'mt-1.5 first:mt-0')}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-1" />

          {/* 快捷操作引导 */}
          {messages.length <= 2 && (
            <div className="flex flex-col gap-5">
              <Separator />
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground text-center">
                — 启发指引 —
              </span>
              <div className="flex flex-col gap-4">
                {quickActions.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(prompt)}
                    className="group flex items-start gap-5 rounded-2xl border bg-card/50 p-5 text-left transition-all duration-200 hover:bg-accent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-all">
                      <Icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <p className="text-sm font-semibold text-foreground/85 group-hover:text-foreground transition-colors">{label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 输入框 */}
      <div className="p-7 pt-5 shrink-0 border-t bg-card/30">
        <div className="relative flex items-end gap-3 rounded-2xl border bg-card p-2.5 transition-all shadow-sm focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="描述你的修改需求..."
            className="flex w-full min-h-[52px] max-h-[140px] resize-none bg-transparent px-4 py-3 text-sm leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            style={{ height: input ? `${Math.min(140, Math.max(52, input.split('\n').length * 22 + 30))}px` : '52px' }}
          />
          <Button
            variant="default"
            size="icon-lg"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="shrink-0 rounded-xl mb-0.5 mr-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 text-center text-[10px] font-medium tracking-widest text-muted-foreground/50 select-none">
          ✦ AI 生成结果基于上下文 ✦
        </p>
      </div>
    </aside>
  );
}
