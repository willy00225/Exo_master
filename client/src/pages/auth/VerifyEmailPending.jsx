import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import logo from '../../assets/exo_master_logo.png';

const VerifyEmailPending = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      await api.post('/auth/resend-verification', { email });
      setMessage('Un nouveau lien a été envoyé. Consultez votre boîte mail.');
      setMessageType('success');
    } catch (err) {
      setMessage('Erreur. Veuillez réessayer plus tard.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif statique (plus d'animate-pulse) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white max-w-md w-full shadow-2xl"
      >
        {/* Logo — statique */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EXO MASTER" className="h-12 w-auto mb-1" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </div>

        {/* Icône dans un cercle — statique (plus d'animate-ping) */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="w-24 h-24 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shadow-lg">
            <Mail size={48} className="text-violet-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3 font-space-grotesk">
          Vérifiez votre email
        </h1>

        <p className="text-slate-400 mb-6 leading-relaxed">
          Un email de vérification a été envoyé à{' '}
          <strong className="text-white break-all">{email || 'votre adresse'}</strong>.
          <br />
          Cliquez sur le lien qu'il contient pour activer votre compte.
        </p>

        {/* Message de feedback — rendu conditionnel simple */}
        {message && (
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-xl mb-4 text-sm border ${
              messageType === 'success'
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message}
          </div>
        )}

        {/* Bouton Renvoyer — statique */}
        <button
          type="button"
          onClick={resend}
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          aria-label="Renvoyer le lien de vérification"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" /> Envoi...
            </>
          ) : (
            <>
              <RefreshCw size={18} /> Renvoyer le lien
            </>
          )}
        </button>

        {/* Lien retour */}
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-violet-400 transition-colors"
            aria-label="Retour à la connexion"
          >
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPending;