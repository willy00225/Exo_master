import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/exo_master_logo.png';

const EmailVerified = () => (
  <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
    {/* Fond décoratif */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          DEVENEZ LE MEILLEUR
        </p>
      </div>

      {/* Icône de succès */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={36} className="text-emerald-400" />
      </div>

      <h1 className="text-2xl font-bold text-white font-space-grotesk mb-2">Email vérifié !</h1>
      <p className="text-slate-400 mb-8">Votre compte est maintenant actif. Vous pouvez vous connecter.</p>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
      >
        Se connecter
        <ArrowRight size={18} />
      </Link>
    </motion.div>
  </div>
);

export default EmailVerified;