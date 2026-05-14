import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, CreditCard, HelpCircle, Swords, TrendingUp,
  PieChart, DollarSign, AlertTriangle,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const StatCard = ({ title, value, icon: Icon, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:bg-white/10 transition-all"
  >
    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    groups: 0,
    pendingPayments: 0,
    quizzes: 0,
    activeChallenges: 0,
    activeSubscriptions: 0,
    totalSubscriptions: 0,
  });
  const [monthly, setMonthly] = useState([]);
  const [paymentsByMethod, setPaymentsByMethod] = useState([]);
  const [studentsByGroup, setStudentsByGroup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);               // 🆕 état d'erreur

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, monthlyRes, paymentsRes, groupsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/monthly'),
          api.get('/admin/stats/payments-by-method'),
          api.get('/admin/stats/students-by-group'),
        ]);
        setStats(statsRes.data);
        setMonthly(monthlyRes.data);
        setPaymentsByMethod(paymentsRes.data);
        setStudentsByGroup(groupsRes.data);
        setError(null); // efface toute erreur précédente
      } catch (err) {
        console.error('Erreur chargement des statistiques', err);
        setError('Impossible de charger les statistiques. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ---- affichage pendant le chargement ----
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 text-lg">Chargement du tableau de bord…</p>
      </div>
    );
  }

  // ---- affichage en cas d'erreur ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-slate-400 text-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Rafraîchir la page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">
          Tableau de bord administrateur
        </h1>
        <p className="text-slate-400 mt-1">Vue d’ensemble de votre plateforme</p>
      </motion.div>

      {/* Cartes statistiques – responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard title="Élèves" value={stats.students} icon={Users} gradient="from-violet-500 to-violet-700" />
        <StatCard title="Groupes" value={stats.groups} icon={BookOpen} gradient="from-cyan-500 to-cyan-700" />
        <StatCard title="Paiements en attente" value={stats.pendingPayments} icon={CreditCard} gradient="from-amber-500 to-amber-700" />
        <StatCard title="Quiz" value={stats.quizzes} icon={HelpCircle} gradient="from-emerald-500 to-emerald-700" />
        <StatCard title="Challenges actifs" value={stats.activeChallenges} icon={Swords} gradient="from-rose-500 to-rose-700" />
      </div>

      {/* Graphiques – première ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Inscriptions mensuelles (ligne) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <TrendingUp className="text-violet-400" size={22} />
            Inscriptions (12 mois)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis allowDecimals={false} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6, fill: '#06B6D4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Répartition des paiements (pie) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <PieChart className="text-cyan-400" size={22} />
            Paiements par méthode
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={paymentsByMethod}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentsByMethod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Graphiques – deuxième ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Élèves par groupe (barres) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <Users className="text-emerald-400" size={22} />
            Élèves par groupe
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentsByGroup}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis allowDecimals={false} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Taux d’abonnement actif (jauge radiale) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center"
        >
          <h2 className="text-lg font-semibold text-white mb-6 font-space-grotesk self-start">
            Abonnements actifs
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              barSize={20}
              data={[{ name: 'Actifs', value: stats.activeSubscriptions }]}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                fill="url(#gradient)"
                cornerRadius={10}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 20, fontWeight: 'bold' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-slate-400 text-sm mt-4">
            {stats.activeSubscriptions || 0} / {stats.totalSubscriptions || 0} abonnements actifs
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;