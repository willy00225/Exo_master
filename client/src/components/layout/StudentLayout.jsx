import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, HelpCircle, Swords, User, CreditCard, Lock, LogOut, ChevronRight, MessageSquare, Menu, X, Lightbulb
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import NotificationBell from '../../components/common/NotificationBell';
import WhatsAppButton from '../../components/common/WhatsAppButton';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student', icon: Home, label: 'Accueil', end: true },
    { path: '/student/exercises', icon: FileText, label: 'Exercices' },
    { path: '/student/quizzes', icon: HelpCircle, label: 'Quiz' },
    { path: '/student/challenges', icon: Swords, label: 'Challenges' },
    { path: '/student/tips', icon: Lightbulb, label: 'Astuces' },           // 🆕
    { path: '/student/payments', icon: CreditCard, label: 'Paiements' },
    { path: '/student/profile', icon: User, label: 'Profil' },
    { path: '/student/change-password', icon: Lock, label: 'Mot de passe' },
    { path: '/student/support', icon: MessageSquare, label: 'Mes tickets' },
  ];

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
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg">
            {user?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <p className="font-medium text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-400">Élève</p>
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
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-200 border-l-2 border-emerald-400 shadow-sm'
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

      {/* Sidebar desktop */}
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
              <span>par <strong className="font-semibold text-emerald-400">CREATIX</strong></span>
              <span className="hidden md:inline w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="hidden md:inline">Version 1.0.0</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Bouton WhatsApp / Support */}
      <WhatsAppButton />
    </div>
  );
};

export default StudentLayout;