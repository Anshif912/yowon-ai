import React, { useRef, useEffect } from 'react';

export default function ReportBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    // Initialize 40 extremely slow, glowing particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.05, // extremely slow
      vy: (Math.random() - 0.5) * 0.05,
      radius: Math.random() * 2.0 + 1.0,
      alpha: Math.random() * 0.18 + 0.08,
      pulseSpeed: 0.002 + Math.random() * 0.003,
      pulseDir: 1,
    }));

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          width = canvas.width = w;
          height = canvas.height = h;
          particles.forEach((p) => {
            if (p.x === 0 || p.x > w) p.x = Math.random() * w;
            if (p.y === 0 || p.y > h) p.y = Math.random() * h;
          });
        }
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Move slowly
        p.x += p.vx;
        p.y += p.vy;

        // Bounce/loop
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle alpha pulsation
        p.alpha += p.pulseSpeed * p.pulseDir;
        if (p.alpha > 0.3) p.pulseDir = -1;
        if (p.alpha < 0.06) p.pulseDir = 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
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
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen', opacity: 0.35 }}
    />
  );
}
