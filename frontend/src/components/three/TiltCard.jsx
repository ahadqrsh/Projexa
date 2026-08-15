import { useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';

const TiltCard = ({ children, className, maxTilt = 9, glare = true, scale = 1.02 }) => {
  const sceneRef = useRef(null);
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const handleMove = useCallback(
    (event) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = -(py - 0.5) * maxTilt * 2;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

      if (glare && glareRef.current) {
        glareRef.current.style.opacity = '1';
        glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgb(var(--primary-400) / 0.22), transparent 55%)`;
      }
    },
    [maxTilt, scale, glare]
  );

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  }, []);

  return (
    <div ref={sceneRef} className="tilt-scene" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div ref={cardRef} className={cn('tilt-card relative', className)}>
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
};

export default TiltCard;
