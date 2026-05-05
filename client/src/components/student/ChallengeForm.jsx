import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Loader, CheckCircle, AlertCircle, Send } from 'lucide-react';
import api from '../../services/api';

const ChallengeForm = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/quizzes/available')
      .then(res => setQuizzes(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Remplacer par l'API qui retourne les élèves du même groupe
    api.get('/student/users')
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

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
          <label className="block text-sm font-medium text-slate-300 mb-1">Adversaire</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/60 border border-amber-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          >
            <option value="">Sélectionnez un élève</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" /> Lancement...
            </>
          ) : (
            <>
              <Send size={18} /> Lancer le défi
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default ChallengeForm;