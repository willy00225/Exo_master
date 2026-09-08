import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Save, AlertCircle, CheckCircle, Loader, Eye, EyeOff,
  ShieldCheck, ShieldAlert, ShieldX, Info
} from 'lucide-react';
import api from '../../services/api';

// Fonction pour évaluer la force du mot de passe (couleurs harmonisées violet/cyan)
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

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword);
  const StrengthIcon = passwordStrength.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', { oldPassword, newPassword });
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Composant d'input avec bouton œil
  const PasswordInput = ({ value, onChange, placeholder, show, setShow, label, id }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-12"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors active:scale-90"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 max-w-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <Lock size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white font-space-grotesk">Mot de passe</h2>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordInput
          id="old-password"
          label="Ancien mot de passe"
          value={oldPassword}
          onChange={setOldPassword}
          placeholder="••••••••"
          show={showOldPassword}
          setShow={setShowOldPassword}
        />

        <div>
          <PasswordInput
            id="new-password"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="••••••••"
            show={showNewPassword}
            setShow={setShowNewPassword}
          />
          {newPassword && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2 text-xs">
                <StrengthIcon size={14} className={passwordStrength.color} />
                <span className={passwordStrength.color}>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength.width}%` }}
                  className={`h-full ${passwordStrength.barColor} rounded-full`}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>

        <PasswordInput
          id="confirm-password"
          label="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          show={showConfirmPassword}
          setShow={setShowConfirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg active:scale-95"
          aria-label="Mettre à jour le mot de passe"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" /> Mise à jour...
            </>
          ) : (
            <>
              <Save size={18} /> Mettre à jour le mot de passe
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default ChangePassword;