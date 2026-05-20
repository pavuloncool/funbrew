/**
 * Circular confetti burst (not a square grid): particles spawn on a disk around the
 * fingerprint center with radial outward velocity — smooth omnidirectional explosion.
 */
import { useEffect, useRef, useState } from 'react';

export type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  rot: number;
  vr: number;
};

/** Max radius (px) for initial positions — disk, not a square lattice */
const SPAWN_DISK_R = 52;
const PARTICLE_COUNT = 220;

function buildParticles(ox: number, oy: number): ConfettiParticle[] {
  const pts: ConfettiParticle[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const placementAngle = Math.random() * Math.PI * 2;
    const placementR = SPAWN_DISK_R * Math.sqrt(Math.random());
    const px = ox + placementR * Math.cos(placementAngle);
    const py = oy + placementR * Math.sin(placementAngle);

    const outward = Math.atan2(py - oy, px - ox);
    const spread = (Math.random() - 0.5) * 0.45;
    const angle = outward + spread;
    const speed = 1.2 + Math.random() * 4.8;

    pts.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 0.55,
      size: Math.random() * 1.8 + 0.4,
      life: 1,
      decay: 0.004 + Math.random() * 0.008,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.12,
    });
  }

  return pts;
}

type UseFingerprintConfettiArgs = {
  burstKey: number;
  originX: number;
  originY: number;
  reduceMotion: boolean;
};

export function useFingerprintConfetti({
  burstKey,
  originX,
  originY,
  reduceMotion,
}: UseFingerprintConfettiArgs) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    if (reduceMotion || burstKey === 0) {
      particlesRef.current = [];
      setParticles([]);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const initial = buildParticles(originX, originY);
    particlesRef.current = initial;
    setParticles(initial);

    const tick = () => {
      const prev = particlesRef.current;
      if (prev.length === 0) {
        rafRef.current = null;
        return;
      }

      let allDead = true;
      const next: ConfettiParticle[] = [];
      for (const p of prev) {
        if (p.life <= 0) continue;
        const life = p.life - p.decay;
        if (life <= 0) continue;
        allDead = false;
        next.push({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.022,
          vx: p.vx * 0.995,
          life,
          rot: p.rot + p.vr,
        });
      }

      particlesRef.current = allDead ? [] : next;
      setParticles(allDead ? [] : next);

      if (!allDead) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [burstKey, originX, originY, reduceMotion]);

  return particles;
}
