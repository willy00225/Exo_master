import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Clock, CreditCard } from 'lucide-react';
import api from '../../services/api';

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    exercisesCompleted: 0,
    quizzesPassed: 0,
    challengesWon: 0,
  });
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Récupération des statistiques (à adapter selon votre API)
    const fetchStats = async () => {
      try {
        const res = await api.get('/student/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    // Récupération du statut d'abonnement
    const fetchSubscription = async () => {
      try {
        const res = await api.get('/student/subscription');
        setSubscription(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
    fetchSubscription();
  }, []);

  const statItems = [
    { label: 'Exercices terminés', value: stats.exercisesCompleted, icon: BookOpen, color: 'from-violet-500 to-violet-600' },
    { label: 'Quiz réussis', value: stats.quizzesPassed, icon: Trophy, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Challenges gagnés', value: stats.challengesWon, icon: Clock, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Mon tableau de bord</h1>
        <p className="text-slate-400 mt-1">Suivez votre progression et vos performances</p>
      </motion.div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <item.icon size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">{item.value}</span>
            </div>
            <p className="text-sm text-slate-400">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Statut d'abonnement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-3 font-space-grotesk">Abonnement</h2>
        {subscription ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600/30 to-cyan-600/30 flex items-center justify-center">
                <CreditCard size={20} className="text-violet-300" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {subscription.is_active ? 'Abonnement actif' : 'Aucun abonnement actif'}
                </p>
                {subscription.is_active && (
                  <p className="text-sm text-slate-400">
                    Expire le {new Date(subscription.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {!subscription.is_active && (
              <Link
                to="/student/subscription"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                Souscrire maintenant
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-slate-400">Chargement des informations...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;