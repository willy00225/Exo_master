import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import ContactSupport from './ContactSupport';

const WhatsAppButton = () => {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/settings/whatsapp')
      .then(res => setNumber(res.data.whatsapp_number))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Pendant le chargement, ne rien afficher
  if (loading) return null;

  // Si un numéro WhatsApp est configuré
  if (number) {
    return (
      <motion.a
        href={`https://wa.me/${number.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noreferrer"
        title="Support WhatsApp"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 hover:shadow-xl transition-all z-50 flex items-center gap-2 group"
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