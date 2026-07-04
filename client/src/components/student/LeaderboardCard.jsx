import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import api from '../../services/api';

const LeaderboardCard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-amber-400" />
        Classement
      </h3>
      <div className="space-y-2">
        {leaders.slice(0, 10).map((user, idx) => (
          <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-400 w-6">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
              </span>
              <span className="text-sm text-white">{user.name}</span>
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-violet-400 font-medium">{user.total_xp} XP</span>
              <span className="ml-2 text-slate-500">Niv. {user.level}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default LeaderboardCard;