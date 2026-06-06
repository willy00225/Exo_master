import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader, X, CheckCircle, AlertCircle, Zap, BookOpen, GraduationCap } from 'lucide-react';
import api from '../../services/api';

const BatchGenerateModal = ({ isOpen, onClose, onSave }) => {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ group_id: '', subject_id: '', difficulty: 'medium', count_per_chapter: 1 });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/groups').then(res => setGroups(res.data)).catch(console.error);
      api.get('/admin/subjects').then(res => setSubjects(res.data)).catch(console.error);
      setForm({ group_id: '', subject_id: '', difficulty: 'medium', count_per_chapter: 1 });
      setProgress([]);
      setDone(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.group_id || !form.subject_id) return;
    setGenerating(true);
    setProgress([]);
    setDone(false);
    try {
      const res = await api.post('/ai/generate-exercises-batch', form);
      setProgress(res.data.results || []);
      setDone(true);
      if (onSave) onSave();
    } catch (err) {
      console.error(err);
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
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
              <Sparkles className="text-violet-400" size={22} />
              Génération par lot
            </h2>
            <button onClick={onClose} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <GraduationCap size={16} className="inline mr-1" />
                  Classe *
                </label>
                <select
                  name="group_id"
                  value={form.group_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="">Sélectionnez une classe</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <BookOpen size={16} className="inline mr-1" />
                  Matière *
                </label>
                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="">Sélectionnez une matière</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                  <option value="very_hard">Très difficile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre d'exercices par chapitre
                </label>
                <input
                  type="number"
                  name="count_per_chapter"
                  value={form.count_per_chapter}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Bouton Générer */}
            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
            >
              {generating ? (
                <><Loader size={18} className="animate-spin" /> Génération en cours...</>
              ) : (
                <><Zap size={18} /> Générer les exercices</>
              )}
            </button>
          </form>

          {/* Résultats */}
          {progress.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-white">Résultats</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {progress.map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    item.status === 'ok' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                  }`}>
                    {item.status === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <span className="truncate">{item.chapter} → {item.title || item.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done && (
            <div className="mt-4 text-center text-emerald-400 text-sm">
              Génération terminée. {progress.filter(p => p.status === 'ok').length} exercice(s) créé(s).
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BatchGenerateModal;