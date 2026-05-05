import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Loader, Edit3, X, Save, AlertCircle, CheckCircle,
  Search, Filter,
} from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  open: { label: 'Ouvert', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  in_progress: { label: 'En cours', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  closed: { label: 'Fermé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
};

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/support${params}`);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditingNotes(ticket.admin_notes || '');
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put(`/support/${selectedTicket.id}`, {
        status: selectedTicket.status,
        admin_notes: editingNotes,
      });
      setMessage({ type: 'success', text: 'Ticket mis à jour.' });
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = (newStatus) => {
    if (!selectedTicket) return;
    setSelectedTicket({ ...selectedTicket, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Support technique</h1>
        <p className="text-slate-400 mt-1">Gérez les tickets de support des utilisateurs</p>
      </motion.div>

      {/* Filtre */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <Filter size={18} className="text-slate-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvert</option>
          <option value="in_progress">En cours</option>
          <option value="closed">Fermé</option>
        </select>
      </div>

      {/* Liste des tickets */}
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
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun ticket trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Utilisateur</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Sujet</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Statut</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{t.user_name || t.email}</div>
                      <div className="text-sm text-slate-500">{t.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{t.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[t.status]?.color}`}>
                        {statusLabels[t.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openTicket(t)}
                        className="text-violet-400 hover:text-violet-300 p-2 rounded-lg hover:bg-white/10 transition-all"
                        title="Détails"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modale détail ticket */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white font-space-grotesk">{selectedTicket.subject}</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">De : {selectedTicket.user_name || selectedTicket.email}</p>
                  <p className="text-sm text-slate-400">Date : {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Statut</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleChangeStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="closed">Fermé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Note interne</label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Note visible uniquement par les admins..."
                  />
                </div>

                {message.text && (
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    message.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {message.text}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;