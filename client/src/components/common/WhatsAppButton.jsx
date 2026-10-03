import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../services/api';
import ContactSupport from './ContactSupport';

const WhatsAppButton = () => {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('whatsapp-btn-pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return { x: window.innerWidth - 80, y: window.innerHeight - 120 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Récupération du numéro WhatsApp
  useEffect(() => {
    api.get('/public/settings/whatsapp')
      .then(res => setNumber(res.data.whatsapp_number))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Handlers de drag natifs
  const handlePointerMove = useCallback((e) => {
    const { x, y, px, py } = dragStartRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setHasDragged(true);
    }

    const margin = 20;
    const size = 60;
    const newX = Math.min(Math.max(px + dx, margin), window.innerWidth - size - margin);
    const newY = Math.min(Math.max(py + dy, margin), window.innerHeight - size - margin);
    setPosition({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    try {
      localStorage.setItem('whatsapp-btn-pos', JSON.stringify(positionRef.current));
    } catch {
      // ignore
    }
  }, [handlePointerMove]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const resetPosition = () => {
    const defaultPos = { x: window.innerWidth - 80, y: window.innerHeight - 120 };
    setPosition(defaultPos);
    try {
      localStorage.setItem('whatsapp-btn-pos', JSON.stringify(defaultPos));
    } catch {
      // ignore
    }
  };

  const openWhatsApp = (e) => {
    // Ne pas ouvrir si on vient de drag
    if (hasDragged) {
      e.preventDefault();
      return;
    }
    if (number) {
      window.open(`https://wa.me/${number.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  if (loading) return null;

  // Si un numéro WhatsApp est configuré
  if (number) {
    return (
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={openWhatsApp}
        onDoubleClick={resetPosition}
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
        }}
        className={`fixed z-40 w-14 h-14 flex items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition-colors active:scale-95 ${
          isDragging ? 'cursor-grabbing bg-cyan-600' : 'cursor-grab hover:bg-cyan-600'
        }`}
        title="Support WhatsApp (glissez pour déplacer, double-cliquez pour réinitialiser)"
        aria-label="Bouton WhatsApp déplaçable"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // Fallback : formulaire de contact
  return <ContactSupport />;
};

export default WhatsAppButton;