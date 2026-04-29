import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Clock, CheckCircle, XCircle, Trophy, User, Filter, Loader,
} from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: Clock },
  accepted: { label: 'Accepté', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: CheckCircle },
  declined: { label: 'Refusé', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
  completed: { label: 'Terminé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: Trophy },
};

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/challenges/all${params}`);
      setChallenges(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [statusFilter]);

  const getWinnerName = (challenge) => {
    if (!challenge.winner_id) return '—';
    return challenge.winner_id === challenge.challenger_id
      ? challenge.challenger_name
      : challenge.challenged_name;
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
            <Swords className="text-violet-400" />
            Challenges
          </h1>
          <p className="text-slate-400 mt-1">Suivez les duels entre élèves</p>
        </div>
      </motion.div>

      {/* Filtre */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-3"
      >
        <Filter size={20} className="text-slate-400" />
        <select
          className="bg-white/5 border border-white/20 rounded-lg text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="accepted">Accepté</option>
          <option value="declined">Refusé</option>
          <option value="completed">Terminé</option>
        </select>
      </motion.div>

      {/* Tableau des challenges */}
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
        ) : challenges.length === 0 ? (
          <div className="p-12 text-center">
            <Swords size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun challenge trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Challenger</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Adversaire</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Quiz</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Scores</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Gagnant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {challenges.map((c) => {
                  const StatusIcon = statusLabels[c.status]?.icon || Clock;
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="text-white font-medium">{c.challenger_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="text-white font-medium">{c.challenged_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{c.quiz_title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[c.status]?.color}`}>
                          <StatusIcon size={12} />
                          {statusLabels[c.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.status === 'completed' ? (
                          <span className="font-mono text-white">
                            {c.challenger_score} - {c.challenged_score}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.status === 'completed' && c.winner_id ? (
                          <span className="text-emerald-400 font-medium">{getWinnerName(c)}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
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

export default Challenges;