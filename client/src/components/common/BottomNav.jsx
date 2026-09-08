import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Swords, HelpCircle, User } from 'lucide-react';

const navItems = [
  { to: '/student', label: 'Accueil', icon: Home, end: true },
  { to: '/student/exercises', label: 'Exercices', icon: BookOpen },
  { to: '/student/quizzes', label: 'Quiz', icon: HelpCircle },
  { to: '/student/challenges', label: 'Défis', icon: Swords },
  { to: '/student/profile', label: 'Profil', icon: User, badge: 1 },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E1A]/95 backdrop-blur-lg border-t border-white/10 lg:hidden safe-area-bottom">
      <div className="flex justify-around items-stretch h-16">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors active:scale-95"
            >
              {/* Indicateur actif */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-0 w-10 h-1 rounded-b bg-gradient-to-r from-violet-500 to-cyan-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icône avec pastille colorée si active */}
              <div className="relative">
                <Icon
                  size={20}
                  className={isActive ? 'text-violet-400' : 'text-slate-400'}
                />
                {badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>

              <span className={`mt-1 ${isActive ? 'text-violet-300 font-medium' : 'text-slate-500'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;