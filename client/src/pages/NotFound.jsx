import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Frown, Sparkles, Compass, ArrowLeft } from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      {/* Fond décoratif amélioré avec dégradés */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
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
          className="relative w-28 h-28 mx-auto mb-6"
        >
          <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Frown size={56} className="text-white" />
          </div>
          <motion.div
            className="absolute -top-3 -right-3"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Sparkles size={28} className="text-cyan-400" />
          </motion.div>
        </motion.div>

        {/* Grand 404 avec dégradé */}
        <motion.h1
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-8xl md:text-9xl font-extrabold mb-2 font-space-grotesk bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent drop-shadow-lg"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl text-white font-semibold mb-2"
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
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-violet-500/20 active:scale-95"
            aria-label="Retour à l'accueil"
          >
            <Home size={18} />
            Accueil
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-slate-300 px-6 py-3 rounded-full font-semibold hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label="Retour à la page précédente"
          >
            <ArrowLeft size={18} />
            Page précédente
          </button>
          <Link
            to="/student/exercises"
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-slate-300 px-6 py-3 rounded-full font-semibold hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label="Reprendre l'aventure"
          >
            <Compass size={18} />
            Reprendre l’aventure
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-xs text-slate-600"
        >
          Si vous pensez qu'il s'agit d'une erreur, contactez le support.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;