import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, BookOpen, FileText, HelpCircle, CreditCard, Settings, LogOut, ChevronRight, Swords, Ticket, Menu, X, Mail, Lightbulb, Database
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import NotificationBell from '../../components/common/NotificationBell';
import AdminSupportButton from '../../components/common/AdminSupportButton';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
    { path: '/admin/students', icon: Users, label: 'Élèves' },
    { path: '/admin/groups', icon: Users, label: 'Classes' }, // Modifié : 'Groupes' → 'Classes'
    { path: '/admin/chapters', icon: BookOpen, label: 'Chapitres' },
    { path: '/admin/exercises', icon: FileText, label: 'Exercices' },
    { path: '/admin/quizzes', icon: HelpCircle, label: 'Quiz' },
    { path: '/admin/question-bank', icon: Database, label: 'Banque de questions' },
    { path: '/admin/challenges', icon: Swords, label: 'Challenges' },
    { path: '/admin/invitations', icon: Mail, label: 'Invitations' },
    { path: '/admin/tips', icon: Lightbulb, label: 'Astuces' },
    { path: '/admin/payments', icon: CreditCard, label: 'Paiements' },
    { path: '/admin/settings', icon: Settings, label: 'Paramètres' },
    { path: '/admin/support', icon: Ticket, label: 'Support' },
  ];

  // Composant de navigation réutilisé dans la sidebar et le menu mobile
  const NavContent = () => (
    <>
      {/* Logo */}
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
            onClick={() => setSidebarOpen(false)}  // ferme le menu mobile après clic
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
    </>
  );

  return (
    <div className="flex h-full bg-[#0B0E1A] text-white font-sans overflow-hidden">
      {/* Bouton hamburger mobile */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white/10 rounded-lg text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar desktop (toujours visible sur grand écran) */}
      <aside className="hidden lg:flex w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex-col shadow-2xl">
        <NavContent />
      </aside>

      {/* Drawer mobile */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl lg:hidden"
      >
        <NavContent />
      </motion.aside>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E1A] lg:pl-0 pt-14 lg:pt-0">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-4 md:p-8"
        >
          <Outlet />
        </motion.main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:justify-between items-center text-sm text-slate-400 gap-2">
            <p>© 2026 EXO MASTER. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span>par <strong className="font-semibold text-violet-400">CREATIX</strong></span>
              <span className="hidden md:inline w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="hidden md:inline">Version 1.0.0</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Support technique admin */}
      <AdminSupportButton />
    </div>
  );
};

export default AdminLayout;