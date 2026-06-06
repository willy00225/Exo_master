import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Sparkles, Edit, Trash2, FileText, Download, Filter, Loader,
  BarChart3, AlertCircle, CheckCircle, Brain, BookOpen, AlertTriangle,
  Layers, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import api from '../../services/api';
import ExerciseUploadModal from '../../components/admin/ExerciseUploadModal';
import ExerciseGenerateModal from '../../components/admin/ExerciseGenerateModal';
import BatchGenerateModal from '../../components/admin/BatchGenerateModal';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const Exercises = () => {
  const [exercises, setExercises] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [operationMessage, setOperationMessage] = useState({ type: '', text: '' });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  // Filtres
  const [filters, setFilters] = useState({
    group_id: '',
    subject_id: '',
    chapter_id: '',
    difficulty: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchExercises = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const res = await api.get(`/exercises?${params.toString()}`);
      // Compatibilité avec l'ancien format (tableau) et le nouveau format paginé
      if (Array.isArray(res.data)) {
        setExercises(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setExercises(res.data.exercises || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setLoadError('Le serveur met trop de temps à répondre. Veuillez réessayer.');
      } else {
        setLoadError('Impossible de charger les exercices. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchChapters = async () => {
    if (!filters.group_id) {
      setChapters([]);
      return;
    }
    try {
      const res = await api.get(`/chapters?group_id=${filters.group_id}`);
      setChapters(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchGroups(); fetchSubjects(); }, []);
  useEffect(() => { fetchChapters(); }, [filters.group_id]);
  useEffect(() => { fetchExercises(); }, [filters, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet exercice ?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      setOperationMessage({ type: 'success', text: 'Exercice supprimé.' });
      fetchExercises();
      setTimeout(() => setOperationMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setOperationMessage({ type: 'error', text: 'Erreur suppression.' });
    }
  };

  const handleDownload = (exercise) => {
    const filename = exercise.file_path.split('/').pop();
    window.open(`${api.defaults.baseURL}/exercises/file/${filename}`, '_blank');
  };

  const handleSave = () => {
    fetchExercises();
    setUploadModalOpen(false);
    setGenerateModalOpen(false);
    setBatchModalOpen(false);
    setEditingExercise(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ group_id: '', subject_id: '', chapter_id: '', difficulty: '' });
    setPage(1);
  };

  if (loadError && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{loadError}</p>
        <button onClick={fetchExercises} className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk">Exercices</h1>
          <p className="text-slate-400 mt-1">Gérez les exercices et générez du contenu par IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setGenerateModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg">
            <Sparkles size={18} /> Générer par IA
          </button>
          <button onClick={() => setBatchModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg">
            <Layers size={18} /> Générer par lot
          </button>
          <button onClick={() => setUploadModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg">
            <Plus size={18} /> Nouvel exercice
          </button>
        </div>
      </motion.div>

      {operationMessage.text && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl ${operationMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
          {operationMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {operationMessage.text}
        </motion.div>
      )}

      {/* Filtres */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Filter size={20} className="text-slate-400" />
        <select value={filters.group_id} onChange={e => handleFilterChange('group_id', e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
          <option value="">Toutes les classes</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filters.subject_id} onChange={e => handleFilterChange('subject_id', e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
          <option value="">Toutes les matières</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.chapter_id} onChange={e => handleFilterChange('chapter_id', e.target.value)}
          disabled={!filters.group_id}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50">
          <option value="">Tous les chapitres</option>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={filters.difficulty} onChange={e => handleFilterChange('difficulty', e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
          <option value="">Toutes difficultés</option>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
          <option value="very_hard">Très difficile</option>
        </select>
        <button onClick={clearFilters} className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1">
          <X size={16} /> Effacer
        </button>
      </motion.div>

      {/* Tableau */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Titre</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Classe</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Matière</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Chapitre</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Difficulté</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exercises.map(ex => (
                    <tr key={ex.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-xs truncate">{ex.title}</td>
                      <td className="px-6 py-4 text-slate-400">{ex.group_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{ex.subject_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-400 max-w-[150px] truncate">{ex.chapter_title || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyLabels[ex.difficulty]?.color}`}>
                          {difficultyLabels[ex.difficulty]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setEditingExercise(ex); setUploadModalOpen(true); }}
                          className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(ex.id)}
                          className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-between border-t border-white/10">
                <span className="text-sm text-slate-400">
                  Page {page} sur {totalPages} ({total} exercices)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1 bg-white/10 rounded-lg text-white disabled:opacity-30 hover:bg-white/20 transition">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modales */}
      <ExerciseUploadModal isOpen={uploadModalOpen} onClose={() => { setUploadModalOpen(false); setEditingExercise(null); }}
        onSave={handleSave} exercise={editingExercise} groups={groups} chapters={chapters} />
      <ExerciseGenerateModal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} onSave={handleSave} groups={groups} />
      <BatchGenerateModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} onSave={handleSave} />
    </div>
  );
};

export default Exercises;