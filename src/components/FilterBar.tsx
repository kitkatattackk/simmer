import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSearch: () => void;
  isLoading: boolean;
}

const selectClass = "appearance-none bg-white border rounded-full px-4 py-2 text-sm font-medium outline-none cursor-pointer transition-all";
const selectStyle = { borderColor: '#1C3A1C', color: '#1C3A1C' };

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, onSearch, isLoading }) => {
  const meatTypes = ['All', 'Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Lamb'];
  const spicinessLevels = ['All', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
  const difficulties = ['All', 'Easy', 'Intermediate', 'Advanced'];
  const timeOptions = ['All', 'Under 15 mins', 'Under 30 mins', 'Under 60 mins'];
  const allergies = ['No Allergy Filter', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Egg-Free', 'Shellfish-Free', 'Soy-Free', 'Fish-Free'];

  return (
    <div className="flex flex-col gap-4">
      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#1C3A1C', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Search recipes…"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none border-2 bg-white transition-all"
            style={{ borderColor: '#1C3A1C', color: '#1C3A1C' }}
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSearch()}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-bold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 flex-shrink-0"
          style={{ backgroundColor: '#1C3A1C', color: '#F5F0E8' }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          {isLoading ? 'Searching…' : 'Find Recipes'}
        </button>
      </div>

      {/* Filter pills */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <select className={selectClass} style={selectStyle} value={filters.meatType} onChange={(e) => setFilters(prev => ({ ...prev, meatType: e.target.value }))} disabled={isLoading}>
          {meatTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Proteins' : t}</option>)}
        </select>
        <select className={selectClass} style={selectStyle} value={filters.spiciness} onChange={(e) => setFilters(prev => ({ ...prev, spiciness: e.target.value }))} disabled={isLoading}>
          {spicinessLevels.map(t => <option key={t} value={t}>{t === 'All' ? 'Any Heat' : t}</option>)}
        </select>
        <select className={selectClass} style={selectStyle} value={filters.difficulty} onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))} disabled={isLoading}>
          {difficulties.map(t => <option key={t} value={t}>{t === 'All' ? 'Any Skill' : t}</option>)}
        </select>
        <select className={selectClass} style={selectStyle} value={filters.maxTime} onChange={(e) => setFilters(prev => ({ ...prev, maxTime: e.target.value }))} disabled={isLoading}>
          {timeOptions.map(t => <option key={t} value={t}>{t === 'All' ? 'Any Time' : t}</option>)}
        </select>
        <select className={selectClass} style={selectStyle} value={filters.allergy} onChange={(e) => setFilters(prev => ({ ...prev, allergy: e.target.value }))} disabled={isLoading}>
          {allergies.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
};
