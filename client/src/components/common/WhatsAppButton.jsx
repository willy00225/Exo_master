import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../services/api';

const WhatsAppButton = () => {
  const [number, setNumber] = useState('');

  useEffect(() => {
    api.get('/public/settings/whatsapp')
      .then(res => setNumber(res.data.whatsapp_number))
      .catch(console.error);
  }, []);

  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all z-50 flex items-center gap-2"
      title="Support WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  );
};

export default WhatsAppButton;