import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { Loader } from 'lucide-react';

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
      {/* Résumé chiffré */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Quiz passés', value: data.quizzes_done, color: 'text-violet-400' },
          { label: 'Score moyen', value: `${data.avg_score}%`, color: 'text-emerald-400' },
          { label: 'Exercices faits', value: data.exercises_done, color: 'text-amber-400' },
          { label: 'Badges', value: data.badges, color: 'text-cyan-400' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Graphique d'évolution des scores */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Évolution des scores (7 jours)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.score_progress}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
            />
            <Line type="monotone" dataKey="avg_score" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique du temps passé */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Temps passé (minutes)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.time_spent.map(d => ({ ...d, minutes: Math.round(d.total_seconds / 60) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
            />
            <Bar dataKey="minutes" fill="#06B6D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ProgressCharts;