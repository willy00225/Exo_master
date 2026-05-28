import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Upload, Loader, AlertCircle, CheckCircle, FileText, Edit
} from 'lucide-react';
import api from '../../services/api';

const ExerciseUploadModal = ({ isOpen, onClose, onSave, exercise, groups }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    group_id: '',
    chapter_id: '',
    file: null,
  });
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Pré-remplir si édition
  useEffect(() => {
    if (exercise) {
      setForm({
        title: exercise.title || '',
        description: exercise.description || '',
        difficulty: exercise.difficulty || 'easy',
        group_id: exercise.group_id || '',
        chapter_id: exercise.chapter_id || '',
        file: null,
      });
    } else {
      setForm({
        title: '',
        description: '',
        difficulty: 'easy',
        group_id: '',
        chapter_id: '',
        file: null,
      });
    }
    setMessage({ type: '', text: '' });
  }, [exercise, isOpen]);

  // Charger les chapitres lorsque le groupe change
  useEffect(() => {
    if (!form.group_id) {
      setChapters([]);
      return;
    }
    api.get(`/chapters?group_id=${form.group_id}`)
      .then(res => setChapters(res.data))
      .catch(() => setChapters([]));
  }, [form.group_id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm({ ...form, file: files[0] });
    } else if (name === 'group_id') {
      setForm({ ...form, group_id: value, chapter_id: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.group_id) {
      setMessage({ type: 'error', text: 'Titre et groupe sont obligatoires.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('difficulty', form.difficulty);
      data.append('group_id', form.group_id);
      if (form.chapter_id) data.append('chapter_id', form.chapter_id);
      if (form.file) data.append('file', form.file);

      if (exercise) {
        await api.put(`/exercises/${exercise.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: 'Exercice mis à jour.' });
      } else {
        await api.post('/exercises', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: 'Exercice créé.' });
      }
      setTimeout(() => {
        onSave(); // ferme la modale et rafraîchit la liste
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'enregistrement.' });
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
            <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
              {exercise ? <Edit size={20} className="text-violet-400" /> : <FileText size={20} className="text-violet-400" />}
              {exercise ? 'Modifier l\'exercice' : 'Nouvel exercice'}
            </h2>
            <button onClick={onClose} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Corps avec scroll */}
          <div className="overflow-y-auto p-6 space-y-4 flex-1">
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

            <form id="exercise-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  placeholder="Titre de l'exercice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (optionnelle)</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Brève description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté</label>
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                    <option value="very_hard">Très difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Groupe</label>
                  <select
                    name="group_id"
                    value={form.group_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    required
                  >
                    <option value="">Sélectionner un groupe</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Chapitre (optionnel)</label>
                <select
                  name="chapter_id"
                  value={form.chapter_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50"
                  disabled={!form.group_id}
                >
                  <option value="">Aucun chapitre</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fichier {exercise ? '(laisser vide pour ne pas changer)' : ''}</label>
                <div className="relative">
                  <input
                    type="file"
                    name="file"
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-medium hover:file:bg-violet-700 transition-all"
                    required={!exercise}
                  />
                  <Upload size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
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
              form="exercise-form"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} /> {exercise ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseUploadModal;