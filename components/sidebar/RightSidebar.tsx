'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function RightSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是 AI 助手。描述你想要的设计，我来帮你生成。\n\n例如：\n• "生成一张科技风格的海报"\n• "帮我把背景去掉"\n• "调整图片亮度"',
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        '好的，正在为你处理中... 🎨',
        '已完成！我已经将效果应用到画布上了。',
        '收到！让我来帮你优化一下。可以选中画布上的元素，我来帮你编辑。',
        '这个效果需要选中一张图片才能操作哦，请先在画布上点击一张图片。',
      ];
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)] },
      ]);
    }, 800);
  };

  return (
    <aside className="right-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <Sparkles size={16} className="header-icon" />
        <span>AI 助手</span>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className="bubble">
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="描述你想要的效果..."
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
