import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import api from '../../services/api';

// Composant pour un élément du classement
const LeaderboardItem = ({ user, index }) => {
  // Déterminer le style selon le rang
  const isTop3 = index < 3;
  const medalColors = [
    'text-amber-400 bg-amber-500/20 border-amber-500/30',
    'text-slate-300 bg-slate-500/20 border-slate-400/30',
    'text-orange-400 bg-orange-500/20 border-orange-500/30',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-xl border ${
        isTop3 ? medalColors[index] : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
          isTop3 ? 'bg-white/10' : 'bg-white/5'
        }`}>
          {index === 0 ? (
            <Trophy size={18} className="text-amber-400" />
          ) : index === 1 ? (
            <Medal size={18} className="text-slate-300" />
          ) : index === 2 ? (
            <Medal size={18} className="text-orange-400" />
          ) : (
            <span className="text-sm font-bold text-slate-400">{index + 1}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-500">Niveau {user.level}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-violet-400">{user.total_xp} XP</p>
        {isTop3 && <Star size={14} className="inline text-amber-400 ml-1" />}
      </div>
    </motion.div>
  );
};

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
          <LeaderboardItem key={user.id} user={user} index={idx} />
        ))}
      </div>
    </motion.div>
  );
};

export default LeaderboardCard;