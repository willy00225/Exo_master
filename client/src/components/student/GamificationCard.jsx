import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Zap, Star, TrendingUp, Lock, CheckCircle } from 'lucide-react';
import api from '../../services/api';

// Composant BadgeItem avec animation
const BadgeItem = ({ badge, index }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-amber-500/20 transition-colors">
        <span className="text-xl">{badge.icon}</span>
        <span className="text-xs font-medium text-amber-300">{badge.name}</span>
      </div>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-slate-300 shadow-lg"
          >
            {badge.description}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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

  // Calcul de la progression vers le niveau suivant
  const currentLevel = xpData.level || 1;
  const xpForCurrentLevel = currentLevel * 100; // exemple : niveau 1 -> 100 XP, niveau 2 -> 200 XP, etc.
  const xpIntoLevel = xpData.total_xp % 100;
  const progressPercent = (xpIntoLevel / 100) * 100;
  const xpNeededForNextLevel = 100 - xpIntoLevel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
    >
      {/* Niveau et XP */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
        >
          <Star size={32} className="text-white" />
        </motion.div>
        <div>
          <p className="text-2xl font-bold text-white">Niveau {currentLevel}</p>
          <p className="text-sm text-slate-400">{xpData.total_xp} XP</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progression vers le niveau {currentLevel + 1}</span>
          <span>{xpIntoLevel} / 100 XP</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Encore {xpNeededForNextLevel} XP pour atteindre le niveau {currentLevel + 1}
        </p>
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
            badges.map((badge, index) => (
              <BadgeItem key={badge.badge_key} badge={badge} index={index} />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GamificationCard;