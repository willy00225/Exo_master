import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Star, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const GamificationCard = () => {
  const [xpData, setXpData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/gamification')
      .then(res => {
        setXpData(res.data.xp);
        setBadges(res.data.badges);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const xpForNextLevel = xpData.level * 100;
  const progress = ((xpData.total_xp % 100) / 100) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <Star size={32} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">Niveau {xpData.level}</p>
          <p className="text-sm text-slate-400">{xpData.total_xp} XP</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progression niveau {xpData.level + 1}</span>
          <span>{xpData.total_xp % 100} / 100 XP</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
          />
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Award size={16} className="text-amber-400" />
          Badges ({badges.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun badge pour l'instant. Continuez vos efforts !</p>
          ) : (
            badges.map(badge => (
              <motion.div
                key={badge.badge_key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2 cursor-help"
                title={badge.description}
              >
                <span className="text-lg">{badge.icon}</span>
                <span className="text-xs font-medium text-amber-300">{badge.name}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GamificationCard;