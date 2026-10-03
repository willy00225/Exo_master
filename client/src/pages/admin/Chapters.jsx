import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, BookOpen, Loader,
  AlertCircle, CheckCircle, Sparkles, Zap, X,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from 'lucide-react';
import api from '../../services/api';
import GenerateSummariesModal from '../../components/admin/GenerateSummariesModal';

const ITEMS_PER_PAGE = 15;

const Chapters = () => {
  const [chapters, setChapters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterGroup, setFilterGroup] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [summariesModalOpen, setSummariesModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [form, setForm] = useState({
    title: '',
    group_id: '',
    subject_id: '',
    summary: '',
    summary_validated: false,
    order_index: 0,
  });
  const [aiForm, setAiForm] = useState({ group_id: '', subject_id: '', count: 10 });
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [aiMessage, setAiMessage] = useState({ type: '', text: '' });

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterGroup) params.append('group_id', filterGroup);
      if (filterSubject) params.append('subject_id', filterSubject);
      const res = await api.get(`/chapters?${params.toString()}`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  }, [filterGroup, filterSubject]);

  const fetchGroups = async () => {
    try { const res = await api.get('/groups'); setGroups(res.data); } catch (err) { console.error(err); }
  };
  const fetchSubjects = async () => {
    try { const res = await api.get('/admin/subjects'); setSubjects(res.data); } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchGroups(); fetchSubjects(); }, []);
  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  // Pagination logic
  const totalPages = Math.ceil(chapters.length / ITEMS_PER_PAGE);
  const paginatedChapters = chapters.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePrevious = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const resetForm = () => {
    setForm({
      title: '',
      group_id: '',
      subject_id: '',
      summary: '',
      summary_validated: false,
      order_index: 0,
    });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = () => { setEditingChapter(null); resetForm(); setModalOpen(true); };

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      group_id: chapter.group_id,
      subject_id: chapter.subject_id || '',
      summary: chapter.summary || '',
      summary_validated: chapter.summary_validated || false,
      order_index: chapter.order_index || 0,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.group_id || !form.subject_id) {
      setMessage({ type: 'error', text: 'Titre, classe et matière sont obligatoires.' });
      return;
    }
    setSaving(true); setMessage({ type: '', text: '' });
    try {
      if (editingChapter) {
        await api.put(`/chapters/${editingChapter.id}`, form);
        setMessage({ type: 'success', text: 'Chapitre mis à jour.' });
      } else {
        await api.post('/chapters', form);
        setMessage({ type: 'success', text: 'Chapitre créé.' });
      }
      fetchChapters();
      setTimeout(() => { setModalOpen(false); resetForm(); }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'enregistrement.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce chapitre ?')) return;
    try {
      await api.delete(`/chapters/${id}`);
      fetchChapters();
      setMessage({ type: 'success', text: 'Chapitre supprimé.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  const handleMove = async (id, direction) => {
    const index = chapters.findIndex(ch => ch.id === id);
    if (index === -1) return;
    const newChapters = [...chapters];
    if (direction === 'up' && index > 0) {
      [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
    } else if (direction === 'down' && index < chapters.length - 1) {
      [newChapters[index + 1], newChapters[index]] = [newChapters[index], newChapters[index + 1]];
    }
    setChapters(newChapters);

    const updates = newChapters.map((ch, idx) => ({
      id: ch.id,
      order_index: idx,
    }));
    try {
      await Promise.all(updates.map(u => api.put(`/chapters/${u.id}`, { order_index: u.order_index })));
    } catch (err) {
      console.error('Erreur mise à jour ordre', err);
      fetchChapters();
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiForm.group_id || !aiForm.subject_id) {
      setAiMessage({ type: 'error', text: 'Veuillez sélectionner une classe et une matière.' });
      return;
    }
    setAiGenerating(true); setAiMessage({ type: '', text: '' });
    try {
      const res = await api.post('/ai/generate-chapters', aiForm);
      setAiMessage({ type: 'success', text: res.data.message });
      fetchChapters();
      setTimeout(() => setAiModalOpen(false), 1500);
    } catch (err) {
      setAiMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la génération.' });
    } finally { setAiGenerating(false); }
  };

  // 🆕 Aperçu tronqué du résumé
  const getSummaryPreview = (summary) => {
    if (!summary) return null;
    const clean = summary.replace(/\s+/g, ' ').trim();
    return clean.length > 60 ? clean.substring(0, 60) + '…' : clean;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <BookOpen className="text-violet-400" size={28} />Chapitres
          </h1>
          <p className="text-slate-400 mt-1">Organisés par classe et matière</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSummariesModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg transition-all active:scale-95"
          >
            <Sparkles size={18} />
            Générer les résumés IA
          </button>

          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg transition-all active:scale-95"
          >
            <Sparkles size={18} />
            Générer par IA
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} />
            Nouveau chapitre
          </button>
        </div>
      </motion.div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}{message.text}
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les classes</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les matières</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
          </div>
        ) : chapters.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun chapitre trouvé.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Titre</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Classe</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Matière</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Résumé</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Ordre</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedChapters.map(ch => (
                    <tr key={ch.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{ch.title}</td>
                      <td className="px-6 py-4 text-slate-400">{groups.find(g => g.id === ch.group_id)?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{subjects.find(s => s.id === ch.subject_id)?.name || '-'}</td>
                      <td className="px-6 py-4 max-w-xs">
                        {ch.summary ? (
                          <div className="space-y-1">
                            {/* Badge de statut */}
                            {ch.summary_validated ? (
                              <span className="inline-flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} /> Publié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <AlertCircle size={12} /> En attente
                              </span>
                            )}
                            {/* Aperçu du texte */}
                            <p className="text-xs text-slate-400 italic line-clamp-2">
                              {getSummaryPreview(ch.summary)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Non généré</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMove(ch.id, 'up')}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Monter"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <span className="text-slate-300 w-8 text-center">{ch.order_index}</span>
                          <button
                            onClick={() => handleMove(ch.id, 'down')}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Descendre"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(ch)}
                          className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1 transition-colors"
                          aria-label="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(ch.id)}
                          className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-between border-t border-white/10">
                <span className="text-slate-400 text-sm">Page {currentPage} sur {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-30 hover:bg-white/20 transition-colors"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-30 hover:bg-white/20 transition-colors"
                    aria-label="Page suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ========== MODALE CRÉATION / ÉDITION ========== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white font-space-grotesk">
                {editingChapter ? 'Modifier le chapitre' : 'Nouveau chapitre'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            {message.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 border ${
                message.type === 'success'
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Résumé du cours (facultatif)</label>
                <textarea
                  name="summary"
                  value={form.summary}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-y"
                  placeholder="Résumé du chapitre à afficher aux élèves (objectifs, notions clés…)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  💡 Vous pouvez modifier manuellement le résumé généré par l'IA avant de le publier.
                </p>
              </div>

              {/* Case à cocher : publier le résumé aux élèves */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
                <input
                  type="checkbox"
                  name="summary_validated"
                  checked={form.summary_validated || false}
                  onChange={handleChange}
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                  id="summary_validated"
                />
                <label htmlFor="summary_validated" className="text-sm text-slate-300 cursor-pointer select-none">
                  Publier le résumé aux élèves
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Classe *</label>
                  <select
                    name="group_id"
                    value={form.group_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Matière *</label>
                  <select
                    name="subject_id"
                    value={form.subject_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ordre (facultatif)</label>
                <input
                  type="number"
                  name="order_index"
                  value={form.order_index}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
                >
                  {saving ? (
                    <><Loader size={16} className="animate-spin" /> Enregistrement...</>
                  ) : editingChapter ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODALE GÉNÉRATION IA CHAPITRES ========== */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setAiModalOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
                <Sparkles className="text-violet-400" size={22} />
                Génération IA de chapitres
              </h2>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            {aiMessage.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 border ${
                aiMessage.type === 'success'
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {aiMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{aiMessage.text}
              </div>
            )}
            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Classe *</label>
                <select
                  value={aiForm.group_id}
                  onChange={(e) => setAiForm({ ...aiForm, group_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">Sélectionnez une classe</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Matière *</label>
                <select
                  value={aiForm.subject_id}
                  onChange={(e) => setAiForm({ ...aiForm, subject_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">Sélectionnez une matière</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de chapitres (max 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiForm.count}
                  onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                type="submit"
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
              >
                {aiGenerating ? (
                  <><Loader size={18} className="animate-spin" /> Génération...</>
                ) : (
                  <><Zap size={18} /> Générer les chapitres</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODALE GÉNÉRATION RÉSUMÉS IA ========== */}
      <GenerateSummariesModal
        isOpen={summariesModalOpen}
        onClose={() => setSummariesModalOpen(false)}
        onSave={fetchChapters}
      />
    </div>
  );
};

export default Chapters;