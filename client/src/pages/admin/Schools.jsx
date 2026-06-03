import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, GraduationCap, Loader,
  AlertCircle, CheckCircle, CreditCard, X,
} from 'lucide-react';
import api from '../../services/api';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    max_students: '',
    selected_groups: [],
  });
  const [paymentDays, setPaymentDays] = useState(365);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/schools');
      setSchools(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des écoles.' });
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
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchSchools();
  }, []);

  const resetForm = () => {
    setForm({ name: '', code: '', max_students: '', selected_groups: [] });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = () => {
    setEditingSchool(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setForm({
      name: school.name,
      code: school.code,
      max_students: school.max_students || '',
      selected_groups: school.groups ? school.groups.map(g => g.id) : [],
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupToggle = (groupId) => {
    setForm(prev => {
      const selected = prev.selected_groups.includes(groupId)
        ? prev.selected_groups.filter(id => id !== groupId)
        : [...prev.selected_groups, groupId];
      return { ...prev, selected_groups: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      setMessage({ type: 'error', text: 'Le nom et le code sont obligatoires.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        name: form.name,
        code: form.code,
        max_students: form.max_students ? parseInt(form.max_students) : null,
        group_ids: form.selected_groups,
      };
      if (editingSchool) {
        await api.put(`/admin/schools/${editingSchool.id}`, payload);
        setMessage({ type: 'success', text: 'École mise à jour.' });
      } else {
        await api.post('/admin/schools', payload);
        setMessage({ type: 'success', text: 'École créée.' });
      }
      fetchSchools();
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
    if (!window.confirm('Supprimer cette école ?')) return;
    try {
      await api.delete(`/admin/schools/${id}`);
      fetchSchools();
      setMessage({ type: 'success', text: 'École supprimée.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  const handlePayment = async () => {
    if (!selectedSchool) return;
    setSaving(true);
    try {
      await api.put(`/admin/schools/${selectedSchool.id}/payment`, {
        subscription_days: paymentDays,
      });
      setMessage({ type: 'success', text: `Abonnement activé pour ${paymentDays} jours.` });
      fetchSchools();
      setPaymentModalOpen(false);
      setPaymentDays(365);
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la validation du paiement.' });
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (date) => !date || new Date(date) < new Date();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <GraduationCap className="text-violet-400" size={28} />
            Écoles partenaires
          </h1>
          <p className="text-slate-400 mt-1">Gérez les codes d'invitation et les abonnements des écoles</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          <Plus size={18} />
          Nouvelle école
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
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucune école enregistrée.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Nom</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Code</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Max élèves</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Abonnement</th>
                <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Groupes</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{school.name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{school.code}</td>
                  <td className="px-6 py-4 text-slate-400">{school.max_students || 'Illimité'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      isExpired(school.subscription_expires)
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {school.subscription_expires
                        ? new Date(school.subscription_expires).toLocaleDateString()
                        : 'Aucun'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {school.groups?.map(g => g.name).join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setSelectedSchool(school); setPaymentModalOpen(true); }}
                      className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-white/10 mr-1 transition-all"
                      title="Valider paiement"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(school)}
                      className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 mr-1 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingSchool ? 'Modifier l\'école' : 'Nouvelle école'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Nom de l'école *</label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Code unique *</label>
                <input
                  type="text" name="code" value={form.code} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono"
                  placeholder="LYCEE-STE-MARIE-2026"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre maximum d'élèves (vide = illimité)
                </label>
                <input
                  type="number" name="max_students" value={form.max_students} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Groupes associés (classes autorisées)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {groups.map(group => (
                    <label key={group.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.selected_groups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="accent-violet-500"
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingSchool ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale validation paiement */}
      {paymentModalOpen && selectedSchool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Valider paiement - {selectedSchool.name}
              </h2>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Durée de l'abonnement (jours)
                </label>
                <input
                  type="number"
                  value={paymentDays}
                  onChange={(e) => setPaymentDays(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePayment}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? 'Validation...' : 'Valider le paiement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;