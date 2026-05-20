'use client';

/**
 * Pierwotny animated-splash z apps/frontend/src/AnimatedSplash.jsx.
 * Assety: public/assets/home-print.svg, public/assets/home-bean.svg (zsynchronizuj przy zmianach w frontend).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const fingerprintSvg = '/assets/home-print.svg';
const beanSvg = '/assets/home-bean.svg';

/** Ms from tap until fingerprint dissolves and canvas confetti runs */
const MS_TO_DISSOLVE = 480;
/**
 * Confetti burst window for scheduling — bean fade starts at 80% into this phase (after dissolve).
 * Sequence: launch → tap → confetti → @ 80% of burst → bean fades in from white (no slide).
 */
const CONFETTI_BURST_PHASE_MS = 2000;
const BEAN_PHASE_START_MS = MS_TO_DISSOLVE + 0.8 * CONFETTI_BURST_PHASE_MS;

function useDustCanvas(
  active: boolean,
  anchorRef: RefObject<HTMLImageElement | null>,
  onDone: (() => void) | null | undefined
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const SW = window.innerWidth;
    const SH = window.innerHeight;
    canvas.width = SW;
    canvas.height = SH;

    const anchor = anchorRef.current;
    const rect = anchor
      ? anchor.getBoundingClientRect()
      : { left: SW / 2 - 64, top: SH / 2 - 64, width: 128, height: 128 };

    const IW = Math.round(rect.width);
    const IH = Math.round(rect.height);
    const off = document.createElement('canvas');
    off.width = IW;
    off.height = IH;
    const octx = off.getContext('2d');
    if (!octx) return;

    const svgImage = new window.Image();
    svgImage.onload = () => {
      octx.drawImage(svgImage, 0, 0, IW, IH);
      const imgData = octx.getImageData(0, 0, IW, IH).data;

      const cx = rect.left + IW / 2;
      const cy = rect.top + IH / 2;
      const pts: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        life: number;
        decay: number;
      }[] = [];

      for (let y = 0; y < IH; y += 3) {
        for (let x = 0; x < IW; x += 3) {
          const i = (y * IW + x) * 4;
          if (imgData[i + 3]! > 80) {
            const sx2 = rect.left + x;
            const sy2 = rect.top + y;
            const angle = Math.atan2(sy2 - cy, sx2 - cx) + (Math.random() - 0.5) * 0.9;
            const speed = 1.2 + Math.random() * 4.5;
            pts.push({
              x: sx2,
              y: sy2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - Math.random() * 0.6,
              size: Math.random() * 1.8 + 0.4,
              life: 1.0,
              decay: 0.004 + Math.random() * 0.008,
            });
          }
        }
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const step = () => {
        ctx.clearRect(0, 0, SW, SH);
        let allDead = true;
        for (const p of pts) {
          if (p.life <= 0) continue;
          allDead = false;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.022;
          p.vx *= 0.995;
          p.life -= p.decay;
          const g = Math.round(60 + (1 - p.life) * 160);
          ctx.globalAlpha = Math.max(0, p.life * 0.9);
          ctx.fillStyle = `rgb(${g},${g},${g})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (allDead) {
          onDone?.();
          return;
        }
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    };

    svgImage.src = fingerprintSvg;
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [active, anchorRef, onDone]);

  return canvasRef;
}

export type AnimatedSplashProps = {
  onFinish: () => void;
};

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const [stage, setStage] = useState<'idle' | 'press' | 'burst' | 'dissolve' | 'bean'>('idle');
  const [finished, setFinished] = useState(false);
  const anchorRef = useRef<HTMLImageElement>(null);

  const dustActive = stage === 'dissolve' || stage === 'bean';
  const canvasRef = useDustCanvas(dustActive, anchorRef, null);

  const handleTap = useCallback(() => {
    if (stage !== 'idle') return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(14);
    }
    setStage('press');
    window.setTimeout(() => setStage('burst'), 220);
    window.setTimeout(() => setStage('dissolve'), MS_TO_DISSOLVE);
    window.setTimeout(() => setStage('bean'), BEAN_PHASE_START_MS);
  }, [stage]);

  const handleBeanTap = useCallback(() => {
    if (finished || stage !== 'bean') return;
    setFinished(true);
    onFinish();
  }, [finished, onFinish, stage]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-vs-elevated">
      {(stage === 'dissolve' || stage === 'bean') && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {(stage === 'idle' || stage === 'press' || stage === 'burst' || stage === 'dissolve') && (
          <motion.div
            key="fingerprint"
            role="button"
            tabIndex={0}
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTap();
              }
            }}
            style={{
              position: 'relative',
              width: 128,
              height: 128,
              cursor: stage === 'idle' ? 'pointer' : 'default',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              stage === 'idle'
                ? { opacity: 1, scale: 1 }
                : stage === 'press'
                  ? { scale: 0.85, opacity: 1 }
                  : stage === 'burst'
                    ? { scale: 0.75, opacity: 1 }
                    : { scale: 1, opacity: 0 }
            }
            transition={
              stage === 'idle'
                ? { duration: 1.8, ease: 'easeOut' }
                : stage === 'press'
                  ? { duration: 0.2, ease: 'easeOut' }
                  : stage === 'burst'
                    ? { duration: 0.25, ease: 'easeOut' }
                    : { duration: 0.15, ease: 'easeOut' }
            }
          >
            <img
              ref={anchorRef}
              src={fingerprintSvg}
              alt="Fingerprint"
              style={{ width: '100%', height: '100%' }}
            />
            <p
              style={{
                margin: '16px -16px 0',
                textAlign: 'center',
                fontSize: '2.5rem',
                letterSpacing: '0.04em',
                lineHeight: 1.55,
                color: '#1a1a1a',
                fontFamily: "'Cal Sans', system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              fun•brew
            </p>
          </motion.div>
        )}

        {stage === 'bean' && (
          <motion.div
            key="bean"
            style={{ width: 128, height: 128 }}
            role="button"
            tabIndex={0}
            onClick={handleBeanTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBeanTap();
              }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { duration: 1.25, ease: [0.22, 1, 0.36, 1] } }}
          >
            <img src={beanSvg} alt="Coffee Bean" style={{ width: '100%', height: '100%' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
