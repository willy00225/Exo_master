import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import api from '../../services/api';

const ExerciseGenerateModal = ({ isOpen, onClose, onSave, groups }) => {
  const [form, setForm] = useState({ group_id: '', chapter_id: '', difficulty: '', count: 5 });
  const [chapters, setChapters] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchChapters = async (groupId) => {
    if (!groupId) return setChapters([]);
    try {
      const res = await api.get(`/chapters?group_id=${groupId}`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
      setChapters([]);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setForm({ ...form, group_id: groupId, chapter_id: '' });
    fetchChapters(groupId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/exercises/generate', form);
      setMessage({ type: 'success', text: `${form.count} exercice(s) généré(s) avec succès !` });
      setTimeout(() => {
        onSave(); // ferme la modale et recharge la liste
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la génération.' });
    } finally {
      setGenerating(false);
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
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
              <Sparkles className="text-violet-400" size={22} />
              Génération IA
            </h2>
            <button onClick={onClose} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          {message.text && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Groupe</label>
              <select
                value={form.group_id}
                onChange={handleGroupChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                required
              >
                <option value="">Sélectionnez un groupe</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Chapitre (optionnel)</label>
              <select
                value={form.chapter_id}
                onChange={(e) => setForm({ ...form, chapter_id: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50"
                disabled={!form.group_id}
              >
                <option value="">Tous les chapitres</option>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                required
              >
                <option value="">Mixte</option>
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
                <option value="very_hard">Très difficile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre d'exercices</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <span className="text-white font-bold w-8 text-center">{form.count}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {generating ? (
                <>
                  <Loader size={18} className="animate-spin" /> Génération en cours...
                </>
              ) : (
                <>
                  <Zap size={18} /> Générer {form.count} exercice(s)
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseGenerateModal;