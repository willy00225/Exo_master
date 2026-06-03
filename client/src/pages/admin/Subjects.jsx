import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, BookOpen, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data);
      setMessage({ type: '', text: '' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des matières.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '' });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = () => {
    setEditingSubject(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setForm({ name: subject.name, slug: subject.slug });
    setMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setMessage({ type: 'error', text: 'Le nom et le slug sont obligatoires.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject.id}`, form);
        setMessage({ type: 'success', text: 'Matière mise à jour.' });
      } else {
        await api.post('/admin/subjects', form);
        setMessage({ type: 'success', text: 'Matière créée.' });
      }
      fetchSubjects();
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
    if (!window.confirm('Supprimer cette matière ?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchSubjects();
      setMessage({ type: 'success', text: 'Matière supprimée.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <BookOpen className="text-violet-400" size={28} />
            Matières
          </h1>
          <p className="text-slate-400 mt-1">Gérez les matières du programme</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          <Plus size={18} />
          Nouvelle matière
        </button>
      </motion.div>

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
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucune matière trouvée.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Nom</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Slug</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subjects.map(subject => (
                <tr key={subject.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{subject.name}</td>
                  <td className="px-6 py-4 text-slate-400">{subject.slug}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
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
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">
              {editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Nom</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Mathématiques"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug (identifiant unique)</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="mathematiques"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20">Annuler</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editingSubject ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;