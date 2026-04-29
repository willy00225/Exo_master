import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Trophy, Swords, AlertCircle, CheckCircle,
  BarChart3, TrendingUp, CreditCard, Star,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const StatCard = ({ icon: Icon, value, label, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-all"
  >
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      <Icon size={28} className="text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </motion.div>
);

const StudentDashboard = () => {
  const [stats, setStats] = useState({ exercises: 0, quizzes: 0, activeChallenges: 0 });
  const [subscription, setSubscription] = useState(null);
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, exRes, challRes, quizRes, studentStatsRes] = await Promise.all([
          api.get('/payments/status'),
          api.get('/exercises/student/available'),
          api.get('/challenges/pending'),
          api.get('/quizzes/available'),
          api.get('/student/stats'),
        ]);
        setSubscription(subRes.data);
        setStats({
          exercises: exRes.data.exercises?.length || 0,
          quizzes: quizRes.data?.length || 0,
          activeChallenges: challRes.data.received?.length || 0,
        });
        setPendingChallenges(challRes.data.received || []);
        setStudentStats(studentStatsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 text-lg">Chargement de votre espace…</p>
      </div>
    );
  }

  const isActive = subscription?.is_active;
  const daysRemaining = subscription?.days_remaining || 0;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">
          Bonjour, bienvenue sur EXO MASTER
        </h1>
        <p className="text-slate-400 mt-1">Votre espace d’apprentissage personnalisé</p>
      </motion.div>

      {/* Statut abonnement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-white/5 backdrop-blur-lg border rounded-2xl p-6 ${
          isActive ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {isActive ? (
                <CheckCircle size={28} className="text-emerald-400" />
              ) : (
                <AlertCircle size={28} className="text-red-400" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {isActive ? 'Abonnement actif' : 'Aucun abonnement actif'}
              </p>
              {isActive && (
                <p className="text-slate-400 text-sm">
                  Expire dans <span className="text-emerald-400 font-bold">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>
                </p>
              )}
              {!isActive && (
                <p className="text-red-400 text-sm">
                  Votre essai a expiré ou vous n’avez pas d’abonnement.
                </p>
              )}
            </div>
          </div>
          {!isActive && (
            <Link
              to="/student/subscription"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg self-start"
            >
              <CreditCard size={18} />
              Souscrire maintenant
            </Link>
          )}
        </div>
      </motion.div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          value={stats.exercises}
          label="Exercices disponibles"
          gradient="from-violet-500 to-violet-700"
        />
        <StatCard
          icon={Trophy}
          value={stats.quizzes}
          label="Quiz à faire"
          gradient="from-cyan-500 to-cyan-700"
        />
        <StatCard
          icon={Swords}
          value={stats.activeChallenges}
          label="Défis en attente"
          gradient="from-amber-500 to-amber-700"
        />
      </div>

      {/* Performances et graphiques */}
      {studentStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Résumé chiffré */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
              <TrendingUp className="text-violet-400" size={22} />
              Vos performances
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between bg-white/5 p-3 rounded-xl">
                <span className="text-slate-300">Quiz complétés</span>
                <span className="font-bold text-white">{studentStats.total_attempts}</span>
              </div>
              <div className="flex justify-between bg-white/5 p-3 rounded-xl">
                <span className="text-slate-300">Score moyen</span>
                <span className="font-bold text-cyan-400">{studentStats.average_score}%</span>
              </div>
              <div className="flex justify-between bg-white/5 p-3 rounded-xl">
                <span className="text-slate-300">Meilleur score</span>
                <span className="font-bold text-emerald-400">{studentStats.best_score}%</span>
              </div>
            </div>
          </div>

          {/* Graphique par chapitre (barres) */}
          {studentStats.per_chapter?.length > 0 && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
                <BarChart3 className="text-cyan-400" size={22} />
                Par chapitre
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={studentStats.per_chapter}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="chapter_title" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #4B5563',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="average_score"
                    fill="#8B5CF6"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {/* Défis en attente + graphique circulaire de répartition des matières */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Défis */}
        {pendingChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
              <Swords className="text-amber-400" size={22} />
              Défis en attente ({pendingChallenges.length})
            </h2>
            <div className="space-y-3">
              {pendingChallenges.map((challenge, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Swords size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {challenge.challenger_name || 'Un élève'} vs {challenge.opponent_name || 'Vous'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {challenge.exercise_title || 'Défi sans titre'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/student/challenges/${challenge.id}`}
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                  >
                    Répondre
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Répartition des quiz par matière (PieChart) */}
        {studentStats?.quizzes_by_subject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
              <Star className="text-amber-400" size={22} />
              Quiz par matière
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={studentStats.quizzes_by_subject}
                  dataKey="count"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({ subject, percent }) => `${subject} ${(percent * 100).toFixed(0)}%`}
                >
                  {studentStats.quizzes_by_subject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Jauge de progression globale */}
      {studentStats?.overall_progress !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col items-center"
        >
          <h2 className="text-lg font-semibold text-white mb-6 font-space-grotesk self-start">
            Progression globale
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              barSize={20}
              data={[{ name: 'Progression', value: studentStats.overall_progress }]}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                fill="url(#studentGradient)"
                cornerRadius={10}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 22, fontWeight: 'bold' }}
              />
              <defs>
                <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-slate-400 text-sm mt-4">
            Vous avez complété {studentStats.overall_progress}% du programme
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;