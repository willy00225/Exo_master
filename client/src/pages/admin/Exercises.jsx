import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, Edit, Trash2, FileText, Download, Filter, Loader,
  BarChart3, X, Save, AlertCircle, CheckCircle, Zap, Brain, BookOpen, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import ExerciseUploadModal from '../../components/admin/ExerciseUploadModal';
import ExerciseGenerateModal from '../../components/admin/ExerciseGenerateModal';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const Exercises = () => {
  const [exercises, setExercises] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [operationMessage, setOperationMessage] = useState({ type: '', text: '' });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [filters, setFilters] = useState({ group_id: '', chapter_id: '', difficulty: '' });

  // Stats
  const stats = {
    total: exercises.length,
    easy: exercises.filter(e => e.difficulty === 'easy').length,
    medium: exercises.filter(e => e.difficulty === 'medium').length,
    hard: exercises.filter(e => e.difficulty === 'hard' || e.difficulty === 'very_hard').length,
  };

  const fetchExercises = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (filters.group_id) params.append('group_id', filters.group_id);
      if (filters.chapter_id) params.append('chapter_id', filters.chapter_id);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      const res = await api.get(`/exercises?${params.toString()}`);
      setExercises(res.data);
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les exercices. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les classes. Veuillez réessayer.');
    }
  };

  const fetchChapters = async (groupId) => {
    if (!groupId) {
      setChapters([]);
      return;
    }
    try {
      const res = await api.get(`/chapters?group_id=${groupId}`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchChapters(filters.group_id);
  }, [filters.group_id]);

  useEffect(() => {
    fetchExercises();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet exercice ?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      setOperationMessage({ type: 'success', text: 'Exercice supprimé.' });
      await fetchExercises();
      setTimeout(() => setOperationMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setOperationMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  const handleDownload = async (exercise) => {
    const filename = exercise.file_path.split('/').pop();
    window.open(`${api.defaults.baseURL}/exercises/file/${filename}`, '_blank');
  };

  const handleSave = () => {
    fetchExercises();
    setUploadModalOpen(false);
    setGenerateModalOpen(false);
    setEditingExercise(null);
  };

  // Affichage en cas d'erreur de chargement
  if (loadError && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{loadError}</p>
        <button
          onClick={() => { fetchGroups(); fetchExercises(); }}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk">Exercices</h1>
          <p className="text-slate-400 mt-1">Gérez les exercices et générez du contenu par IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg"
          >
            <Sparkles size={18} />
            Générer par IA
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            <Plus size={18} />
            Nouvel exercice
          </button>
        </div>
      </motion.div>

      {/* Message d'opération */}
      {operationMessage.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl ${
            operationMessage.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {operationMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {operationMessage.text}
        </motion.div>
      )}

      {/* Mini stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'bg-violet-500/20 text-violet-300' },
          { label: 'Faciles', value: stats.easy, icon: BookOpen, color: 'bg-emerald-500/20 text-emerald-300' },
          { label: 'Moyens', value: stats.medium, icon: BarChart3, color: 'bg-amber-500/20 text-amber-300' },
          { label: 'Difficiles', value: stats.hard, icon: Brain, color: 'bg-red-500/20 text-red-300' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3"
      >
        <Filter size={20} className="text-slate-400" />
        <select
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          value={filters.group_id}
          onChange={(e) => setFilters({ ...filters, group_id: e.target.value, chapter_id: '' })}
        >
          <option value="">Toutes les classes</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50"
          value={filters.chapter_id}
          onChange={(e) => setFilters({ ...filters, chapter_id: e.target.value })}
          disabled={!filters.group_id}
        >
          <option value="">Tous les chapitres</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
        >
          <option value="">Toutes difficultés</option>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
          <option value="very_hard">Très difficile</option>
        </select>
      </motion.div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun exercice trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Titre</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Difficulté</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Fichier</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exercises.map((ex) => (
                  <tr key={ex.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{ex.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{ex.description}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {groups.find(g => g.id === ex.group_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${difficultyLabels[ex.difficulty]?.color}`}>
                        {difficultyLabels[ex.difficulty]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ex.file_path ? (
                        <button
                          onClick={() => handleDownload(ex)}
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                          <Download size={14} /> Télécharger
                        </button>
                      ) : (
                        <span className="text-slate-500">Aucun fichier</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setEditingExercise(ex); setUploadModalOpen(true); }}
                        className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modales */}
      <ExerciseUploadModal
        isOpen={uploadModalOpen}
        onClose={() => { setUploadModalOpen(false); setEditingExercise(null); }}
        onSave={handleSave}
        exercise={editingExercise}
        groups={groups}
        chapters={chapters}
      />
      <ExerciseGenerateModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSave={handleSave}
        groups={groups}
      />
    </div>
  );
};

export default Exercises;