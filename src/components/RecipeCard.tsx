import React from 'react';
import { Recipe } from '../types';
import { Clock, ChefHat, Heart, Share2, Check } from 'lucide-react';

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

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSaved, onSaveToggle, onClick }) => {
  const [copied, setCopied] = React.useState(false);
  const spice = SPICE_COLORS[recipe.spiciness] ?? { bg: '#E8E8E8', text: '#333' };

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

  return (
    <div
      className="cursor-pointer group"
      onClick={() => onClick(recipe)}
    >
      <div
        className="rounded-2xl p-5 border transition-all duration-200 group-hover:shadow-lg"
        style={{ backgroundColor: '#fff', borderColor: 'rgba(28,58,28,0.12)' }}
      >
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: spice.bg, color: spice.text }}
            >
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
            <button
              onClick={(e) => { e.stopPropagation(); onSaveToggle(); }}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: isSaved ? '#c0392b' : '#1C3A1C', opacity: isSaved ? 1 : 0.35 }}
            >
              <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
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
    </div>
  );
};
