import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const sheetRef = useRef(null);

  const handleSelect = (newValue) => {
    onChange(newValue);
    setOpen(false);
  };

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-left transition-all hover:bg-white/10 disabled:opacity-50"
      >
        {Icon && <Icon size={18} className="text-slate-400" />}
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="text-slate-400" />
      </button>

      {/* Overlay + Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-3xl p-4 pb-safe max-h-[70vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                {placeholder}
              </h3>
              <div className="space-y-1">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      opt.value === value
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {opt.value === value && <Check size={18} className="text-white" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomSheetSelect;