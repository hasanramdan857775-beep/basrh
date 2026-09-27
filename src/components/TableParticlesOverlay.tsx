import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import confetti from 'canvas-confetti';

export type ParticleType = 'eat' | 'sweep' | 'basra' | 'jack_basra';

export interface TableParticlesHandle {
  trigger: (type: ParticleType, x?: number, y?: number, points?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
  gravity: number;
  shape: 'circle' | 'star' | 'suit' | 'sparkle' | 'coin';
  suitSymbol?: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  isJack?: boolean;
}

export const TableParticlesOverlay = forwardRef<TableParticlesHandle, { className?: string }>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const animFrameRef = useRef<number | null>(null);

    // Resize canvas to parent container
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Main animation loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Shockwaves
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += 4.5;
          sw.alpha -= 0.025;

          if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
            shockwavesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = Math.max(0, sw.alpha);
          ctx.lineWidth = sw.lineWidth;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }

        // 2. Draw Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.rotation += p.rotSpeed;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.size <= 0.2) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;

          if (p.shape === 'star') {
            // Draw 4-point star / sparkle
            const r = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.quadraticCurveTo(0, 0, 0, r);
            ctx.quadraticCurveTo(0, 0, -r, 0);
            ctx.quadraticCurveTo(0, 0, 0, -r);
            ctx.fill();
          } else if (p.shape === 'suit' && p.suitSymbol) {
            ctx.font = `bold ${Math.round(p.size * 2)}px 'Cairo', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.suitSymbol, 0, 0);
          } else if (p.shape === 'coin') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FDE68A';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Standard circle / spark
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // 3. Draw Floating Score Texts (e.g. +10 باصرة!)
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const t = floatingTextsRef.current[i];
          t.y += t.vy;
          t.vy *= 0.94;
          t.alpha -= 0.015;
          t.scale = Math.min(1.2, t.scale + 0.02);

          if (t.alpha <= 0) {
            floatingTextsRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.scale(t.scale, t.scale);
          ctx.globalAlpha = Math.max(0, t.alpha);
          ctx.font = `900 ${t.isJack ? '28px' : '24px'} 'Cairo', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Glow shadow
          ctx.shadowColor = t.isJack ? '#F59E0B' : '#10B981';
          ctx.shadowBlur = 18;

          // Black stroke
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = 5;
          ctx.strokeText(t.text, 0, 0);

          // Fill text
          ctx.fillStyle = t.color;
          ctx.fillText(t.text, 0, 0);

          ctx.restore();
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, []);

    // Expose trigger method
    useImperativeHandle(ref, () => ({
      trigger: (type: ParticleType, customX?: number, customY?: number, points?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const centerX = customX ?? canvas.width / 2;
        const centerY = customY ?? canvas.height / 2;

        const suitList = ['♠️', '♥️', '♦️', '♣️', '★', '✨'];

        if (type === 'eat') {
          // 1. REGULAR CARD EAT: Punchy golden card sparklers & suit chips
          shockwavesRef.current.push({
            x: centerX,
            y: centerY,
            radius: 10,
            maxRadius: 75,
            color: '#F59E0B',
            alpha: 0.8,
            lineWidth: 3,
          });

          // 30 particles burst outward
          const colors = ['#F59E0B', '#FBBF24', '#FCD34D', '#FFFFFF', '#60A5FA'];
          for (let i = 0; i < 32; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 5.5;
            const isSuit = Math.random() > 0.65;

            particlesRef.current.push({
              x: centerX + (Math.random() - 0.5) * 20,
              y: centerY + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.5,
              size: isSuit ? 7 : 2 + Math.random() * 4,
              color: colors[Math.floor(Math.random() * colors.length)],
              alpha: 1,
              decay: 0.02 + Math.random() * 0.025,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.2,
              gravity: 0.08,
              shape: isSuit ? 'suit' : Math.random() > 0.4 ? 'star' : 'circle',
              suitSymbol: isSuit ? suitList[Math.floor(Math.random() * suitList.length)] : undefined,
            });
          }
        } else if (type === 'sweep') {
          // 2. JACK SWEEP: Sweeping wave of amber and glowing cards
          shockwavesRef.current.push({
            x: centerX,
            y: centerY,
            radius: 15,
            maxRadius: 110,
            color: '#3B82F6',
            alpha: 0.9,
            lineWidth: 4,
          });

          const sweepColors = ['#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#FFFFFF'];
          for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3.5 + Math.random() * 7;
            particlesRef.current.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1,
              size: 3 + Math.random() * 5,
              color: sweepColors[Math.floor(Math.random() * sweepColors.length)],
              alpha: 1,
              decay: 0.018 + Math.random() * 0.02,
              rotation: Math.random() * Math.PI,
              rotSpeed: (Math.random() - 0.5) * 0.25,
              gravity: 0.06,
              shape: Math.random() > 0.5 ? 'star' : 'sparkle',
            });
          }
        } else if (type === 'basra' || type === 'jack_basra') {
          // 3. BASRA / JACK BASRA: EPIC MULTI-LAYER PARTICLES & CELEBRATION!
          const isJack = type === 'jack_basra';

          // Double expanding shockwaves
          shockwavesRef.current.push({
            x: centerX,
            y: centerY,
            radius: 10,
            maxRadius: 160,
            color: isJack ? '#EF4444' : '#F59E0B',
            alpha: 1,
            lineWidth: 5,
          });
          shockwavesRef.current.push({
            x: centerX,
            y: centerY,
            radius: 5,
            maxRadius: 120,
            color: '#FFFFFF',
            alpha: 0.8,
            lineWidth: 3,
          });

          // Floating score text
          floatingTextsRef.current.push({
            x: centerX,
            y: centerY - 25,
            vy: -2.8,
            text: isJack ? `🔥 باصرة ولد! +${points ?? 20}` : `💥 باصرة! +${points ?? 10}`,
            color: isJack ? '#FDE047' : '#F59E0B',
            alpha: 1,
            scale: 0.8,
            isJack,
          });

          // 90-120 high energy particles
          const basraColors = isJack
            ? ['#EF4444', '#F59E0B', '#FCD34D', '#DC2626', '#FFFFFF', '#F97316']
            : ['#F59E0B', '#10B981', '#3B82F6', '#FCD34D', '#FFFFFF', '#EC4899'];

          const particleTotal = isJack ? 110 : 80;
          for (let i = 0; i < particleTotal; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 9;
            const isCoinOrStar = Math.random() > 0.45;

            particlesRef.current.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1.8,
              size: isCoinOrStar ? 4 + Math.random() * 5 : 2 + Math.random() * 4,
              color: basraColors[Math.floor(Math.random() * basraColors.length)],
              alpha: 1,
              decay: 0.014 + Math.random() * 0.018,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.35,
              gravity: 0.12,
              shape: isCoinOrStar ? (Math.random() > 0.5 ? 'coin' : 'star') : 'circle',
            });
          }

          // Trigger full screen confetti cannons
          try {
            confetti({
              particleCount: isJack ? 80 : 55,
              spread: 70,
              origin: { x: 0.3, y: 0.6 },
              colors: basraColors,
            });
            confetti({
              particleCount: isJack ? 80 : 55,
              spread: 70,
              origin: { x: 0.7, y: 0.6 },
              colors: basraColors,
            });
          } catch {}
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none z-30 w-full h-full ${className}`}
      />
    );
  }
);

TableParticlesOverlay.displayName = 'TableParticlesOverlay';
