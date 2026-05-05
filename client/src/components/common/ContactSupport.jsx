import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // 🆕

const ContactSupport = () => {
  const { user } = useAuth(); // utilisateur connecté (peut être null)
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

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
      if (!user) setEmail(''); // réinitialiser seulement si non connecté
    } catch (err) {
      setFeedback({ type: 'error', text: 'Erreur lors de l\'envoi. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 bg-violet-600 text-white p-4 rounded-full shadow-lg hover:bg-violet-700 hover:scale-110 transition-all z-50"
        title="Contacter le support"
      >
        <HelpCircle size={24} />
      </motion.button>

      {/* Modale de contact */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white font-space-grotesk">Contacter le support</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {feedback.text && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {feedback.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Votre email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    placeholder="votre@email.com"
                    required
                    disabled={!!user} // champ verrouillé si connecté
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Sujet</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    placeholder="Problème, question..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                  <textarea
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
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ContactSupport;