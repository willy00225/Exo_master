import { useState, useEffect, useCallback } from 'react';
import { Swords, Clock, Trophy, Loader, Check, X, Play, History, User } from 'lucide-react';
import api from '../../services/api';
import ChallengeForm from '../../components/student/ChallengeForm';
import QuizGame from '../../components/student/QuizGame';

const Challenges = () => {
  const [challenges, setChallenges] = useState({ received: [], sent: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  const fetchChallenges = useCallback(async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/challenges/pending'),
        api.get('/challenges/history'),
      ]);
      setChallenges(pendingRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchissement automatique toutes les 10 secondes
  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 10000);
    return () => clearInterval(interval);
  }, [fetchChallenges]);

  const handleAccept = async (id) => {
    await api.put(`/challenges/${id}/accept`);
    fetchChallenges();
  };

  const handleDecline = async (id) => {
    await api.put(`/challenges/${id}/decline`);
    fetchChallenges();
  };

  // Si un défi est en cours, on affiche le jeu
  if (activeChallenge) {
    return (
      <QuizGame
        challengeId={activeChallenge}
        onBack={() => {
          setActiveChallenge(null);
          fetchChallenges();
        }}
      />
    );
  }

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
      <div>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Challenges</h1>
        <p className="text-slate-400 mt-1">Affrontez vos camarades et mesurez votre niveau</p>
      </div>

      <ChallengeForm onChallengeSent={fetchChallenges} />

      {/* Onglets */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Swords size={16} className="inline mr-1" /> En cours
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <History size={16} className="inline mr-1" /> Historique
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {/* Défis reçus */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
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
                      {c.has_played && (
                        <span className="text-xs text-slate-500">Vous avez déjà joué</span>
                      )}
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      {c.status === 'pending' && (
                        <>
                          <button onClick={() => handleAccept(c.id)}
                            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-all"
                          >
                            <Check size={16} /> Accepter
                          </button>
                          <button onClick={() => handleDecline(c.id)}
                            className="flex items-center gap-1 bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-all"
                          >
                            <X size={16} /> Refuser
                          </button>
                        </>
                      )}
                      {c.status === 'accepted' && !c.has_played && (
                        <button onClick={() => setActiveChallenge(c.id)}
                          className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-all"
                        >
                          <Play size={16} /> Jouer
                        </button>
                      )}
                      {c.status === 'accepted' && c.has_played && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                          <Clock size={14} /> En attente de l'adversaire
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Défis envoyés */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
              <Trophy size={20} className="text-violet-400" />
              Défis envoyés ({challenges.sent?.length || 0})
            </h2>
            {challenges.sent?.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucun défi envoyé.</p>
            ) : (
              <div className="space-y-3">
                {challenges.sent.map((c) => (
                  <div key={c.id}
                    className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all"
                  >
                    <div>
                      <p className="text-white font-medium">{c.challenged_name}</p>
                      <p className="text-sm text-slate-400">{c.quiz_title}</p>
                      {c.has_played && (
                        <span className="text-xs text-slate-500">Vous avez déjà joué</span>
                      )}
                    </div>
                    {!c.has_played && c.status === 'accepted' ? (
                      <button
                        onClick={() => setActiveChallenge(c.id)}
                        className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-all"
                      >
                        <Play size={16} /> Jouer
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                        <Clock size={14} /> {c.has_played ? 'En attente adverse' : 'En attente'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Historique */}
      {activeTab === 'history' && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <History size={20} className="text-violet-400" />
            Historique des défis terminés
          </h2>
          {history.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Aucun défi terminé pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {history.map((c) => (
                <div key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="text-white font-medium">
                      <User size={14} className="inline mr-1" />
                      {c.challenger_name} vs {c.challenged_name}
                    </p>
                    <p className="text-sm text-slate-400">{c.quiz_title}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-slate-500">{c.challenger_score} pts</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-slate-500">{c.challenged_score} pts</span>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center items-center">
                    {c.winner_id && (
                      <span className="flex items-center gap-1 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                        <Trophy size={14} />
                        Gagnant : {c.winner_id === c.challenger_id ? c.challenger_name : c.challenged_name}
                      </span>
                    )}
                    {!c.winner_id && (
                      <span className="text-sm text-slate-500 bg-white/5 px-3 py-1 rounded-full">Égalité</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Challenges;