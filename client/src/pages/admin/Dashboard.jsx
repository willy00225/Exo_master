import { useEffect, useState } from 'react';
import { Users, BookOpen, CreditCard, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500"></div>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    groups: 0,
    pendingPayments: 0,
    activeQuizzes: 0
  });

  useEffect(() => {
    // À implémenter avec les vrais appels API
    const fetchStats = async () => {
      try {
        // Exemple: const res = await api.get('/admin/stats');
        // setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble de votre plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard title="Élèves actifs" value={stats.students} icon={Users} color="bg-blue-500" />
        <StatCard title="Groupes" value={stats.groups} icon={BookOpen} color="bg-violet-500" />
        <StatCard title="Paiements en attente" value={stats.pendingPayments} icon={CreditCard} color="bg-amber-500" />
        <StatCard title="Quiz disponibles" value={stats.activeQuizzes} icon={TrendingUp} color="bg-emerald-500" />
      </div>

      {/* Espaceur flexible pour combler le vide vertical */}
      <div className="flex-1" />

      {/* Ici nous ajouterons des graphiques et listes plus tard, 
          ils pourront être placés avant le flex-1 ou après selon la mise en page souhaitée */}
    </div>
  );
};

export default AdminDashboard;