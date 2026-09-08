import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Swords, HelpCircle } from 'lucide-react';

const navItems = [
  { to: '/student', label: 'Accueil', icon: Home, end: true },
  { to: '/student/exercises', label: 'Exercices', icon: BookOpen },
  { to: '/student/quizzes', label: 'Quiz', icon: HelpCircle },
  { to: '/student/challenges', label: 'Défis', icon: Swords },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E1A]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.4)] lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-stretch h-16">
        {navItems.map(({ to, label, icon: Icon, end }) => {
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
              className="relative flex flex-col items-center justify-center flex-1 h-full text-xs transition-transform duration-150 active:scale-95 select-none [-webkit-tap-highlight-color:transparent]"
            >
              {/* Pastille active derrière l'icône */}
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute w-11 h-8 rounded-full bg-violet-500/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-violet-400' : 'text-slate-400'
                  }`}
                />
              </div>

              <motion.span
                animate={{ opacity: isActive ? 1 : 0.7 }}
                className={`mt-1 ${isActive ? 'text-violet-300 font-medium' : 'text-slate-500'}`}
              >
                {label}
              </motion.span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;