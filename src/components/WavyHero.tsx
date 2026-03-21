import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

const LINES: { text: string; emphasis: string }[] = [
  { text: 'FIND YOUR',  emphasis: '' },
  { text: 'PERFECT',   emphasis: 'P' },
  { text: 'RECIPE.',   emphasis: 'R' },
];
const MAX_ARC = 32;
const SPRING = { type: 'spring' as const, stiffness: 90, damping: 14, mass: 0.9 };

// Seeded pseudo-random so values are stable across renders
const seededRand = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

interface WavyLineProps {
  text: string;
  emphasis: string;
  mouseNorm: number;
  delay: number;
  seedOffset: number;
}

const WavyLine = ({ text, emphasis, mouseNorm, delay, seedOffset }: WavyLineProps) => {
  const chars = text.split('');
  const n = chars.length;

  const jitter = useMemo(() =>
    chars.map((char, i) => {
      const loud = emphasis.toUpperCase().includes(char.toUpperCase()) && char.trim() !== '';
      return {
        rotate: (seededRand(seedOffset + i * 3) - 0.5) * (loud ? 22 : 8),
        scale:   loud
          ? 0.9 + seededRand(seedOffset + i * 3 + 1) * 0.22
          : 0.94 + seededRand(seedOffset + i * 3 + 1) * 0.12,
        baseY:  (seededRand(seedOffset + i * 3 + 2) - 0.5) * (loud ? 16 : 10),
      };
    }),
  []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'block',
        fontFamily: '"Lilita One", sans-serif',
        fontSize: 'clamp(2rem, 10vw, 10rem)',
        color: 'var(--hero-color)',
        lineHeight: 1.25,
      }}
    >
      {chars.map((char, i) => {
        const t = n > 1 ? i / (n - 1) : 0.5;
        const arc = 0.35 + 0.65 * Math.sin(Math.PI * t);
        const loud = emphasis.toUpperCase().includes(char.toUpperCase()) && char.trim() !== '';
        const yOffset = jitter[i].baseY + (mouseNorm - 0.5) * MAX_ARC * arc * (loud ? 1.8 : 1);

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
    const handleMouse = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setMouseNorm(e.clientY / window.innerHeight)
      );
    };
    const handleTouch = (e: TouchEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setMouseNorm(e.touches[0].clientY / window.innerHeight)
      );
    };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h1 className="mb-10" style={{ overflow: 'visible', textAlign: 'center' }}>
      {LINES.map(({ text, emphasis }, i) => (
        <WavyLine key={text} text={text} emphasis={emphasis} mouseNorm={mouseNorm} delay={i * 0.15} seedOffset={i * 100} />
      ))}
    </h1>
  );
};
