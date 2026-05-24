import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, Edit, Trash2, Save, X, Loader, Filter,
  CheckCircle, AlertCircle, Lightbulb, BookOpen, GraduationCap, PenTool, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  { key: 'exercises', label: 'Exercices', icon: PenTool },
  { key: 'homework', label: 'Devoirs', icon: BookOpen },
  { key: 'exams', label: 'Examens', icon: GraduationCap },
];

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const Tips = () => {
  const [tips, setTips] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    title: '',
    content: '',
    group_id: '',
    category: 'exercises',
    difficulty: '',
  });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ group_id: '', category: 'exercises' });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState({ type: '', text: '' });

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
      return true;
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les classes. Veuillez réessayer.');
      return false;
    }
  };

  const fetchTips = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (filterGroup) params.append('group_id', filterGroup);
      if (filterCategory) params.append('category', filterCategory);
      const res = await api.get(`/admin/tips?${params.toString()}`);
      setTips(res.data);
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les astuces. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setLoadError(null);
    const groupsOk = await fetchGroups();
    if (groupsOk) {
      await fetchTips();
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchTips();
  }, [filterGroup, filterCategory]);

  const resetForm = () => {
    setForm({ title: '', content: '', group_id: '', category: 'exercises', difficulty: '' });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = () => {
    setEditingTip(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (tip) => {
    setEditingTip(tip);
    setForm({
      title: tip.title || '',
      content: tip.content,
      group_id: tip.group_id,
      category: tip.category,
      difficulty: tip.difficulty || '',
    });
    setMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.group_id || !form.category || !form.content) {
      setMessage({ type: 'error', text: 'Classe, catégorie et contenu sont obligatoires.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingTip) {
        await api.put(`/admin/tips/${editingTip.id}`, form);
        setMessage({ type: 'success', text: 'Astuce mise à jour.' });
      } else {
        await api.post('/admin/tips', form);
        setMessage({ type: 'success', text: 'Astuce créée.' });
      }
      await fetchTips();
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
    if (!window.confirm('Supprimer cette astuce ?')) return;
    try {
      await api.delete(`/admin/tips/${id}`);
      fetchTips();
      setMessage({ type: 'success', text: 'Astuce supprimée.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiForm.group_id) {
      setAiMessage({ type: 'error', text: 'Veuillez sélectionner une classe.' });
      return;
    }
    setAiGenerating(true);
    setAiMessage({ type: '', text: '' });
    try {
      const res = await api.post('/ai/generate-tips', aiForm);
      setAiMessage({ type: 'success', text: `${res.data.tips.length} astuce(s) générée(s) avec succès !` });
      await fetchTips();
      setTimeout(() => {
        setAiModalOpen(false);
        setAiMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setAiMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la génération.' });
    } finally {
      setAiGenerating(false);
    }
  };

  const categoryBadge = (cat) => {
    const config = CATEGORIES.find(c => c.key === cat);
    if (!config) return <span className="text-slate-400">{cat}</span>;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-slate-300">
        <config.icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loadError && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{loadError}</p>
        <button
          onClick={fetchAllData}
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
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <Lightbulb className="text-amber-400" size={28} />
            Astuces & Conseils
          </h1>
          <p className="text-slate-400 mt-1">Gérez les astuces affichées aux élèves, ou générez-les par IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg"
          >
            <Sparkles size={18} />
            Générer par IA
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            <Plus size={18} />
            Nouvelle astuce
          </button>
        </div>
      </motion.div>

      {/* Message global */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3"
      >
        <Filter size={20} className="text-slate-400" />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Toutes les classes</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
        </select>
      </motion.div>

      {/* Tableau */}
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
        ) : tips.length === 0 ? (
          <div className="p-12 text-center">
            <Lightbulb size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucune astuce pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Titre</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Classe</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Difficulté</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tips.map(tip => (
                  <tr key={tip.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{tip.title || 'Sans titre'}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{tip.content}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{tip.group_name || '-'}</td>
                    <td className="px-6 py-4">{categoryBadge(tip.category)}</td>
                    <td className="px-6 py-4">
                      {tip.difficulty ? (
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${difficultyLabels[tip.difficulty]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {difficultyLabels[tip.difficulty]?.label || tip.difficulty}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(tip)}
                        className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(tip.id)}
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

      {/* Modale d'édition/création */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-space-grotesk">
                  {editingTip ? 'Modifier l\'astuce' : 'Nouvelle astuce'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>

              {message.text && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Titre (optionnel)</label>
                  <input type="text" name="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Titre de l'astuce" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Contenu *</label>
                  <textarea name="content" value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                    rows={4} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" placeholder="Contenu de l'astuce..." required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Classe *</label>
                    <select value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500" required>
                      <option value="">Sélectionnez</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Catégorie *</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                      {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté</label>
                    <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="">—</option>
                      <option value="easy">Facile</option>
                      <option value="medium">Moyen</option>
                      <option value="hard">Difficile</option>
                      <option value="very_hard">Très difficile</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg disabled:opacity-50">
                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Enregistrement...' : editingTip ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale de génération IA */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setAiModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
                  <Sparkles className="text-violet-400" size={22} />
                  Génération IA d'astuces
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
                  <select value={aiForm.group_id} onChange={e => setAiForm({...aiForm, group_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500" required>
                    <option value="">Sélectionnez une classe</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Catégorie</label>
                  <select value={aiForm.category} onChange={e => setAiForm({...aiForm, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={aiGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">
                  {aiGenerating ? <><Loader size={18} className="animate-spin" /> Génération...</> : <><Sparkles size={18} /> Générer 3 astuces</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tips;