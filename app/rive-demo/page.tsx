'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

type Emotion = 'happy' | 'angry' | 'sad' | 'surprised' | 'laughing' | 'super_happy';

const EMOTIONS: { id: Emotion; emoji: string; label: string; color: string }[] = [
  { id: 'happy', emoji: '🌟', label: '开心', color: '#4ade80' },
  { id: 'super_happy', emoji: '❤️', label: '超赞', color: '#f87171' },
  { id: 'laughing', emoji: '😂', label: '大笑', color: '#fbbf24' },
  { id: 'surprised', emoji: '😲', label: '惊讶', color: '#60a5fa' },
  { id: 'sad', emoji: '😢', label: '委屈', color: '#a78bfa' },
  { id: 'angry', emoji: '🔥', label: '暴怒', color: '#f87171' },
];

export default function RiveDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [time, setTime] = useState(0);

  // Track mouse position with smoothing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Main animation loop
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setTime(t => t + 0.05);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-blink
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-emotion on hover
  useEffect(() => {
    if (isHovered) {
      setEmotion('laughing');
    } else {
       // Keep manual selection if not hovered
    }
  }, [isHovered]);

  // Animation values
  const bounce = useMemo(() => Math.sin(time) * 5, [time]);
  const squash = useMemo(() => 1 + Math.sin(time) * 0.03, [time]);
  const stretch = useMemo(() => 1 - Math.sin(time) * 0.03, [time]);
  
  const eyeOffsetX = (mousePos.x - 0.5) * 12;
  const eyeOffsetY = (mousePos.y - 0.5) * 8;
  const headTilt = (mousePos.x - 0.5) * 20;

  // Render helper for floating particles
  const particles = useMemo(() => {
    if (emotion === 'super_happy') {
      return Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        x: 200 + Math.sin(time + i) * 80,
        y: 150 + Math.cos(time * 0.5 + i) * 40 - (time * 20 % 100),
        scale: 0.5 + Math.random() * 0.5,
        opacity: 1 - ((time * 20 % 100) / 100)
      }));
    }
    if (emotion === 'angry') {
        return Array.from({ length: 3 }).map((_, i) => ({
            id: i,
            x: 200 + (i - 1) * 60 + Math.sin(time * 10) * 2,
            y: 100 - (time * 30 % 50),
            scale: 0.8,
            opacity: 1 - ((time * 30 % 50) / 50)
        }));
    }
    return [];
  }, [emotion, time]);

  return (
    <div ref={containerRef} className="gamified-stage">
      <div className="ui-header">
        <h1>SUN CONURE <span>PRO</span></h1>
        <div className="status-pill">LEVEL 99 PET</div>
      </div>

      <div className="character-container">
        {/* Floor Shadow */}
        <div 
          className="floor-shadow" 
          style={{ 
            transform: `scale(${1 + bounce * 0.02})`,
            opacity: 0.3 - bounce * 0.01
          }} 
        />

        <svg
          viewBox="0 0 400 500"
          className="parrot-hero"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setEmotion('happy');
          }}
        >
          <defs>
            {/* Rich Gradients */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE14D" />
              <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFB800" />
              <stop offset="100%" stopColor="#FF8A00" />
            </linearGradient>
            <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="10" stdDeviation="10" floodOpacity="0.2" />
            </filter>
            <filter id="innerGlow">
                <feFlood floodColor="white" floodOpacity="0.3" result="flood" />
                <feComposite in="flood" in2="SourceGraphic" operator="in" result="mask" />
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Particles */}
          {particles.map(p => (
            <text 
              key={p.id} 
              x={p.x} 
              y={p.y} 
              fontSize={24} 
              style={{ opacity: p.opacity, transform: `scale(${p.scale})` }}
            >
              {emotion === 'super_happy' ? '❤️' : '💢'}
            </text>
          ))}

          <g transform={`translate(200, 400) scale(${stretch}, ${squash}) translate(-200, -400)`}>
            <g 
                transform={`translate(200, 250) rotate(${headTilt + (emotion === 'angry' ? Math.sin(time*20)*2 : 0)}) translate(-200, ${-250 + bounce})`}
                style={{ transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)' }}
            >
              {/* Tail */}
              <path d="M 180,350 Q 200,450 220,350" fill="#22C55E" filter="url(#softShadow)" />
              
              {/* Wings */}
              <ellipse 
                cx="120" cy="280" rx="35" ry="60" fill="url(#wingGrad)" 
                transform={`rotate(${headTilt * -0.5 + (emotion === 'surprised' ? -20 : 0)})`} 
              />
              <ellipse 
                cx="280" cy="280" rx="35" ry="60" fill="url(#wingGrad)" 
                transform={`rotate(${headTilt * -0.5 + (emotion === 'surprised' ? 20 : 0)})`} 
              />

              {/* Body */}
              <rect x="130" y="200" width="140" height="160" rx="70" fill="url(#bodyGrad)" filter="url(#softShadow)" />
              <ellipse cx="200" cy="300" rx="45" ry="55" fill="#FFE14D" opacity="0.6" />

              {/* Head */}
              <circle cx="200" cy="180" r="75" fill="url(#goldGrad)" />
              
              {/* Crest - 3 Juicy Feathers */}
              <g transform="translate(200, 110)">
                <path d="M -15,0 Q -25,-40 0,-50 Q 10,-40 0,0" fill="#FFE14D" transform={`rotate(${-15 + headTilt * 0.2})`} />
                <path d="M 0,0 Q 0,-60 15,-55 Q 20,-40 0,0" fill="#FFB800" transform={`rotate(${headTilt * 0.2})`} />
                <path d="M 15,0 Q 25,-40 10,-50 Q 0,-40 15,0" fill="#FFE14D" transform={`rotate(${15 + headTilt * 0.2})`} />
              </g>

              {/* Eyes - Large and Expressive */}
              <g transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`}>
                {/* Whites */}
                <circle cx="160" cy="170" r="22" fill="white" stroke="#442200" strokeWidth="2" />
                <circle cx="240" cy="170" r="22" fill="white" stroke="#442200" strokeWidth="2" />
                
                {/* Pupils */}
                <g style={{ transition: 'transform 0.1s ease-out' }}>
                   {isBlinking ? (
                     <g>
                       <line x1="145" y1="170" x2="175" y2="170" stroke="#442200" strokeWidth="4" strokeLinecap="round" />
                       <line x1="225" y1="170" x2="255" y2="170" stroke="#442200" strokeWidth="4" strokeLinecap="round" />
                     </g>
                   ) : (
                     <g>
                        {emotion === 'angry' ? (
                            <path d="M 145,175 Q 160,160 175,175" fill="none" stroke="#442200" strokeWidth="4" />
                        ) : emotion === 'laughing' ? (
                            <path d="M 145,170 Q 160,185 175,170" fill="none" stroke="#442200" strokeWidth="4" />
                        ) : (
                            <>
                                <circle cx="160" cy="170" r="10" fill="#442200" />
                                <circle cx="240" cy="170" r="10" fill="#442200" />
                                <circle cx="156" cy="166" r="4" fill="white" />
                                <circle cx="236" cy="166" r="4" fill="white" />
                            </>
                        )}
                        {emotion === 'laughing' && <path d="M 225,170 Q 240,185 255,170" fill="none" stroke="#442200" strokeWidth="4" />}
                     </g>
                   )}
                </g>
              </g>

              {/* Beak */}
              <g transform="translate(200, 205)">
                <path d="M -15,0 Q 0,-5 15,0 Q 10,25 0,30 Q -10,25 -15,0" fill="#442200" />
                {emotion === 'laughing' && <ellipse cx="0" cy="15" rx="8" ry="5" fill="#FF5C00" />}
              </g>

              {/* Blush */}
              {(emotion === 'happy' || emotion === 'super_happy' || emotion === 'laughing') && (
                <g opacity="0.4">
                    <circle cx="135" cy="195" r="12" fill="#FF5C00" />
                    <circle cx="265" cy="195" r="12" fill="#FF5C00" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>

      <div className="game-controls">
        {EMOTIONS.map((emp) => (
          <button
            key={emp.id}
            className={`game-btn ${emotion === emp.id ? 'active' : ''}`}
            onClick={() => setEmotion(emp.id)}
            style={{ 
                '--btn-color': emp.color,
                transform: emotion === emp.id ? 'scale(1.1)' : 'scale(1)'
            } as any}
          >
            <span className="btn-icon">{emp.emoji}</span>
            <span className="btn-text">{emp.label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .gamified-stage {
          min-height: 100vh;
          background: radial-gradient(circle at center, #2d1b4d 0%, #151025 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: white;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        .ui-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .ui-header h1 {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -2px;
          margin: 0;
          background: linear-gradient(to bottom, #fff 40%, #888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ui-header h1 span {
          color: #fbbf24;
          -webkit-text-fill-color: #fbbf24;
          font-size: 24px;
          vertical-align: top;
          margin-left: 4px;
        }

        .status-pill {
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid #fbbf24;
          color: #fbbf24;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          display: inline-block;
          margin-top: 8px;
        }

        .character-container {
          position: relative;
          width: 400px;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .parrot-hero {
          width: 100%;
          height: 100%;
          z-index: 2;
          cursor: crosshair;
        }

        .floor-shadow {
          position: absolute;
          bottom: 20%;
          width: 160px;
          height: 40px;
          background: black;
          border-radius: 50%;
          filter: blur(15px);
          z-index: 1;
        }

        .game-controls {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 40px;
          width: 100%;
          max-width: 400px;
        }

        .game-btn {
          background: #251a3d;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-bottom-width: 6px;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.1s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #fff;
        }

        .game-btn:hover {
          background: #2d214d;
          transform: translateY(-2px);
        }

        .game-btn:active {
          transform: translateY(2px);
          border-bottom-width: 2px;
          margin-top: 4px;
        }

        .game-btn.active {
          border-color: var(--btn-color);
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-icon {
          font-size: 24px;
        }

        .btn-text {
          font-size: 13px;
          font-weight: 700;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
