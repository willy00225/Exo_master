import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Frown } from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

const NotFound = () => (
  <div className="min-h-screen bg-[#0B0E1A] flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
    {/* Fond décoratif */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center"
    >
      <img src={logo} alt="EXO MASTER" className="h-14 w-auto mx-auto mb-6" />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6"
      >
        <Frown size={40} className="text-violet-400" />
      </motion.div>

      <h1 className="text-6xl font-bold text-white font-space-grotesk mb-2">404</h1>
      <p className="text-xl text-slate-400 mb-8">Page introuvable</p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
      >
        <Home size={18} />
        Retour à l'accueil
      </Link>
    </motion.div>
  </div>
);

export default NotFound;