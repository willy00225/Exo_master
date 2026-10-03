import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { Loader, Target, Clock, Award, FileText, TrendingUp } from 'lucide-react';

// Composant jauge circulaire — animation CSS au lieu de Framer Motion
const CircularScore = ({ percent }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  // Couleurs harmonisées : violet/cyan au lieu d'emerald/amber/red
  const color = percent >= 70 ? '#06B6D4' : percent >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#ffffff20" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
        {percent}%
      </div>
    </div>
  );
};

// Carte statique sans animation
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400 text-center">{label}</p>
  </div>
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
    <div className="space-y-6">
      {/* Carte principale avec score moyen */}
      <div className="bg-gradient-to-br from-violet-600/20 to-cyan-600/20 backdrop-blur-lg border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Score moyen</h2>
        <CircularScore percent={data.avg_score} />
        <p className="text-sm text-slate-300">Continuez comme ça !</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Quiz passés"
          value={data.quizzes_done}
          color="bg-violet-500"
        />
        <StatCard
          icon={FileText}
          label="Exercices faits"
          value={data.exercises_done}
          color="bg-cyan-500"
        />
        <StatCard
          icon={Clock}
          label="Temps passé (min)"
          value={Math.round(data.time_spent.reduce((acc, d) => acc + d.total_seconds, 0) / 60)}
          color="bg-amber-500"
        />
        <StatCard
          icon={Award}
          label="Badges"
          value={data.badges}
          color="bg-violet-500"
        />
      </div>

      {/* Graphique d'évolution des scores */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6">
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
      </div>

      {/* Graphique du temps passé */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6">
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
      </div>
    </div>
  );
};

export default ProgressCharts;