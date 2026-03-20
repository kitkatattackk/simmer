import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Recipe } from '../types';
import { Clock, ChefHat, Heart, Share2, Check, X, Flame } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onSaveToggle: () => void;
  onClick: (recipe: Recipe) => void;
}

const SPICE_COLORS: Record<string, { bg: string; text: string }> = {
  'Mild':      { bg: '#D6EDD6', text: '#1C5C1C' },
  'Medium':    { bg: '#FDECC8', text: '#7A4B00' },
  'Hot':       { bg: '#FDDAD6', text: '#8B1A0E' },
  'Extra Hot': { bg: '#F0D0F0', text: '#5A0F5A' },
};

const SPICE_ANIM: Record<string, { duration: number; scale: number[]; opacity: number[]; y?: number[] }> = {
  'Mild':      { duration: 2.2, scale: [1, 1.1, 1],        opacity: [0.6, 1, 0.6] },
  'Medium':    { duration: 1.2, scale: [1, 1.18, 1],       opacity: [0.5, 1, 0.5] },
  'Hot':       { duration: 0.65, scale: [0.9, 1.25, 0.9],  opacity: [0.4, 1, 0.4], y: [0, -1, 0] },
  'Extra Hot': { duration: 0.35, scale: [0.85, 1.35, 0.85],opacity: [0.3, 1, 0.3], y: [0, -2, 0] },
};

const BURST_COLORS = ['#A8D5A2', '#1C3A1C', '#FFD700', '#FF8C69', '#F5F0E8'];
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SWIPE_THRESHOLD = 80;

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSaved, onSaveToggle, onClick }) => {
  const [copied, setCopied] = React.useState(false);
  const [burstKey, setBurstKey] = React.useState(0);
  const dragX = useMotionValue(0);
  const isDragging = React.useRef(false);

  // Reactive styles driven by drag position
  const saveOverlayOpacity = useTransform(dragX, [0, SWIPE_THRESHOLD], [0, 1]);
  const skipOverlayOpacity = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const cardRotate = useTransform(dragX, [-150, 150], [-4, 4]);

  const spice = SPICE_COLORS[recipe.spiciness] ?? { bg: '#E8E8E8', text: '#333' };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSaved) setBurstKey(k => k + 1);
    onSaveToggle();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text: recipe.description, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${recipe.title}\n\n${recipe.description}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > SWIPE_THRESHOLD && !isSaved) {
      setBurstKey(k => k + 1);
      onSaveToggle();
    } else if (info.offset.x < -SWIPE_THRESHOLD && isSaved) {
      onSaveToggle();
    }
    dragX.set(0);
  };

  return (
    <motion.div
      className="cursor-pointer group relative"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      dragMomentum={false}
      style={{ rotate: cardRotate, x: dragX }}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        if (isDragging.current) { isDragging.current = false; return; }
        onClick(recipe);
      }}
      onPointerUp={() => { setTimeout(() => { isDragging.current = false; }, 0); }}
    >
      {/* Save indicator (swipe right) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl flex items-center justify-start pl-5 z-10"
        style={{ opacity: saveOverlayOpacity, backgroundColor: 'rgba(168,213,162,0.35)', border: '2px solid #A8D5A2' }}
      >
        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider" style={{ color: '#1C5C1C' }}>
          <Heart size={18} fill="currentColor" />
          Save
        </div>
      </motion.div>

      {/* Skip indicator (swipe left) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl flex items-center justify-end pr-5 z-10"
        style={{ opacity: skipOverlayOpacity, backgroundColor: 'rgba(200,80,60,0.12)', border: '2px solid rgba(200,80,60,0.4)' }}
      >
        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider" style={{ color: '#8B1A0E' }}>
          Skip
          <X size={18} />
        </div>
      </motion.div>

      <div
        className="rounded-2xl p-5 border transition-shadow duration-200 group-hover:shadow-lg"
        style={{ backgroundColor: '#fff', borderColor: 'rgba(28,58,28,0.12)' }}
      >
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: spice.bg, color: spice.text }}
            >
              {SPICE_ANIM[recipe.spiciness] && (
                <motion.span
                  animate={{
                    scale: SPICE_ANIM[recipe.spiciness].scale,
                    opacity: SPICE_ANIM[recipe.spiciness].opacity,
                    y: SPICE_ANIM[recipe.spiciness].y ?? [0, 0, 0],
                  }}
                  transition={{ duration: SPICE_ANIM[recipe.spiciness].duration, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'inline-flex' }}
                >
                  <Flame size={10} fill="currentColor" />
                </motion.span>
              )}
              {recipe.spiciness}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#EDE7D9', color: '#1C3A1C' }}
            >
              {recipe.meatType}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {/* Heart + burst */}
            <div className="relative">
              <button
                onClick={handleSave}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: isSaved ? '#c0392b' : '#1C3A1C', opacity: isSaved ? 1 : 0.35 }}
              >
                <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <AnimatePresence>
                {burstKey > 0 && BURST_ANGLES.map((angle, i) => (
                  <motion.span
                    key={`${burstKey}-${angle}`}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: Math.cos((angle * Math.PI) / 180) * 22,
                      y: Math.sin((angle * Math.PI) / 180) * 22,
                      scale: 0.4,
                    }}
                    exit={{}}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.02 }}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      top: '50%',
                      left: '50%',
                      marginTop: -3,
                      marginLeft: -3,
                      backgroundColor: BURST_COLORS[i % BURST_COLORS.length],
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: copied ? '#2D5A2D' : '#1C3A1C', opacity: copied ? 1 : 0.35 }}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-display font-bold uppercase leading-tight mb-2 transition-colors"
          style={{ fontSize: '1.05rem', color: '#1C3A1C' }}
        >
          {recipe.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed line-clamp-2 mb-5" style={{ color: '#4A6A4A' }}>
          {recipe.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs font-medium" style={{ color: '#1C3A1C', opacity: 0.5 }}>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {recipe.prepTime}
          </span>
          <span className="flex items-center gap-1.5">
            <ChefHat size={12} />
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
