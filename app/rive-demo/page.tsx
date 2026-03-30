'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Emotion = 'happy' | 'angry' | 'sad' | 'surprised' | 'laughing';

const EMOTIONS: { id: Emotion; emoji: string; label: string }[] = [
  { id: 'happy', emoji: '😊', label: '开心' },
  { id: 'laughing', emoji: '🤭', label: '傻笑' },
  { id: 'surprised', emoji: '😲', label: '惊讶' },
  { id: 'sad', emoji: '😢', label: '难过' },
  { id: 'angry', emoji: '😤', label: '生气' },
];

export default function RiveDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [headBob, setHeadBob] = useState(0);

  // Track mouse position (normalized 0-1)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Auto-blink every 2-5 seconds
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  // Head bobbing animation
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.03;
      setHeadBob(Math.sin(t) * 2);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // When hovered, switch to laughing
  useEffect(() => {
    if (isHovered) {
      setEmotion('laughing');
    } else {
      setEmotion('happy');
    }
  }, [isHovered]);

  // Eye tracking - calculate pupil offset
  const eyeOffsetX = (mousePos.x - 0.5) * 8;
  const eyeOffsetY = (mousePos.y - 0.5) * 5;
  const headTilt = (mousePos.x - 0.5) * 15; // head tilts toward mouse

  // Emotion-specific modifiers
  const getEyeShape = () => {
    if (isBlinking) return { scaleY: 0.1, eyebrowY: 0 };
    switch (emotion) {
      case 'happy':
      case 'laughing':
        return { scaleY: 1, eyebrowY: 0 };
      case 'angry':
        return { scaleY: 0.7, eyebrowY: 4 };
      case 'sad':
        return { scaleY: 0.8, eyebrowY: -3 };
      case 'surprised':
        return { scaleY: 1.3, eyebrowY: -5 };
      default:
        return { scaleY: 1, eyebrowY: 0 };
    }
  };

  const getBeakOpen = () => {
    switch (emotion) {
      case 'laughing': return 6;
      case 'surprised': return 8;
      case 'angry': return 3;
      default: return 0;
    }
  };

  const getCheekBlush = () => {
    return emotion === 'happy' || emotion === 'laughing';
  };

  const eyeShape = getEyeShape();
  const beakOpen = getBeakOpen();
  const showBlush = getCheekBlush();

  // Laughing wobble
  const laughWobble = emotion === 'laughing' ? Math.sin(Date.now() / 80) * 3 : 0;

  return (
    <div ref={containerRef} className="rive-demo-page">
      <div className="demo-header">
        <h1>🦜 小太阳鹦鹉 — Rive 动画 Demo</h1>
        <p>把鼠标移到鹦鹉身上，它会傻笑并转头看向你</p>
      </div>

      <div className="parrot-stage">
        <svg
          viewBox="0 0 400 500"
          className="parrot-svg"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* ═══ Background glow ═══ */}
          <defs>
            <radialGradient id="bodyGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="60%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF8C00" />
            </radialGradient>
            <radialGradient id="bellyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFED4A" />
              <stop offset="100%" stopColor="#FFD700" />
            </radialGradient>
            <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,100,100,0.6)" />
              <stop offset="100%" stopColor="rgba(255,100,100,0)" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.3)" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ═══ Ambient glow ═══ */}
          <ellipse cx="200" cy="380" rx="120" ry="30" fill="rgba(255,165,0,0.1)" />

          <g
            transform={`translate(200, 250) rotate(${headTilt + laughWobble}) translate(-200, ${-250 + headBob})`}
            style={{ transition: 'transform 0.15s ease-out' }}
            filter="url(#shadow)"
          >
            {/* ═══ Tail feathers ═══ */}
            <g>
              <ellipse cx="200" cy="420" rx="25" ry="60" fill="#2E8B57" transform="rotate(-10, 200, 420)" />
              <ellipse cx="200" cy="420" rx="22" ry="55" fill="#3CB371" transform="rotate(5, 200, 420)" />
              <ellipse cx="200" cy="420" rx="20" ry="50" fill="#228B22" transform="rotate(-3, 200, 420)" />
            </g>

            {/* ═══ Wings ═══ */}
            <ellipse cx="140" cy="280" rx="45" ry="80" fill="#2E8B57"
              transform={`rotate(${15 + (emotion === 'surprised' ? -10 : 0)}, 140, 280)`}
              style={{ transition: 'transform 0.3s ease' }}
            />
            <ellipse cx="260" cy="280" rx="45" ry="80" fill="#2E8B57"
              transform={`rotate(${-15 + (emotion === 'surprised' ? 10 : 0)}, 260, 280)`}
              style={{ transition: 'transform 0.3s ease' }}
            />
            {/* Wing detail */}
            <ellipse cx="138" cy="285" rx="35" ry="65" fill="#3CB371"
              transform={`rotate(${15 + (emotion === 'surprised' ? -10 : 0)}, 138, 285)`}
            />
            <ellipse cx="262" cy="285" rx="35" ry="65" fill="#3CB371"
              transform={`rotate(${-15 + (emotion === 'surprised' ? 10 : 0)}, 262, 285)`}
            />

            {/* ═══ Body ═══ */}
            <ellipse cx="200" cy="290" rx="75" ry="100" fill="url(#bodyGrad)" />

            {/* ═══ Belly ═══ */}
            <ellipse cx="200" cy="310" rx="50" ry="65" fill="url(#bellyGrad)" />

            {/* ═══ Feet ═══ */}
            <g>
              <ellipse cx="175" cy="385" rx="15" ry="8" fill="#888" />
              <ellipse cx="225" cy="385" rx="15" ry="8" fill="#888" />
              {/* Toes */}
              <circle cx="163" cy="388" r="4" fill="#777" />
              <circle cx="175" cy="390" r="4" fill="#777" />
              <circle cx="187" cy="388" r="4" fill="#777" />
              <circle cx="213" cy="388" r="4" fill="#777" />
              <circle cx="225" cy="390" r="4" fill="#777" />
              <circle cx="237" cy="388" r="4" fill="#777" />
            </g>

            {/* ═══ Head ═══ */}
            <circle cx="200" cy="180" r="65" fill="#FFD700" />

            {/* ═══ Face orange patch ═══ */}
            <ellipse cx="200" cy="195" rx="50" ry="40" fill="#FF8C00" opacity="0.5" />

            {/* ═══ Crown feathers / crest ═══ */}
            <ellipse cx="185" cy="120" rx="12" ry="20" fill="#FFD700" transform="rotate(-15, 185, 120)" />
            <ellipse cx="200" cy="115" rx="10" ry="22" fill="#FFED4A" />
            <ellipse cx="215" cy="120" rx="12" ry="20" fill="#FFD700" transform="rotate(15, 215, 120)" />

            {/* ═══ Eyes ═══ */}
            <g transform={`translate(0, ${eyeShape.eyebrowY * 0.3})`}>
              {/* Left eye white */}
              <ellipse cx={170 + eyeOffsetX * 0.3} cy="175" rx="18" ry={18 * eyeShape.scaleY}
                fill="white" stroke="#333" strokeWidth="1.5"
                style={{ transition: 'ry 0.12s ease' }}
              />
              {/* Left pupil */}
              <circle cx={170 + eyeOffsetX} cy={175 + eyeOffsetY} r="9"
                fill="#1a1a1a"
                style={{ transition: 'cx 0.1s ease, cy 0.1s ease' }}
              />
              {/* Left eye highlight */}
              <circle cx={166 + eyeOffsetX * 0.7} cy={171 + eyeOffsetY * 0.5} r="3.5" fill="white" />

              {/* Right eye white */}
              <ellipse cx={230 + eyeOffsetX * 0.3} cy="175" rx="18" ry={18 * eyeShape.scaleY}
                fill="white" stroke="#333" strokeWidth="1.5"
                style={{ transition: 'ry 0.12s ease' }}
              />
              {/* Right pupil */}
              <circle cx={230 + eyeOffsetX} cy={175 + eyeOffsetY} r="9"
                fill="#1a1a1a"
                style={{ transition: 'cx 0.1s ease, cy 0.1s ease' }}
              />
              {/* Right eye highlight */}
              <circle cx={226 + eyeOffsetX * 0.7} cy={171 + eyeOffsetY * 0.5} r="3.5" fill="white" />
            </g>

            {/* ═══ Eyebrows ═══ */}
            {emotion === 'angry' && (
              <g>
                <line x1="155" y1="160" x2="180" y2="155" stroke="#5a3e00" strokeWidth="3" strokeLinecap="round" />
                <line x1="245" y1="160" x2="220" y2="155" stroke="#5a3e00" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
            {emotion === 'sad' && (
              <g>
                <line x1="155" y1="155" x2="180" y2="160" stroke="#5a3e00" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="245" y1="155" x2="220" y2="160" stroke="#5a3e00" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}

            {/* ═══ Cheek blush ═══ */}
            {showBlush && (
              <g style={{ transition: 'opacity 0.3s' }}>
                <ellipse cx="148" cy="195" rx="16" ry="10" fill="url(#cheekGrad)" />
                <ellipse cx="252" cy="195" rx="16" ry="10" fill="url(#cheekGrad)" />
              </g>
            )}

            {/* ═══ Beak ═══ */}
            <g>
              {/* Upper beak */}
              <path
                d="M 188,200 Q 200,195 212,200 Q 206,215 200,218 Q 194,215 188,200 Z"
                fill="#444"
                stroke="#333"
                strokeWidth="1"
              />
              {/* Lower beak — opens based on emotion */}
              <path
                d={`M 192,${205 + beakOpen * 0.3} Q 200,${215 + beakOpen} 208,${205 + beakOpen * 0.3}`}
                fill="#555"
                stroke="#444"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ transition: 'd 0.2s ease' }}
              />
              {/* Mouth interior when open */}
              {beakOpen > 3 && (
                <ellipse cx="200" cy={212 + beakOpen * 0.5} rx={6} ry={beakOpen * 0.4}
                  fill="#c0392b" opacity="0.7"
                />
              )}
            </g>

            {/* ═══ Sad tear ═══ */}
            {emotion === 'sad' && (
              <g>
                <ellipse cx="170" cy="198" rx="3" ry="5" fill="rgba(100,180,255,0.7)">
                  <animate attributeName="cy" values="198;210;198" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                </ellipse>
              </g>
            )}

            {/* ═══ Angry steam puffs ═══ */}
            {emotion === 'angry' && (
              <g>
                <circle cx="145" cy="140" r="6" fill="rgba(255,255,255,0.4)">
                  <animate attributeName="cy" values="140;125;140" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="255" cy="140" r="6" fill="rgba(255,255,255,0.4)">
                  <animate attributeName="cy" values="140;125;140" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="150" cy="130" r="4" fill="rgba(255,255,255,0.3)">
                  <animate attributeName="cy" values="130;115;130" dur="0.9s" repeatCount="indefinite" />
                </circle>
                <circle cx="250" cy="130" r="4" fill="rgba(255,255,255,0.3)">
                  <animate attributeName="cy" values="130;115;130" dur="1.1s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* ═══ Laughing lines ═══ */}
            {emotion === 'laughing' && (
              <g opacity="0.4">
                <path d="M 148,190 Q 143,195 148,200" stroke="#5a3e00" strokeWidth="1.5" fill="none" />
                <path d="M 252,190 Q 257,195 252,200" stroke="#5a3e00" strokeWidth="1.5" fill="none" />
              </g>
            )}
          </g>
        </svg>

        {/* Emotion label */}
        <div className="emotion-badge">
          {EMOTIONS.find(e => e.id === emotion)?.emoji}{' '}
          {EMOTIONS.find(e => e.id === emotion)?.label}
        </div>
      </div>

      {/* Emotion buttons */}
      <div className="emotion-controls">
        {EMOTIONS.map(({ id, emoji, label }) => (
          <button
            key={id}
            className={`emotion-btn ${emotion === id ? 'active' : ''}`}
            onClick={() => setEmotion(id)}
            onMouseEnter={() => setIsHovered(false)}
          >
            <span className="emotion-emoji">{emoji}</span>
            <span className="emotion-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="demo-footer">
        <p>💡 鼠标悬停在鹦鹉上 → 傻笑转头 &nbsp;|&nbsp; 点击下方按钮切换表情 &nbsp;|&nbsp; 移动鼠标 → 眼睛跟踪</p>
      </div>

      <style>{`
        .rive-demo-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, 'Segoe UI', sans-serif;
          color: #e0e0e0;
          overflow: hidden;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .demo-header h1 {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(90deg, #FFD700, #FF8C00, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 6px;
        }

        .demo-header p {
          font-size: 14px;
          color: #999;
          margin: 0;
        }

        .parrot-stage {
          position: relative;
          width: 360px;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .parrot-svg {
          width: 100%;
          height: 100%;
          cursor: pointer;
          filter: drop-shadow(0 0 40px rgba(255, 165, 0, 0.15));
          transition: filter 0.3s;
        }

        .parrot-svg:hover {
          filter: drop-shadow(0 0 60px rgba(255, 165, 0, 0.3));
        }

        .emotion-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 14px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .emotion-controls {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .emotion-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 18px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #ccc;
        }

        .emotion-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .emotion-btn.active {
          background: rgba(255,165,0,0.15);
          border-color: #FF8C00;
          color: #FFD700;
        }

        .emotion-emoji {
          font-size: 26px;
        }

        .emotion-label {
          font-size: 12px;
        }

        .demo-footer {
          margin-top: 16px;
          text-align: center;
        }

        .demo-footer p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
