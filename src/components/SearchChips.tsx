interface SearchChipsProps {
  onSelect: (query: string) => void;
  isLoading: boolean;
  activeQuery: string;
}

const CHIPS = ['Pasta', 'Tacos', 'Curry', 'BBQ', 'Soups', 'Stir-fry', 'Salads', 'Burgers'];

export const SearchChips = ({ onSelect, isLoading, activeQuery }: SearchChipsProps) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {CHIPS.map((chip) => {
      const active = activeQuery.toLowerCase() === chip.toLowerCase();
      return (
        <button
          key={chip}
          onClick={() => !isLoading && onSelect(chip)}
          disabled={isLoading}
          style={active
            ? { backgroundColor: '#1C3A1C', color: '#F5F0E8', borderColor: '#1C3A1C' }
            : { backgroundColor: 'transparent', color: '#1C3A1C', borderColor: '#1C3A1C' }
          }
          className="px-4 py-1.5 rounded-full border text-sm font-semibold transition-all disabled:opacity-40"
        >
          {chip}
        </button>
      );
    })}
  </div>
);
