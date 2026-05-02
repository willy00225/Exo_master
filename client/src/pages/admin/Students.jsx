import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Loader, X, AlertCircle, PlusCircle, MinusCircle,
} from 'lucide-react';
import api from '../../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [filter, setFilter] = useState({ group_id: '', subscription_status: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPayments, setShowPayments] = useState(false);
  const [extendDays] = useState(30);

  // Charger les groupes avec log
  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await api.get('/groups');
        console.log('Réponse API /groups :', res.data);
        if (Array.isArray(res.data)) {
          setGroups(res.data);
          if (res.data.length === 0) {
            setGroupsError('Aucun groupe trouvé dans la base.');
          } else {
            setGroupsError('');
          }
        } else if (res.data && Array.isArray(res.data.groups)) {
          setGroups(res.data.groups);
        } else {
          setGroupsError('Format de données inattendu. Voir console.');
          console.error('Format attendu : un tableau ou { groups: [...] }', res.data);
        }
      } catch (err) {
        console.error('Erreur chargement groupes', err);
        setGroupsError('Erreur réseau ou API injoignable.');
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.group_id) params.append('group_id', filter.group_id);
      if (filter.subscription_status) params.append('subscription_status', filter.subscription_status);
      const res = await api.get(`/admin/students?${params.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filter]);

  const handleExtend = async (studentId) => {
    if (!window.confirm(`Prolonger l'abonnement de ${extendDays} jours ?`)) return;
    try {
      await api.put(`/admin/students/${studentId}/subscription`, { action: 'extend', days: extendDays });
      fetchStudents();
    } catch (err) {
      alert('Erreur lors de la prolongation.');
    }
  };

  const handleRevoke = async (studentId) => {
    if (!window.confirm("Révoquer l'abonnement de cet élève ?")) return;
    try {
      await api.put(`/admin/students/${studentId}/subscription`, { action: 'revoke' });
      fetchStudents();
    } catch (err) {
      alert('Erreur.');
    }
  };

  const showPaymentHistory = async (student) => {
    try {
      const res = await api.get(`/admin/students/${student.id}/payments`);
      setPayments(res.data);
      setSelectedStudent(student);
      setShowPayments(true);
    } catch (err) {
      alert('Erreur lors du chargement des paiements.');
    }
  };

  const isActive = (expires) => expires && new Date(expires) > new Date();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Élèves</h1>
        <p className="text-slate-400 mt-1">Gérez les élèves et leurs abonnements</p>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3"
      >
        <Users size={18} className="text-slate-400" />

        {/* Sélecteur de groupe */}
        <div className="relative">
          {groupsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader size={16} className="animate-spin text-slate-400" />
            </div>
          ) : groupsError ? (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={14} /> {groupsError}
            </p>
          ) : (
            <select
              className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              value={filter.group_id}
              onChange={(e) => setFilter({ ...filter, group_id: e.target.value })}
            >
              <option value="">Tous les groupes</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-800 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sélecteur de statut – CORRIGÉ avec classes explicites */}
        <select
          className="bg-white/5 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          value={filter.subscription_status}
          onChange={(e) => setFilter({ ...filter, subscription_status: e.target.value })}
        >
          <option value="" className="bg-slate-800 text-white">Tous les statuts</option>
          <option value="active" className="bg-slate-800 text-white">Actif</option>
          <option value="expired" className="bg-slate-800 text-white">Expiré</option>
        </select>
      </motion.div>

      {/* Liste des élèves */}
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
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun élève trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Élève</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Groupes</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Abonnement</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-sm text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.groups && s.groups[0] ? (
                          s.groups.map((g) => (
                            <span key={g.id} className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs border border-violet-500/30">
                              {g.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">Aucun</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                        isActive(s.subscription_expires)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {isActive(s.subscription_expires)
                          ? `Actif (${new Date(s.subscription_expires).toLocaleDateString()})`
                          : 'Expiré'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExtend(s.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600/30 transition-all"
                        >
                          <PlusCircle size={14} /> Prolonger
                        </button>
                        <button
                          onClick={() => handleRevoke(s.id)}
                          className="inline-flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-all"
                        >
                          <MinusCircle size={14} /> Révoquer
                        </button>
                        <button
                          onClick={() => showPaymentHistory(s)}
                          className="text-violet-400 hover:text-violet-300 text-sm font-medium underline underline-offset-2 transition-colors ml-2"
                        >
                          Paiements
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modale d'historique des paiements */}
      <AnimatePresence>
        {showPayments && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowPayments(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPayments(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-white mb-4 font-space-grotesk">
                Paiements de {selectedStudent.name}
              </h2>
              {payments.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Aucun paiement enregistré.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="p-3 text-slate-300 font-medium">Date</th>
                        <th className="p-3 text-slate-300 font-medium">Montant</th>
                        <th className="p-3 text-slate-300 font-medium">Référence</th>
                        <th className="p-3 text-slate-300 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-white font-medium">{p.amount} FCFA</td>
                          <td className="p-3 text-slate-300">{p.transaction_ref}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.status === 'validated' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;