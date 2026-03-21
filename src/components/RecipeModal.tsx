import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ChefHat, Flame, Utensils, Heart, Share2, Check, UtensilsCrossed, ImageDown, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Recipe } from '../types';
import Markdown from 'react-markdown';
import { CookMode } from './CookMode';
import html2canvas from 'html2canvas';

interface RecipeModalProps {
  recipe: Recipe | null;
  isSaved: boolean;
  onSaveToggle: () => void;
  onClose: () => void;
  groceryList: string[];
  onGroceryToggle: (item: string) => void;
  onGroceryClear: (items: string[]) => void;
}

const BURST_COLORS = ['#A8D5A2', '#1C3A1C', '#FFD700', '#FF8C69', '#F5F0E8'];
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isSaved, onSaveToggle, onClose, groceryList, onGroceryToggle, onGroceryClear }) => {
  const [copied, setCopied] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [cookMode, setCookMode] = React.useState(false);
  const [burstKey, setBurstKey] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

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
    if (!contentRef.current || capturing) return;
    setCapturing(true);
    try {
      const el = contentRef.current;
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#F5F0E8';
      const canvas = await html2canvas(el, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
        width: el.offsetWidth,
        height: el.scrollHeight,
        windowWidth: el.offsetWidth,
        windowHeight: el.scrollHeight,
        scrollY: 0,
      });

      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob(b => res(b!), 'image/png')
      );
      const file = new File([blob], `${recipe.title}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: recipe.title });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recipe.title}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setCapturing(false);
    }
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
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.8 }}
          className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 flex-shrink-0 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setCookMode(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                style={{ backgroundColor: '#1C3A1C', color: '#F5F0E8' }}
              >
                <UtensilsCrossed size={14} />
                <span className="hidden sm:inline">Cook</span>
              </button>
              <div className="relative">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                  style={isSaved
                    ? { backgroundColor: '#1C3A1C', color: '#F5F0E8' }
                    : { backgroundColor: 'var(--surface-alt)', color: 'var(--on-surface)' }}
                >
                  <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                  <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
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
                disabled={capturing}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                style={copied
                  ? { backgroundColor: '#2D5A2D', color: '#F5F0E8' }
                  : { backgroundColor: 'var(--surface-alt)', color: 'var(--on-surface)', opacity: capturing ? 0.6 : 1 }}
              >
                {copied ? <Check size={14} /> : capturing ? <ImageDown size={14} className="animate-pulse" /> : <Share2 size={14} />}
                <span className="hidden sm:inline">{copied ? 'Saved!' : capturing ? 'Capturing…' : 'Share'}</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--on-surface)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div ref={contentRef} className="overflow-y-auto custom-scrollbar">

            {/* Dark green hero — badges, title, description */}
            <div className="px-6 md:px-10 pt-7 pb-8" style={{ backgroundColor: '#2D472C' }}>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#F5F0E8' }}>
                  {recipe.meatType}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#F5F0E8' }}>
                  {recipe.spiciness}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display font-extrabold uppercase leading-tight mb-3" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', color: '#F5F0E8' }}>
                {recipe.title}
              </h2>

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.75)' }}>
                {recipe.description}
              </p>
            </div>

            {/* Cream body */}
            <div className="px-6 md:px-10 pt-7 pb-8 space-y-8" style={{ backgroundColor: 'var(--surface)' }}>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-alt)' }}>
                <Clock size={18} style={{ color: '#2D5A2D' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--on-surface)', opacity: 0.5 }}>Time</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{recipe.prepTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-alt)' }}>
                <ChefHat size={18} style={{ color: '#2D5A2D' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--on-surface)', opacity: 0.5 }}>Skill</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{recipe.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Utensils size={18} style={{ color: '#2D5A2D' }} />
                <h3 className="font-display font-bold uppercase tracking-wide text-sm" style={{ color: 'var(--on-surface)' }}>Ingredients</h3>
              </div>
              <ul className="grid gap-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#2D5A2D' }} />
                    {ing.amount && (
                      <span className="flex-shrink-0 font-semibold text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--on-surface)' }}>
                        {ing.amount}
                      </span>
                    )}
                    <span style={{ color: 'var(--on-surface-muted)' }}>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Instructions */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame size={18} style={{ color: '#2D5A2D' }} />
                <h3 className="font-display font-bold uppercase tracking-wide text-sm" style={{ color: 'var(--on-surface)' }}>Instructions</h3>
              </div>
              <div className="markdown-body prose prose-sm max-w-none text-sm" style={{ color: 'var(--on-surface-muted)' }}>
                <Markdown>{recipe.instructions}</Markdown>
              </div>
            </section>

            {/* Grocery List */}
            {(() => {
              const recipeItems = recipe.ingredients;
              const itemKeys = recipeItems.map(i => `${i.amount}|${i.name}`);
              const addedCount = itemKeys.filter(k => groceryList.includes(k)).length;
              const allAdded = addedCount === recipeItems.length;
              return (
                <section>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
                    {/* Section header */}
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ backgroundColor: 'var(--surface-alt)' }}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={17} style={{ color: '#2D5A2D' }} />
                        <h3 className="font-display font-bold uppercase tracking-wide text-sm" style={{ color: 'var(--on-surface)' }}>
                          Grocery List
                        </h3>
                        {addedCount > 0 && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#2D472C', color: '#F5F0E8' }}
                          >
                            {addedCount}/{recipeItems.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => allAdded
                          ? onGroceryClear(itemKeys)
                          : itemKeys.forEach(k => { if (!groceryList.includes(k)) onGroceryToggle(k); })
                        }
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all"
                        style={allAdded
                          ? { backgroundColor: 'var(--surface)', color: 'var(--on-surface)', border: '1px solid var(--border)' }
                          : { backgroundColor: '#2D472C', color: '#F5F0E8' }}
                      >
                        {allAdded ? <Minus size={12} /> : <Plus size={12} />}
                        {allAdded ? 'Remove all' : 'Add all'}
                      </button>
                    </div>

                    {/* Ingredient rows */}
                    <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {recipeItems.map((ing, i) => {
                        const key = itemKeys[i];
                        const inList = groceryList.includes(key);
                        return (
                          <li key={i}>
                            <button
                              onClick={() => onGroceryToggle(key)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-all"
                              style={{ backgroundColor: inList ? 'rgba(45,71,44,0.06)' : 'transparent' }}
                            >
                              {/* Checkbox */}
                              <span
                                className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                                style={inList
                                  ? { backgroundColor: '#2D472C', border: '1.5px solid #2D472C' }
                                  : { border: '1.5px solid var(--border)', backgroundColor: 'transparent' }}
                              >
                                {inList && <Check size={11} strokeWidth={3} color="#F5F0E8" />}
                              </span>
                              {/* Amount badge */}
                              {ing.amount && (
                                <span
                                  className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: inList ? 'rgba(45,71,44,0.12)' : 'var(--surface-alt)', color: 'var(--on-surface)' }}
                                >
                                  {ing.amount}
                                </span>
                              )}
                              <span
                                style={{
                                  color: inList ? 'var(--on-surface-muted)' : 'var(--on-surface)',
                                  textDecoration: inList ? 'line-through' : 'none',
                                  opacity: inList ? 0.6 : 1,
                                }}
                              >
                                {ing.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              );
            })()}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface)', opacity: 0.35 }}>
                  #{tag}
                </span>
              ))}
            </div>

            </div>{/* end cream body */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
