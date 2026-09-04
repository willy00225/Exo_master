import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Swords, Loader, ArrowRight, AlertCircle, CheckCircle, Sparkles
} from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

const InviteLanding = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/invitations/${token}`)
      .then(res => {
        if (active) setInvite(res.data);
      })
      .catch(() => {
        if (active) setInvite(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post(`/invitations/${token}/accept`);
      navigate('/student/challenges', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'acceptation");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Loader className="animate-spin text-violet-400" size={48} />
        </motion.div>
        <p className="text-slate-400 text-lg">Chargement de l'invitation…</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-lg border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260 }}
          >
            <AlertCircle size={64} className="text-red-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white font-space-grotesk mb-2">Lien invalide</h1>
          <p className="text-slate-400 mb-6">Cette invitation a expiré ou n'est plus valide.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            Retour à l'accueil
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Décor */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-6"
        >
          <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </motion.div>

        {/* Icône défi */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4"
        >
          <Swords size={32} className="text-amber-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white font-space-grotesk mb-2"
        >
          Tu as été défié !
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-6"
        >
          <span className="text-white font-semibold">{invite.challenger_name}</span> te défie sur le quiz<br />
          <span className="text-cyan-400 font-medium">« {invite.quiz_title} »</span>
        </motion.p>

        {/* Affichage selon connexion */}
        {user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg"
            >
              {accepting ? (
                <>
                  <Loader size={20} className="animate-spin" /> Acceptation...
                </>
              ) : (
                <>
                  <Swords size={20} /> Relever le défi <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Link
              to={`/login?redirect=/invite/${token}`}
              className="block w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
            >
              Se connecter
            </Link>
            <Link
              to={`/register?redirect=/invite/${token}`}
              className="block w-full border border-violet-400 text-violet-400 px-6 py-3 rounded-xl font-semibold hover:bg-violet-400/10 transition-all"
            >
              S'inscrire
            </Link>
          </motion.div>
        )}

        {/* Message d'aide */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-1"
        >
          <Sparkles size={14} /> Bonne chance !
        </motion.p>
      </motion.div>
    </div>
  );
};

export default InviteLanding;