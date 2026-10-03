import { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, X, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ContactSupport = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Position du bouton flottant (persistée)
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('support-btn-pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return { x: window.innerWidth - 80, y: window.innerHeight - 120 };
  });

  // État du drag
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const positionRef = useRef(position);

  // Sync ref avec l'état pour l'utiliser dans les listeners natifs
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handlers de drag natifs (pointer events)
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
    // Persiste la position finale
    try {
      localStorage.setItem('support-btn-pos', JSON.stringify(positionRef.current));
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

  const handleClick = (e) => {
    // Ne pas ouvrir si on vient de drag
    if (hasDragged) {
      e.preventDefault();
      return;
    }
    setOpen(true);
  };

  const resetPosition = () => {
    const defaultPos = { x: window.innerWidth - 80, y: window.innerHeight - 120 };
    setPosition(defaultPos);
    try {
      localStorage.setItem('support-btn-pos', JSON.stringify(defaultPos));
    } catch {
      // ignore
    }
  };

  // Blocage du scroll + Échap quand la modale est ouverte
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      await api.post('/support/contact', {
        email: email || null,
        subject: subject || 'Demande de support',
        message,
      });
      setFeedback({ type: 'success', text: 'Message envoyé. Nous vous répondrons rapidement.' });
      setSubject('');
      setMessage('');
      if (!user) setEmail('');
    } catch (err) {
      setFeedback({ type: 'error', text: "Erreur lors de l'envoi. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant déplaçable — position via CSS left/top */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onDoubleClick={resetPosition}
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
        }}
        className={`fixed z-50 w-14 h-14 flex items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors active:scale-95 ${
          isDragging ? 'cursor-grabbing bg-violet-700' : 'cursor-grab hover:bg-violet-700'
        }`}
        title="Contacter le support (glissez pour déplacer, double-cliquez pour réinitialiser)"
        aria-label="Bouton de support déplaçable"
      >
        <HelpCircle size={24} />
      </button>

      {/* Modale de contact — rendu conditionnel simple */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-support-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                id="contact-support-title"
                className="text-xl font-bold text-white font-space-grotesk"
              >
                Contacter le support
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors active:scale-90"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {feedback.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 border ${
                feedback.type === 'success'
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="support-email">
                  Votre email
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="votre@email.com"
                  required
                  disabled={!!user}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="support-subject">
                  Sujet
                </label>
                <input
                  id="support-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="Problème, question..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="support-message">
                  Message
                </label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Décrivez votre problème..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" /> Envoi...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Envoyer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactSupport;