import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Home, FileText, HelpCircle, Swords, User, CreditCard, Lock, LogOut,
  ChevronRight, MessageSquare, Menu, X, Lightbulb, GraduationCap, AlertTriangle
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import NotificationBell from '../../components/common/NotificationBell';
import WhatsAppButton from '../../components/common/WhatsAppButton';
import BottomNav from '../../components/common/BottomNav'; // 🆕 import
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
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex-col shadow-2xl">
        <NavContent />
      </aside>

      {/* Drawer mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E1A] lg:pl-0 pt-14 lg:pt-0 pb-20 lg:pb-0"> {/* 🆕 pb-20 pour mobile */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {checkingSubscription ? (
            <div className="flex items-center justify-center h-full">
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                <CreditCard size={20} />
                Souscrire maintenant
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md px-4 md:px-8 py-4 hidden lg:block"> {/* 🆕 caché sur mobile */}
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

      {/* 🆕 Bottom Navigation mobile */}
      <BottomNav />

      <WhatsAppButton />
    </div>
  );
};

export default StudentLayout;