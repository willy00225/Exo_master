import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import {
  Lock, ArrowLeft, CheckCircle, AlertCircle, Loader, Eye, EyeOff,
  ShieldCheck, ShieldAlert, ShieldX
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';

// Évaluation de la force du mot de passe
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: 'Faible', color: 'text-red-400', barColor: 'bg-red-500', icon: ShieldX, width: 33 };
  if (score <= 4) return { label: 'Moyen', color: 'text-violet-400', barColor: 'bg-violet-500', icon: ShieldAlert, width: 66 };
  return { label: 'Fort', color: 'text-cyan-400', barColor: 'bg-cyan-500', icon: ShieldCheck, width: 100 };
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(newPassword);
  const StrengthIcon = passwordStrength.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setMessage({ type: 'success', text: res.data.message || 'Mot de passe modifié avec succès.' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la réinitialisation.' });
    } finally {
      setLoading(false);
    }
  };

  // Écran token manquant
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center max-w-md"
        >
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Lien invalide</h1>
          <p className="text-slate-400 mt-2">Le lien de réinitialisation est manquant ou invalide.</p>
          <Link to="/forgot-password" className="inline-block mt-4 text-violet-400 hover:text-violet-300 transition-colors">
            Demander un nouveau lien
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif statique (plus d'animate-pulse) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8"
      >
        {/* Logo — statique */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-6 font-space-grotesk">
          Nouveau mot de passe
        </h1>

        {/* Message — rendu conditionnel simple */}
        {message.text && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 border ${
            message.type === 'success'
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Lock size={16} className="inline mr-1" />
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-10"
                placeholder="••••••••"
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Barre de force — animation CSS au lieu de Framer Motion */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <StrengthIcon size={14} className={passwordStrength.color} />
                  <span className={passwordStrength.color}>{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.barColor} rounded-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${passwordStrength.width}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Lock size={16} className="inline mr-1" />
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-10"
                placeholder="••••••••"
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98]"
            aria-label="Enregistrer le mot de passe"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" /> Modification...
              </>
            ) : (
              'Enregistrer le mot de passe'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;