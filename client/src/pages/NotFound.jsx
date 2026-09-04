import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Frown, Sparkles, Compass } from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

const NotFound = () => (
  <div className="min-h-screen bg-[#0B0E1A] flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
    {/* Fond décoratif */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center max-w-md"
    >
      <motion.img
        initial={{ scale: 0.8, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
        src={logo}
        alt="EXO MASTER"
        className="h-16 w-auto mx-auto mb-6"
      />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative w-24 h-24 mx-auto mb-6"
      >
        <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Frown size={48} className="text-white" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 text-2xl"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Sparkles size={24} className="text-amber-400" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-6xl font-bold text-white font-space-grotesk mb-2"
      >
        404
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-slate-300 mb-2"
      >
        Oups, cette page s’est égarée !
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 mb-8 leading-relaxed"
      >
        Pas de panique, même les plus grands explorateurs se perdent parfois. Retournez sur le bon chemin et continuez votre progression.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-violet-500/20"
        >
          <Home size={18} />
          Accueil
        </Link>
        <Link
          to="/student/exercises"
          className="inline-flex items-center justify-center gap-2 border border-white/20 text-slate-300 px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-all"
        >
          <Compass size={18} />
          Reprendre l’aventure
        </Link>
      </motion.div>
    </motion.div>
  </div>
);

export default NotFound;