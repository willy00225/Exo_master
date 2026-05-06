import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Trash2, Filter, Loader, XCircle, CheckCircle, Clock,
  User, BookOpen, Swords,
} from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: Clock },
  accepted: { label: 'Acceptée', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
  expired: { label: 'Expirée', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
};

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get('/groups')
      .then(res => setGroups(res.data))
      .catch(console.error);
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterGroup) params.append('group_id', filterGroup);
      const res = await api.get(`/admin/invitations?${params.toString()}`);
      setInvitations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [filterStatus, filterGroup]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette invitation ?')) return;
    try {
      await api.delete(`/admin/invitations/${id}`);
      fetchInvitations();
    } catch (err) {
      alert('Erreur lors de la suppression.');
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
            <Mail className="text-violet-400" size={28} />
            Invitations
          </h1>
          <p className="text-slate-400 mt-1">Suivez les liens d’invitation générés par les élèves</p>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3"
      >
        <Filter size={20} className="text-slate-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="accepted">Acceptée</option>
          <option value="expired">Expirée</option>
        </select>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Tous les groupes</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucune invitation trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Challenger</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Défié</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Quiz</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Groupe</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Statut</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invitations.map(inv => {
                  const StatusIcon = statusLabels[inv.status]?.icon || Clock;
                  return (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="text-white font-medium">{inv.challenger_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {inv.challenged_name ? (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <span className="text-white font-medium">{inv.challenged_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={inv.quiz_title}>
                        {inv.quiz_title}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{inv.group_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[inv.status]?.color}`}>
                          <StatusIcon size={12} />
                          {statusLabels[inv.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Supprimer l'invitation"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Invitations;