import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Swords, Loader, ArrowRight, AlertCircle } from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';

const InviteLanding = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    api.get(`/invitations/${token}`)
      .then(res => setInvite(res.data))
      .catch(() => setInvite(null))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.post(`/invitations/${token}/accept`);
      navigate('/student/challenges');
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'acceptation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <Loader className="animate-spin text-violet-400" size={48} />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white font-space-grotesk mb-2">Lien invalide</h1>
          <p className="text-slate-400">Cette invitation a expiré ou n'est plus valide.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </div>

        {/* Icône de défi */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Swords size={32} className="text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-white font-space-grotesk mb-2">Tu as été défié !</h1>
        <p className="text-slate-400 mb-6">
          <span className="text-white font-semibold">{invite.challenger_name}</span> te défie sur le quiz<br />
          <span className="text-cyan-400 font-medium">« {invite.quiz_title} »</span>
        </p>

        {user ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-lg"
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
        ) : (
          <div className="space-y-3">
            <a
              href={`/login?redirect=/invite/${token}`}
              className="block w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Se connecter
            </a>
            <a
              href={`/register?redirect=/invite/${token}`}
              className="block w-full border border-violet-400 text-violet-400 px-6 py-3 rounded-lg font-semibold hover:bg-violet-400/10 transition-all"
            >
              S'inscrire
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InviteLanding;