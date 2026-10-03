import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const BottomSheetSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner…',
  icon: Icon = null,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleSelect = (newValue) => {
    onChange(newValue);
    setOpen(false);
  };

  // Blocage du scroll du body + fermeture au clavier
  useEffect(() => {
    if (!open) return;

    // Bloque le scroll du body pendant l'ouverture
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Ferme au clavier (Échap)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-left transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {Icon && <Icon size={18} className="text-slate-400 shrink-0" />}
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Overlay + Bottom Sheet — rendu conditionnel simple (plus d'AnimatePresence) */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet avec animation CSS (translate-y) */}
          <div
            role="listbox"
            aria-label={placeholder}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto animate-slide-up"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              {placeholder}
            </h3>
            <div className="space-y-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && <Check size={18} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BottomSheetSelect;