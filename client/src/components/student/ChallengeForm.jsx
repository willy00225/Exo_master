import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Loader, CheckCircle, AlertCircle, Send, Copy, Link } from 'lucide-react';
import api from '../../services/api';

const ChallengeForm = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // État pour le lien d'invitation
  const [inviteLink, setInviteLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    api.get('/quizzes/available')
      .then(res => setQuizzes(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // ✅ Correction : utilise /student/classmates pour les camarades du même groupe
    api.get('/student/classmates')
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

  // --- Lancement d'un défi direct (existant) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuiz || !selectedUser) {
      setMessage({ type: 'error', text: 'Veuillez choisir un quiz et un adversaire.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/challenges', {
        quiz_id: selectedQuiz,
        challenged_id: selectedUser,
      });
      setMessage({ type: 'success', text: 'Défi lancé avec succès !' });
      setSelectedQuiz('');
      setSelectedUser('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors du lancement du défi.',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Génération du lien d'invitation ---
  const handleGenerateLink = async () => {
    if (!selectedQuiz) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un quiz.' });
      return;
    }
    setGeneratingLink(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/invitations', { quiz_id: selectedQuiz });
      setInviteLink(res.data.link);
      setMessage({ type: 'success', text: 'Lien généré ! Copiez-le et partagez-le.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la génération du lien.',
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setMessage({ type: 'success', text: 'Lien copié dans le presse‑papier !' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/40 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 shadow-lg"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-space-grotesk">
        <Swords className="text-amber-400" size={24} />
        Lancer un nouveau défi
      </h2>

      {message.text && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Lien d'invitation généré */}
      {inviteLink && (
        <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg flex items-center gap-2">
          <Link size={16} className="text-violet-400" />
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-1 bg-transparent text-white text-sm truncate border-none outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
            title="Copier le lien"
          >
            <Copy size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Choisir un quiz</label>
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/60 border border-amber-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          >
            <option value="">Sélectionnez un quiz</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Adversaire
            {/* ✅ Indicateur du nombre de camarades */}
            {users.length > 0 && (
              <span className="text-slate-400 ml-1">({users.length} disponible{users.length > 1 ? 's' : ''})</span>
            )}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/60 border border-amber-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          >
            <option value="">Sélectionnez un élève (pour défi direct)</option>
            {/* ✅ Numérotation 1/X, 2/X, … */}
            {users.map((u, index) => (
              <option key={u.id} value={u.id}>
                {u.name} ({index + 1}/{users.length})
              </option>
            ))}
          </select>
          {/* ✅ Message si liste vide */}
          {users.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Aucun autre élève dans votre groupe. Revenez plus tard.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Lancement...' : 'Lancer le défi'}
          </button>

          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={generatingLink}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {generatingLink ? <Loader size={18} className="animate-spin" /> : <Link size={18} />}
            {generatingLink ? 'Génération...' : 'Obtenir un lien d\'invitation'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChallengeForm;