import React, { useRef, useEffect } from 'react';

export type AccentTheme =
  | 'executive'
  | 'architecture'
  | 'security'
  | 'innovation'
  | 'business'
  | 'recommendation'
  | 'timeline'
  | 'repository'
  | 'performance'
  | 'neutral';

interface CardProps {
  children: React.ReactNode;
  accent: AccentTheme;
  className?: string;
  onClick?: () => void;
}

const THEMES: Record<AccentTheme, { borderHover: string; glow: string; text: string }> = {
  executive:      { borderHover: 'rgba(6, 182, 212, 0.45)',  glow: '6, 182, 212', text: 'text-cyan-400' },
  architecture:   { borderHover: 'rgba(139, 92, 246, 0.45)', glow: '139, 92, 246', text: 'text-purple-400' },
  security:       { borderHover: 'rgba(239, 68, 68, 0.45)',   glow: '239, 68, 68', text: 'text-red-400' },
  innovation:     { borderHover: 'rgba(236, 72, 153, 0.45)',  glow: '236, 72, 153', text: 'text-pink-400' },
  business:       { borderHover: 'rgba(16, 185, 129, 0.45)',  glow: '16, 185, 129', text: 'text-emerald-400' },
  recommendation: { borderHover: 'rgba(245, 158, 11, 0.45)',  glow: '245, 158, 11', text: 'text-amber-400' },
  timeline:       { borderHover: 'rgba(6, 182, 212, 0.45)',  glow: '6, 182, 212', text: 'text-cyan-400' },
  repository:     { borderHover: 'rgba(139, 92, 246, 0.45)', glow: '139, 92, 246', text: 'text-purple-400' },
  performance:    { borderHover: 'rgba(59, 130, 246, 0.45)',  glow: '59, 130, 246', text: 'text-blue-400' },
  neutral:        { borderHover: 'rgba(113, 113, 122, 0.45)', glow: '113, 113, 122', text: 'text-zinc-400' },
};

function LiveWorkspaceParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth || 300;
    let height = canvas.height = canvas.offsetHeight || 240;

    const particles = Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.12 + 0.05
    }));

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          width = canvas.width = w;
          height = canvas.height = h;
        }
      }
    });
    resizeObserver.observe(canvas);

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 opacity-80"
    />
  );
}

export default function PremiumWorkspaceCard({ children, accent, className = '', onClick }: CardProps) {
  const theme = THEMES[accent] || THEMES.neutral;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-[18px] p-8 overflow-hidden bg-[#0c1017]/85 backdrop-blur-[16px] border border-zinc-800 text-zinc-100 w-full text-left transition-all duration-200 ease-out select-text ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        boxShadow: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.borderHover;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.borderHover}, 0 0 18px rgba(${theme.glow}, 0.18), 0 0 42px rgba(${theme.glow}, 0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <LiveWorkspaceParticles />
      <div className="relative z-10 flex flex-col h-full w-full justify-between">
        {children}
      </div>
    </div>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  accent: AccentTheme;
}

export function WorkspaceHeader({ title, subtitle, icon, badge, accent }: HeaderProps) {
  const theme = THEMES[accent] || THEMES.neutral;

  return (
    <div className="w-full space-y-4 mb-6 relative z-10 select-none">
      {/* Top row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
              {icon}
            </span>
          )}
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">
            {title}
          </span>
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 rounded border border-white/5 bg-zinc-900 text-zinc-400 font-mono text-[12px] uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle / Descriptive area */}
      {subtitle && (
        <div className="space-y-1 mt-4">
          <h2 className="text-2xl font-extrabold text-white font-display leading-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xl">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

interface BodyProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceBody({ children, className = '' }: BodyProps) {
  return (
    <div className={`flex-1 w-full relative z-10 ${className}`}>
      {children}
    </div>
  );
}

interface FooterProps {
  label?: string;
  actionText?: string;
  accent: AccentTheme;
}

export function WorkspaceFooter({ label = 'Intelligence Workspace', actionText = 'Explore', accent }: FooterProps) {
  const theme = THEMES[accent] || THEMES.neutral;

  return (
    <div className="w-full pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between relative z-10 text-[11px] font-mono select-none">
      <span className="text-zinc-500 uppercase tracking-wider font-extrabold">
        {label}
      </span>
      <span className={`flex items-center gap-1.5 font-bold uppercase tracking-wider ${theme.text} shrink-0`}>
        {actionText} <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
      </span>
    </div>
  );
}
