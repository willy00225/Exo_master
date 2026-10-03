import { useState } from 'react';
import { Wrench, X, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AdminSupportButton = () => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      await api.post('/support/technical', { subject, message });
      setFeedback({ type: 'success', text: 'Demande envoyée à l\'équipe technique.' });
      setSubject('');
      setMessage('');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Erreur lors de l\'envoi. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant statique (pas d'animation au chargement) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-amber-500 text-white p-4 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-50 active:scale-95"
        title="Support technique"
        aria-label="Ouvrir le support technique"
      >
        <Wrench size={24} />
      </button>

      {/* Modale — rendu conditionnel simple (plus d'AnimatePresence) */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
                <Wrench size={20} className="text-amber-400" />
                Support technique
              </h2>
              <button
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Sujet</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="Problème rencontré..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  placeholder="Décrivez précisément le problème..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg active:scale-95"
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

export default AdminSupportButton;