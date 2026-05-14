import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Clock, CheckCircle, XCircle, Trophy, User, Filter, Loader,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: Clock },
  accepted: { label: 'Accepté', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: CheckCircle },
  declined: { label: 'Refusé', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
  completed: { label: 'Terminé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: Trophy },
};

const SummaryCards = ({ challenges }) => {
  const counts = {
    pending: challenges.filter(c => c.status === 'pending').length,
    accepted: challenges.filter(c => c.status === 'accepted').length,
    declined: challenges.filter(c => c.status === 'declined').length,
    completed: challenges.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {Object.entries(counts).map(([status, count]) => {
        const config = statusLabels[status];
        const Icon = config.icon;
        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg ${config.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-400">{config.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/challenges/all${params}`);
      setChallenges(res.data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les challenges. Veuillez réessayer.');
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

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{error}</p>
        <button
          onClick={fetchChallenges}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <Swords className="text-violet-400" size={28} />
            Challenges
          </h1>
          <p className="text-slate-400 mt-1">Suivez les duels entre élèves</p>
        </div>
      </motion.div>

      <SummaryCards challenges={challenges} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <span className="text-sm text-slate-400">Filtrer par statut</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'accepted', 'declined', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status === '' ? 'Tous' : statusLabels[status]?.label || status}
            </button>
          ))}
        </div>
      </motion.div>

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
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <User size={14} className="text-violet-400" />
                          </div>
                          <span className="text-white font-medium">{c.challenger_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <User size={14} className="text-cyan-400" />
                          </div>
                          <span className="text-white font-medium">{c.challenged_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate" title={c.quiz_title}>
                        {c.quiz_title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[c.status]?.color}`}>
                          <StatusIcon size={12} />
                          {statusLabels[c.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.status === 'completed' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-semibold">{c.challenger_score}</span>
                            <span className="text-slate-500">-</span>
                            <span className="font-mono text-white font-semibold">{c.challenged_score}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.status === 'completed' && c.winner_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Trophy size={14} className="text-emerald-400" />
                            {getWinnerName(c)}
                          </span>
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