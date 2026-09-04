import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { Loader, Target, Clock, Award, FileText, TrendingUp } from 'lucide-react';

// Composant jauge circulaire pour le score moyen
const CircularScore = ({ percent }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const color = percent >= 70 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#ffffff20" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
        {percent}%
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
  >
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400 text-center">{label}</p>
  </motion.div>
);

const ProgressCharts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/stats/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader className="animate-spin text-violet-400 mx-auto" size={32} />;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Carte principale avec score moyen et jauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-violet-600/20 to-cyan-600/20 backdrop-blur-lg border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-3"
      >
        <h2 className="text-lg font-semibold text-white">Score moyen</h2>
        <CircularScore percent={data.avg_score} />
        <p className="text-sm text-slate-300">Continuez comme ça !</p>
      </motion.div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Quiz passés"
          value={data.quizzes_done}
          color="bg-violet-500"
          delay={0.1}
        />
        <StatCard
          icon={FileText}
          label="Exercices faits"
          value={data.exercises_done}
          color="bg-emerald-500"
          delay={0.2}
        />
        <StatCard
          icon={Clock}
          label="Temps passé (min)"
          value={Math.round(data.time_spent.reduce((acc, d) => acc + d.total_seconds, 0) / 60)}
          color="bg-amber-500"
          delay={0.3}
        />
        <StatCard
          icon={Award}
          label="Badges"
          value={data.badges}
          color="bg-cyan-500"
          delay={0.4}
        />
      </div>

      {/* Graphique d'évolution des scores */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Évolution des scores (7 jours)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.score_progress}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="avg_score"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Graphique du temps passé */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-300">Temps passé (minutes)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.time_spent.map(d => ({ ...d, minutes: Math.round(d.total_seconds / 60) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
            />
            <Bar dataKey="minutes" fill="#06B6D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default ProgressCharts;