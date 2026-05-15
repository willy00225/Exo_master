import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const QuizModal = ({ isOpen, onClose, onSave, quiz, groups }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: '',
    chapter_id: '',
    difficulty_filter: '',
    question_count: 10,
  });
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Réinitialiser le formulaire à l'ouverture / changement de quiz
  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        group_id: quiz.group_id || '',
        chapter_id: quiz.chapter_id || '',
        difficulty_filter: quiz.difficulty_filter || '',
        question_count: quiz.question_count || 10,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        group_id: '',
        chapter_id: '',
        difficulty_filter: '',
        question_count: 10,
      });
    }
    setError('');
    setMessage({ type: '', text: '' });
  }, [quiz, isOpen]);

  // Charger les chapitres lorsque le groupe change
  useEffect(() => {
    if (formData.group_id) {
      api.get(`/chapters?group_id=${formData.group_id}`)
        .then(res => setChapters(res.data))
        .catch(console.error);
    } else {
      setChapters([]);
    }
  }, [formData.group_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage({ type: '', text: '' });
    try {
      if (quiz) {
        await api.put(`/quizzes/${quiz.id}`, formData);
      } else {
        await api.post('/quizzes', formData);
      }
      setMessage({ type: 'success', text: quiz ? 'Quiz mis à jour.' : 'Quiz créé.' });
      setTimeout(() => {
        onSave();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white font-space-grotesk">
              {quiz ? 'Modifier le quiz' : 'Nouveau quiz'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps avec scroll */}
          <div className="overflow-y-auto p-6 space-y-4 flex-1">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {message.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <form id="quiz-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="Titre du quiz"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (optionnelle)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Brève description"
                />
              </div>

              {/* Groupe & Chapitre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Groupe</label>
                  <select
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  >
                    <option value="">Sélectionner un groupe</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Chapitre (optionnel)</label>
                  <select
                    name="chapter_id"
                    value={formData.chapter_id}
                    onChange={handleChange}
                    disabled={!formData.group_id}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50"
                  >
                    <option value="">Tous les chapitres</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Difficulté & Nombre de questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté cible</label>
                  <select
                    name="difficulty_filter"
                    value={formData.difficulty_filter}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  >
                    <option value="">Mixte</option>
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                    <option value="very_hard">Très difficile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de questions</label>
                  <input
                    type="number"
                    name="question_count"
                    value={formData.question_count}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-violet-500/10 border border-violet-500/30 p-3 rounded-lg text-sm text-violet-300">
                Les questions seront tirées aléatoirement de la banque selon ces critères.
              </div>
            </form>
          </div>

          {/* Pied de modale */}
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="quiz-form"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} /> {quiz ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizModal;