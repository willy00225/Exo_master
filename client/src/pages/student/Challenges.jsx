import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Clock, Trophy, UserPlus, Loader, Check, X } from 'lucide-react';
import api from '../../services/api';

const Challenges = () => {
  const [challenges, setChallenges] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/challenges/pending')
      .then(res => setChallenges(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id) => {
    await api.put(`/challenges/${id}/accept`);
    const res = await api.get('/challenges/pending');
    setChallenges(res.data);
  };

  const handleDecline = async (id) => {
    await api.put(`/challenges/${id}/decline`);
    const res = await api.get('/challenges/pending');
    setChallenges(res.data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="ml-3 text-slate-400 text-lg">Chargement des défis…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Challenges</h1>
        <p className="text-slate-400 mt-1">Affrontez vos camarades et mesurez votre niveau</p>
      </motion.div>

      {/* Défis reçus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
          <Swords size={20} className="text-amber-400" />
          Défis reçus ({challenges.received?.length || 0})
        </h2>
        {challenges.received?.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Aucun défi reçu pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {challenges.received.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-white font-medium">{c.challenger_name}</p>
                  <p className="text-sm text-slate-400">{c.quiz_title}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleAccept(c.id)}
                    className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-all"
                  >
                    <Check size={16} /> Accepter
                  </button>
                  <button
                    onClick={() => handleDecline(c.id)}
                    className="flex items-center gap-1 bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-all"
                  >
                    <X size={16} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Défis envoyés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
          <Trophy size={20} className="text-violet-400" />
          Défis envoyés ({challenges.sent?.length || 0})
        </h2>
        {challenges.sent?.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Aucun défi envoyé.</p>
        ) : (
          <div className="space-y-3">
            {challenges.sent.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all"
              >
                <div>
                  <p className="text-white font-medium">{c.challenged_name}</p>
                  <p className="text-sm text-slate-400">{c.quiz_title}</p>
                </div>
                <span className="flex items-center gap-1 text-sm text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                  <Clock size={14} /> En attente
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Challenges;