import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

const LINES = ['FIND YOUR PERFECT', 'RECIPE.'];
const MAX_ARC = 70;
const SPRING = { type: 'spring' as const, stiffness: 90, damping: 14, mass: 0.9 };

// Seeded pseudo-random so values are stable across renders
const seededRand = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

interface WavyLineProps {
  text: string;
  mouseNorm: number;
  delay: number;
  seedOffset: number;
}

const WavyLine = ({ text, mouseNorm, delay, seedOffset }: WavyLineProps) => {
  const chars = text.split('');
  const n = chars.length;

  const jitter = useMemo(() =>
    chars.map((_, i) => ({
      rotate: (seededRand(seedOffset + i * 3) - 0.5) * 10,     // ±5deg
      scale:   0.92 + seededRand(seedOffset + i * 3 + 1) * 0.16, // 0.92–1.08
      baseY:  (seededRand(seedOffset + i * 3 + 2) - 0.5) * 14,  // ±7px baseline nudge
    })),
  []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        justifyContent: 'center',
        fontFamily: '"Lilita One", sans-serif',
        fontSize: 'clamp(2.5rem, 9.5vw, 10rem)',
        color: '#2D6A2D',
        lineHeight: 1.1,
      }}
    >
      {chars.map((char, i) => {
        const t = n > 1 ? i / (n - 1) : 0.5;
        const arc = 0.35 + 0.65 * Math.sin(Math.PI * t);
        const yOffset = jitter[i].baseY + (mouseNorm - 0.5) * MAX_ARC * arc;

        return (
          <motion.span
            key={i}
            animate={{ y: yOffset }}
            transition={SPRING}
            style={{
              display: 'inline-block',
              rotate: `${jitter[i].rotate}deg`,
              scale: jitter[i].scale,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </motion.div>
  );
};

export const WavyHero = () => {
  const [mouseNorm, setMouseNorm] = useState(0.5);

  useEffect(() => {
    let raf: number;
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setMouseNorm(e.clientY / window.innerHeight)
      );
    };
    window.addEventListener('mousemove', handle);
    return () => {
      window.removeEventListener('mousemove', handle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h1 className="leading-none mb-10" style={{ overflow: 'visible' }}>
      {LINES.map((line, i) => (
        <WavyLine key={line} text={line} mouseNorm={mouseNorm} delay={i * 0.15} seedOffset={i * 100} />
      ))}
    </h1>
  );
};
