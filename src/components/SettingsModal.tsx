import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Check } from 'lucide-react';

const DIETARY_OPTIONS = [
  'Gluten-Free', 'Dairy-Free', 'Nut-Free',
  'Egg-Free', 'Shellfish-Free', 'Soy-Free', 'Fish-Free',
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  dietaryPrefs: string[];
  onSave: (prefs: string[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open, onClose, darkMode, onDarkModeToggle, dietaryPrefs, onSave,
}) => {
  const [localPrefs, setLocalPrefs] = React.useState<string[]>(dietaryPrefs);

  React.useEffect(() => { setLocalPrefs(dietaryPrefs); }, [dietaryPrefs]);

  const togglePref = (pref: string) => {
    setLocalPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'var(--modal-bg)' }}
          >
            {/* Header */}
            <div className="px-8 py-8 flex items-center justify-between" style={{ backgroundColor: '#2D472C' }}>
              <div>
                <h2 className="font-display text-3xl font-bold leading-tight" style={{ color: '#F5F0E8' }}>
                  Settings
                </h2>
                <p className="text-xs uppercase tracking-widest mt-1 font-semibold" style={{ color: '#F5F0E8', opacity: 0.7 }}>
                  Preference Center
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#F5F0E8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 overflow-y-auto" style={{ maxHeight: '70vh', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

              {/* Dark Mode */}
              <section
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--modal-surface)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--modal-chip-bg)' }}>
                    <Moon size={20} style={{ color: 'var(--modal-chip-text)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--modal-text)' }}>Dark Mode</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--modal-text-muted)' }}>Switch app appearance</p>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  onClick={onDarkModeToggle}
                  className="w-14 h-8 rounded-full relative transition-colors duration-200 flex items-center px-1"
                  style={{ backgroundColor: darkMode ? '#2D472C' : '#C3C8BE' }}
                >
                  <motion.div
                    animate={{ x: darkMode ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </section>

              {/* Dietary Preferences */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-display font-bold text-lg" style={{ color: 'var(--modal-text)' }}>
                    Dietary Preferences
                  </h4>
                  <button
                    onClick={() => setLocalPrefs([])}
                    className="text-sm font-bold"
                    style={{ color: 'var(--modal-text-muted)' }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(pref => {
                    const active = localPrefs.includes(pref);
                    return (
                      <button
                        key={pref}
                        onClick={() => togglePref(pref)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={active
                          ? { backgroundColor: '#2D472C', color: '#F5F0E8' }
                          : { backgroundColor: 'var(--modal-chip-bg)', color: 'var(--modal-chip-text)' }}
                      >
                        {pref}
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full py-5 rounded-full font-display font-bold text-base uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#2D472C', color: '#F5F0E8' }}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
