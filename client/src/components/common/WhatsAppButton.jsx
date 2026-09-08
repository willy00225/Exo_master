import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import ContactSupport from './ContactSupport';

const WhatsAppButton = () => {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);

  // Position initiale lue depuis localStorage, sinon défaut
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('whatsapp-btn-pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Position par défaut : en bas à droite, au-dessus de la bottom nav mobile
    return { x: window.innerWidth - 80, y: window.innerHeight - 120 };
  });

  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    api.get('/public/settings/whatsapp')
      .then(res => setNumber(res.data.whatsapp_number))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sauvegarde de la position à chaque déplacement
  useEffect(() => {
    if (pos.x !== undefined) {
      localStorage.setItem('whatsapp-btn-pos', JSON.stringify(pos));
    }
  }, [pos]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    // Ajout des écouteurs globaux
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const maxX = window.innerWidth - 60; // marge
    const maxY = window.innerHeight - 60;
    const newX = Math.min(Math.max(e.clientX - offsetRef.current.x, 0), maxX);
    const newY = Math.min(Math.max(e.clientY - offsetRef.current.y, 0), maxY);
    setPos({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = () => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const resetPosition = () => {
    const defaultPos = {
      x: window.innerWidth - 80,
      y: window.innerHeight - 120,
    };
    setPos(defaultPos);
    localStorage.setItem('whatsapp-btn-pos', JSON.stringify(defaultPos));
  };

  // Pendant le chargement, ne rien afficher
  if (loading) return null;

  // Si un numéro WhatsApp est configuré
  if (number) {
    return (
      <motion.a
        ref={dragRef}
        href={`https://wa.me/${number.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noreferrer"
        title="Support WhatsApp (déplaçable, double-clic pour réinitialiser)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          left: pos.x,
          top: pos.y,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={resetPosition}
        className={`fixed z-40 flex items-center gap-2 rounded-full p-4 text-white shadow-lg transition-shadow ${
          isDragging ? 'shadow-2xl bg-green-600 scale-110' : 'bg-green-500 hover:bg-green-600 hover:shadow-xl hover:scale-110'
        }`}
        role="button"
        aria-label="Bouton WhatsApp déplaçable. Double-cliquez pour réinitialiser la position."
      >
        <MessageCircle size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap text-sm font-medium">
          WhatsApp
        </span>
      </motion.a>
    );
  }

  // Fallback : formulaire de contact
  return <ContactSupport />;
};

export default WhatsAppButton;