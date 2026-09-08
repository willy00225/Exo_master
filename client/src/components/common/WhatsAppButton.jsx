import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import ContactSupport from './ContactSupport';

const WhatsAppButton = () => {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [position, setPosition] = useState(() => {
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

  // Récupération du numéro WhatsApp
  useEffect(() => {
    api.get('/public/settings/whatsapp')
      .then(res => setNumber(res.data.whatsapp_number))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calcul des contraintes dynamiques en fonction de la taille de l'écran
  useEffect(() => {
    const updateConstraints = () => {
      const margin = 20;
      const buttonSize = 60; // approximativement la taille du bouton
      setConstraints({
        top: margin,
        left: margin,
        right: window.innerWidth - buttonSize - margin,
        bottom: window.innerHeight - buttonSize - margin,
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  // Sauvegarde de la position lors du drag
  const handleDragEnd = (event, info) => {
    const newPos = { x: info.point.x, y: info.point.y };
    setPosition(newPos);
    localStorage.setItem('whatsapp-btn-pos', JSON.stringify(newPos));
  };

  // Réinitialisation de la position
  const resetPosition = () => {
    const defaultPos = {
      x: window.innerWidth - 80,
      y: window.innerHeight - 120,
    };
    setPosition(defaultPos);
    localStorage.setItem('whatsapp-btn-pos', JSON.stringify(defaultPos));
  };

  // Ouverture de WhatsApp sans navigation (utilisé par onTap)
  const openWhatsApp = () => {
    if (number) {
      window.open(`https://wa.me/${number.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  if (loading) return null;

  // Si un numéro WhatsApp est configuré
  if (number) {
    return (
      <motion.div
        drag
        dragConstraints={constraints}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0, x: position.x, y: position.y }}
        animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed z-40 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onTap={openWhatsApp}
        whileTap={{ scale: 0.95 }}
        whileDrag={{ scale: 1.1 }}
        title="Support WhatsApp (glisser pour déplacer, double-clic pour réinitialiser)"
        role="button"
        aria-label="Bouton WhatsApp déplaçable. Glissez pour déplacer, double-cliquez pour réinitialiser."
        onDoubleClick={resetPosition}
      >
        <div className="flex items-center gap-2 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all">
          <MessageCircle size={24} />
          {/* L'étiquette WhatsApp apparaît au survol sur desktop */}
          <span className="hidden lg:inline max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap text-sm font-medium">
            WhatsApp
          </span>
        </div>
      </motion.div>
    );
  }

  // Fallback : formulaire de contact
  return <ContactSupport />;
};

export default WhatsAppButton;