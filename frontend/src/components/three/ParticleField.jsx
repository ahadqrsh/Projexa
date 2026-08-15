import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

const ParticleField = ({
  className,
  count = 90,
  connectionDistance = 130,
  speed = 0.00022,
  interactive = true,
}) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const radius = 190;
    const points = Array.from({ length: count }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.65 + Math.random() * 0.35);
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        seed: Math.random(),
      };
    });

    const readTokens = () => {
      const styles = getComputedStyle(document.documentElement);
      return {
        primary: styles.getPropertyValue('--primary-500').trim() || '99 102 241',
        accent: styles.getPropertyValue('--accent-500').trim() || '168 85 247',
        cyber: styles.getPropertyValue('--cyber-500').trim() || '34 211 238',
      };
    };
    let tokens = readTokens();

    const themeObserver = new MutationObserver(() => {
      tokens = readTokens();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    if (interactive) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    const focal = 520;
    let tiltX = 0;
    let tiltY = 0;

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      const pointer = pointerRef.current;
      const targetX = pointer.active ? pointer.y * 0.5 : 0;
      const targetY = pointer.active ? pointer.x * 0.5 : 0;
      tiltX += (targetX - tiltX) * 0.045;
      tiltY += (targetY - tiltY) * 0.045;

      const spin = prefersReducedMotion ? 0 : time * speed;
      const cx = width / 2;
      const cy = height / 2;

      const projected = points.map((point) => {
        const cosY = Math.cos(spin + tiltY);
        const sinY = Math.sin(spin + tiltY);
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;

        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);
        const y2 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;

        const scale = focal / (focal + z2);
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          depth: scale,
          seed: point.seed,
        };
      });

      projected.sort((a, b) => a.depth - b.depth);

      for (let i = 0; i < projected.length; i += 1) {
        for (let j = i + 1; j < projected.length; j += 1) {
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const distance = Math.hypot(dx, dy);
          if (distance > connectionDistance) continue;

          const strength = (1 - distance / connectionDistance) * 0.35;
          const depth = (projected[i].depth + projected[j].depth) / 2;
          ctx.strokeStyle = `rgb(${tokens.primary} / ${strength * depth})`;
          ctx.lineWidth = 0.6 * depth;
          ctx.beginPath();
          ctx.moveTo(projected[i].sx, projected[i].sy);
          ctx.lineTo(projected[j].sx, projected[j].sy);
          ctx.stroke();
        }
      }

      for (const point of projected) {
        const palette =
          point.seed > 0.72 ? tokens.cyber : point.seed > 0.4 ? tokens.accent : tokens.primary;
        const size = Math.max(0.6, point.depth * 1.9);

        ctx.fillStyle = `rgb(${palette} / ${Math.min(point.depth * 0.85, 0.95)})`;
        ctx.beginPath();
        ctx.arc(point.sx, point.sy, size, 0, Math.PI * 2);
        ctx.fill();

        if (point.depth > 1.05) {
          ctx.fillStyle = `rgb(${palette} / 0.12)`;
          ctx.beginPath();
          ctx.arc(point.sx, point.sy, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      themeObserver.disconnect();
      if (interactive) {
        window.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
      }
    };
  }, [count, connectionDistance, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none h-full w-full', className)}
    />
  );
};

export default ParticleField;
