import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, HelpCircle, Swords, User, CreditCard, Lock, LogOut,
  ChevronRight, MessageSquare, Menu, X, Lightbulb, GraduationCap, AlertTriangle,
  Bell, ChevronDown
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import NotificationBell from '../../components/common/NotificationBell';
import WhatsAppButton from '../../components/common/WhatsAppButton';
import BottomNav from '../../components/common/BottomNav';
import api from '../../services/api';

const UNRESTRICTED_ROUTES = [
  '/student/subscription',
  '/student/payments',
  '/student/profile',
  '/student/support',
  '/student/change-password',
  '/student/change-class',
];

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await api.get('/payments/status');
        setIsSubscriptionActive(res.data.is_active === true);
      } catch (err) {
        setIsSubscriptionActive(false);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, []);

  // Fermer le menu profil au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isUnrestrictedPage = UNRESTRICTED_ROUTES.some(route =>
    location.pathname.startsWith(route)
  );

  const navItems = [
    { path: '/student', icon: Home, label: 'Accueil', end: true },
    { path: '/student/exercises', icon: FileText, label: 'Exercices' },
    { path: '/student/quizzes', icon: HelpCircle, label: 'Quiz' },
    { path: '/student/challenges', icon: Swords, label: 'Challenges' },
    { path: '/student/tips', icon: Lightbulb, label: 'Astuces' },
    { path: '/student/change-class', icon: GraduationCap, label: 'Changer de classe' },
    { path: '/student/payments', icon: CreditCard, label: 'Paiements' },
    { path: '/student/profile', icon: User, label: 'Profil' },
    { path: '/student/change-password', icon: Lock, label: 'Mot de passe' },
    { path: '/student/support', icon: MessageSquare, label: 'Mes tickets' },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-white/10 flex flex-col items-center">
        <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          DEVENEZ LE MEILLEUR
        </p>
      </div>

      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-lg">
            {user?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <p className="font-medium text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-400">Élève</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-violet-200 shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-violet-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={16} className="opacity-50" />
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-full bg-[#0B0E1A] text-white font-sans overflow-hidden">
      {/* Bouton hamburger mobile - avec safe area top */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white/10 rounded-xl text-white active:scale-95 transition-transform"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Header mobile avec avatar et notifications - safe area top */}
      <header className="lg:hidden fixed top-0 right-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex items-center gap-3">
        <div className="relative" data-profile-menu>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'E'}
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <button
                  onClick={() => { setProfileMenuOpen(false); navigate('/student/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10"
                >
                  <User size={16} /> Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <NotificationBell />
      </header>

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

      {/* Drawer mobile - animation framer-motion */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl lg:hidden"
          >
            <NavContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Zone principale - padding top ajusté pour safe area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E1A] lg:pl-0 pt-[calc(env(safe-area-inset-top)+3.5rem)] lg:pt-0 pb-20 lg:pb-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {checkingSubscription ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full"
              />
              <p className="text-slate-400 text-lg">Vérification de votre abonnement…</p>
            </div>
          ) : !isSubscriptionActive && !isUnrestrictedPage ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Accès restreint</h1>
              <p className="text-slate-400 text-center max-w-md">
                Votre abonnement a expiré ou est inactif. Veuillez souscrire un abonnement pour accéder à la plateforme.
              </p>
              <button
                onClick={() => navigate('/student/subscription')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg active:scale-95"
              >
                <CreditCard size={20} />
                Souscrire maintenant
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md px-4 md:px-8 py-4 hidden lg:block">
          <div className="flex flex-col md:flex-row md:justify-between items-center text-sm text-slate-400 gap-2">
            <p>© 2026 EXO MASTER. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <span>par <strong className="font-semibold text-cyan-400">CREATIX</strong></span>
              <span className="hidden md:inline w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="hidden md:inline">Version 1.0.0</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Bottom Navigation mobile - cohérente avec le thème violet/cyan */}
      <BottomNav />

      <WhatsAppButton />
    </div>
  );
};

export default StudentLayout;