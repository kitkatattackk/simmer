import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ChefHat, Flame, Utensils, Heart, Share2, Check, UtensilsCrossed } from 'lucide-react';
import { Recipe } from '../types';
import Markdown from 'react-markdown';
import { CookMode } from './CookMode';

interface RecipeModalProps {
  recipe: Recipe | null;
  isSaved: boolean;
  onSaveToggle: () => void;
  onClose: () => void;
}

const BURST_COLORS = ['#A8D5A2', '#1C3A1C', '#FFD700', '#FF8C69', '#F5F0E8'];
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isSaved, onSaveToggle, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const [cookMode, setCookMode] = React.useState(false);
  const [burstKey, setBurstKey] = React.useState(0);

  const handleSave = () => {
    if (!isSaved) setBurstKey(k => k + 1);
    onSaveToggle();
  };

  if (!recipe) return null;

  if (cookMode) {
    return (
      <AnimatePresence>
        <CookMode recipe={recipe} onClose={() => setCookMode(false)} />
      </AnimatePresence>
    );
  }

  const handleShare = async () => {
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(28,58,28,0.5)', backdropFilter: 'blur(4px)' }}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#F5F0E8' }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 flex-shrink-0 border-b"
            style={{ borderColor: 'rgba(28,58,28,0.12)' }}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setCookMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                style={{ backgroundColor: '#1C3A1C', color: '#F5F0E8' }}
              >
                <UtensilsCrossed size={14} />
                Cook
              </button>
              <div className="relative">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                  style={isSaved
                    ? { backgroundColor: '#1C3A1C', color: '#F5F0E8' }
                    : { backgroundColor: '#EDE7D9', color: '#1C3A1C' }}
                >
                  <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <AnimatePresence>
                  {burstKey > 0 && BURST_ANGLES.map((angle, i) => (
                    <motion.span
                      key={`${burstKey}-${angle}`}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        x: Math.cos((angle * Math.PI) / 180) * 28,
                        y: Math.sin((angle * Math.PI) / 180) * 28,
                        scale: 0.4,
                      }}
                      exit={{}}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.02 }}
                      className="pointer-events-none absolute rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        top: '50%',
                        left: '50%',
                        marginTop: -3.5,
                        marginLeft: -3.5,
                        backgroundColor: BURST_COLORS[i % BURST_COLORS.length],
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                style={copied
                  ? { backgroundColor: '#2D5A2D', color: '#F5F0E8' }
                  : { backgroundColor: '#EDE7D9', color: '#1C3A1C' }}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all"
              style={{ backgroundColor: '#EDE7D9', color: '#1C3A1C' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto custom-scrollbar px-4 md:px-10 py-6 md:py-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: '#D6EDD6', color: '#1C5C1C' }}>
                {recipe.meatType}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: '#FDECC8', color: '#7A4B00' }}>
                {recipe.spiciness}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display font-extrabold uppercase leading-tight mb-4" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', color: '#1C3A1C' }}>
              {recipe.title}
            </h2>

            {/* Description */}
            <p className="text-base leading-relaxed mb-8" style={{ color: '#4A6A4A' }}>
              {recipe.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#EDE7D9' }}>
                <Clock size={18} style={{ color: '#2D5A2D' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#1C3A1C', opacity: 0.5 }}>Time</p>
                  <p className="text-sm font-semibold" style={{ color: '#1C3A1C' }}>{recipe.prepTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#EDE7D9' }}>
                <ChefHat size={18} style={{ color: '#2D5A2D' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#1C3A1C', opacity: 0.5 }}>Skill</p>
                  <p className="text-sm font-semibold" style={{ color: '#1C3A1C' }}>{recipe.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Utensils size={18} style={{ color: '#2D5A2D' }} />
                <h3 className="font-display font-bold uppercase tracking-wide text-sm" style={{ color: '#1C3A1C' }}>Ingredients</h3>
              </div>
              <ul className="grid gap-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#4A6A4A' }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#2D5A2D' }} />
                    {ing}
                  </li>
                ))}
              </ul>
            </section>

            {/* Instructions */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={18} style={{ color: '#2D5A2D' }} />
                <h3 className="font-display font-bold uppercase tracking-wide text-sm" style={{ color: '#1C3A1C' }}>Instructions</h3>
              </div>
              <div className="markdown-body prose prose-sm max-w-none text-sm" style={{ color: '#4A6A4A' }}>
                <Markdown>{recipe.instructions}</Markdown>
              </div>
            </section>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2 pb-2">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1C3A1C', opacity: 0.35 }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
