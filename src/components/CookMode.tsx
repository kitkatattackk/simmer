import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Recipe } from '../types';

interface CookModeProps {
  recipe: Recipe;
  onClose: () => void;
}

function parseSteps(instructions: string): string[] {
  const numbered = instructions.split(/\n?\d+\.\s+/).filter(s => s.trim());
  if (numbered.length > 1) return numbered.map(s => s.trim());
  return instructions.split('\n').filter(s => s.trim());
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Confetti ---
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  opacity: number;
}

const CONFETTI_COLORS = ['#A8D5A2', '#F5F0E8', '#FFD700', '#FF8C69', '#87CEEB', '#DDA0DD'];

function spawnParticles(canvas: HTMLCanvasElement): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      width: 6 + Math.random() * 8,
      height: 3 + Math.random() * 5,
      opacity: 1,
    });
  }
  return particles;
}

function useConfetti(trigger: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = spawnParticles(canvas);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.025;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      });

      particles = particles.filter(p => p.opacity > 0);
      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger]);

  return canvasRef;
}

// --- Component ---
export const CookMode: React.FC<CookModeProps> = ({ recipe, onClose }) => {
  const steps = parseSteps(recipe.instructions);
  const [step, setStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);

  const confettiRef = useConfetti(done);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const go = useCallback((delta: number) => {
    setDirection(delta);
    setStep(s => Math.max(0, Math.min(steps.length - 1, s + delta)));
  }, [steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setTimerRunning(r => !r); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose, done]);

  const handleDone = () => {
    setTimerRunning(false);
    setDone(true);
    setTimeout(onClose, 2800);
  };

  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#1C3A1C' }}
    >
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="pointer-events-none absolute inset-0 z-10"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Done overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            <p className="font-display font-extrabold uppercase text-center leading-none" style={{ fontSize: 'clamp(3rem, 12vw, 7rem)', color: '#A8D5A2' }}>
              Enjoy!
            </p>
            <p className="mt-4 text-base font-semibold opacity-50 uppercase tracking-widest" style={{ color: '#F5F0E8' }}>
              {recipe.title}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className={`flex items-center justify-between px-6 py-4 flex-shrink-0 transition-opacity duration-300 ${done ? 'opacity-0' : 'opacity-100'}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: '#F5F0E8' }}>Now Cooking</p>
          <h1 className="font-display font-extrabold uppercase text-lg leading-tight" style={{ color: '#F5F0E8' }}>
            {recipe.title}
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-all"
          style={{ backgroundColor: 'rgba(245,240,232,0.12)', color: '#F5F0E8' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className={`px-6 mb-6 flex-shrink-0 transition-opacity duration-300 ${done ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ backgroundColor: i <= step ? '#A8D5A2' : 'rgba(245,240,232,0.2)' }}
            />
          ))}
        </div>
        <p className="text-xs mt-2 font-semibold opacity-40" style={{ color: '#F5F0E8' }}>
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Step content */}
      <div className={`flex-1 flex items-center justify-center px-6 md:px-16 overflow-hidden transition-opacity duration-300 ${done ? 'opacity-0' : 'opacity-100'}`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.p
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-center font-display font-bold uppercase leading-snug"
            style={{
              color: '#F5F0E8',
              fontSize: 'clamp(1.4rem, 4vw, 2.8rem)',
              maxWidth: '720px',
            }}
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className={`flex-shrink-0 px-6 pb-10 pt-6 transition-opacity duration-300 ${done ? 'opacity-0' : 'opacity-100'}`}>
        {/* Timer */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl"
            style={{ backgroundColor: 'rgba(245,240,232,0.1)' }}
          >
            <Timer size={16} style={{ color: '#A8D5A2' }} />
            <span className="font-mono text-xl font-bold tracking-wider" style={{ color: '#F5F0E8' }}>
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={() => setTimerRunning(r => !r)}
              className="p-1.5 rounded-full transition-all"
              style={{ backgroundColor: timerRunning ? '#A8D5A2' : 'rgba(245,240,232,0.15)', color: timerRunning ? '#1C3A1C' : '#F5F0E8' }}
            >
              {timerRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}
              className="p-1.5 rounded-full transition-all"
              style={{ backgroundColor: 'rgba(245,240,232,0.1)', color: '#F5F0E8', opacity: 0.6 }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Prev / Next */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => go(-1)}
            disabled={isFirst}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-20"
            style={{ backgroundColor: 'rgba(245,240,232,0.12)', color: '#F5F0E8' }}
          >
            <ChevronLeft size={18} />
            Prev
          </button>

          {isLast ? (
            <button
              onClick={handleDone}
              className="flex-1 py-3.5 rounded-2xl font-display font-bold uppercase tracking-wider text-sm transition-all"
              style={{ backgroundColor: '#A8D5A2', color: '#1C3A1C' }}
            >
              Done!
            </button>
          ) : (
            <button
              onClick={() => go(1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold uppercase tracking-wider text-sm transition-all"
              style={{ backgroundColor: '#A8D5A2', color: '#1C3A1C' }}
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
