import { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle, XCircle, Trophy, User, Filter } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const statusLabels = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Accepté', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  declined: { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: Trophy },
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
    return challenge.winner_id === challenge.challenger_id ? challenge.challenger_name : challenge.challenged_name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Swords className="text-violet-600" />
            Challenges
          </h1>
          <p className="text-slate-500 mt-1">Suivez les duels entre élèves</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter size={18} className="text-slate-400" />
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Accepté</option>
            <option value="declined">Refusé</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
      </Card>

      {/* Liste des challenges */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : challenges.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Swords size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun challenge trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Challenger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Adversaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gagnant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {challenges.map((c) => {
                const StatusIcon = statusLabels[c.status]?.icon || Clock;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium">{c.challenger_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium">{c.challenged_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.quiz_title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusLabels[c.status]?.color}`}>
                        <StatusIcon size={12} />
                        {statusLabels[c.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'completed' ? (
                        <span className="font-mono">
                          {c.challenger_score} - {c.challenged_score}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'completed' && c.winner_id ? (
                        <span className="font-medium text-green-700">{getWinnerName(c)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default Challenges;