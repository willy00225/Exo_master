import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, BookOpen, FileText, HelpCircle, CreditCard, Settings, LogOut, ChevronRight, Swords
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import NotificationBell from '../../components/common/NotificationBell';
import WhatsAppButton from '../../components/common/WhatsAppButton'; // 🆕

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
    { path: '/admin/students', icon: Users, label: 'Élèves' },
    { path: '/admin/groups', icon: Users, label: 'Groupes' },
    { path: '/admin/chapters', icon: BookOpen, label: 'Chapitres' },
    { path: '/admin/exercises', icon: FileText, label: 'Exercices' },
    { path: '/admin/quizzes', icon: HelpCircle, label: 'Quiz' },
    { path: '/admin/challenges', icon: Swords, label: 'Challenges' },
    { path: '/admin/payments', icon: CreditCard, label: 'Paiements' },
    { path: '/admin/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex h-full bg-[#0B0E1A] text-white font-sans overflow-hidden">
      {/* Sidebar verre dépoli */}
      <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl">
        {/* En-tête avec logo */}
        <div className="p-6 border-b border-white/10 flex flex-col items-center">
          <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </div>

        {/* Profil utilisateur + notifications */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-400">Administrateur</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-violet-200 border-l-2 border-violet-400 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={16} className="opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E1A]">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-8"
        >
          <Outlet />
        </motion.main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md px-8 py-4">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <p>© 2026 EXO MASTER. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span>par <strong className="font-semibold text-violet-400">CREATIX</strong></span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span>Version 1.0.0</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Bouton WhatsApp flottant */}
      <WhatsAppButton />
    </div>
  );
};

export default AdminLayout;