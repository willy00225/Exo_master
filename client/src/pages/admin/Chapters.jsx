import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, BookOpen, Loader,
  AlertCircle, CheckCircle, Filter, Sparkles, X, Zap
} from 'lucide-react';
import api from '../../services/api';

const Chapters = () => {
  const [chapters, setChapters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [form, setForm] = useState({ title: '', group_id: '', subject_id: '', order_index: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // État pour la génération IA
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ group_id: '', subject_id: '', count: 10 });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState({ type: '', text: '' });

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chapters');
      setChapters(res.data);
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    fetchGroups();
    fetchSubjects();
    fetchChapters();
  }, []);

  const resetForm = () => {
    setForm({ title: '', group_id: '', subject_id: '', order_index: 0 });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = () => {
    setEditingChapter(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      group_id: chapter.group_id,
      subject_id: chapter.subject_id || '',
      order_index: chapter.order_index || 0,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.group_id || !form.subject_id) {
      setMessage({ type: 'error', text: 'Titre, classe et matière sont obligatoires.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingChapter) {
        await api.put(`/chapters/${editingChapter.id}`, form);
        setMessage({ type: 'success', text: 'Chapitre mis à jour.' });
      } else {
        await api.post('/chapters', form);
        setMessage({ type: 'success', text: 'Chapitre créé.' });
      }
      fetchChapters();
      setTimeout(() => {
        setModalOpen(false);
        resetForm();
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
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

  // Génération IA
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiForm.group_id || !aiForm.subject_id) {
      setAiMessage({ type: 'error', text: 'Veuillez sélectionner une classe et une matière.' });
      return;
    }
    setAiGenerating(true);
    setAiMessage({ type: '', text: '' });
    try {
      const res = await api.post('/ai/generate-chapters', aiForm);
      setAiMessage({ type: 'success', text: res.data.message });
      fetchChapters();
      setTimeout(() => setAiModalOpen(false), 1500);
    } catch (err) {
      setAiMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la génération.' });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <BookOpen className="text-violet-400" size={28} />
            Chapitres
          </h1>
          <p className="text-slate-400 mt-1">Organisez vos chapitres par matière et classe</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            Générer par IA
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
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
          className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      {/* Tableau des chapitres */}
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
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Titre</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Classe</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Matière</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Ordre</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chapters.map(ch => (
                <tr key={ch.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{ch.title}</td>
                  <td className="px-6 py-4 text-slate-400">{groups.find(g => g.id === ch.group_id)?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{subjects.find(s => s.id === ch.subject_id)?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{ch.order_index}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(ch)} className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(ch.id)} className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Modale création/édition */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">
              {editingChapter ? 'Modifier le chapitre' : 'Nouveau chapitre'}
            </h2>
            {message.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre *</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Classe *</label>
                  <select name="group_id" value={form.group_id} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white" required>
                    <option value="">Sélectionner</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Matière *</label>
                  <select name="subject_id" value={form.subject_id} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white" required>
                    <option value="">Sélectionner</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ordre (facultatif)</label>
                <input type="number" name="order_index" value={form.order_index} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20">Annuler</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editingChapter ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de génération IA */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setAiModalOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
                <Sparkles className="text-violet-400" size={22} />
                Génération IA de chapitres
              </h2>
              <button onClick={() => setAiModalOpen(false)} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
                <X size={18} />
              </button>
            </div>

            {aiMessage.text && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                aiMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {aiMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {aiMessage.text}
              </div>
            )}

            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Classe *</label>
                <select
                  value={aiForm.group_id}
                  onChange={(e) => setAiForm({ ...aiForm, group_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="">Sélectionnez une matière</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre de chapitres (max 20)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiForm.count}
                  onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {aiGenerating ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
                {aiGenerating ? 'Génération...' : 'Générer les chapitres'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chapters;