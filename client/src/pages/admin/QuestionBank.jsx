import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Filter, Loader, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../../services/api';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterDifficulty ? `?difficulty=${filterDifficulty}` : '';
      const res = await api.get(`/questions${params}`);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger la banque de questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filterDifficulty]);

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{error}</p>
        <button
          onClick={fetchQuestions}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
          <HelpCircle className="text-violet-400" size={28} />
          Banque de questions
        </h1>
        <p className="text-slate-400 mt-1">Gérez les questions à choix multiples</p>
      </motion.div>

      {/* Filtre */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <Filter size={18} className="text-slate-400" />
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Toutes les difficultés</option>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
          <option value="very_hard">Très difficile</option>
        </select>
      </div>

      {/* Liste des questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
            <HelpCircle size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucune question trouvée.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium mb-3">{q.question_text}</p>
                  <ul className="space-y-1.5">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          i === q.correct_option
                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border border-white/10 text-slate-400'
                        }`}
                      >
                        {i === q.correct_option ? (
                          <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                          <X size={16} className="text-slate-500" />
                        )}
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  q.difficulty === 'easy' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                  q.difficulty === 'medium' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                  q.difficulty === 'hard' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                  'bg-red-500/20 border-red-500/30 text-red-400'
                }`}>
                  {q.difficulty === 'easy' ? 'Facile' :
                   q.difficulty === 'medium' ? 'Moyen' :
                   q.difficulty === 'hard' ? 'Difficile' : 'Très difficile'}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default QuestionBank;