import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Save, CreditCard, Calendar, Loader, AlertCircle, CheckCircle,
  Eye, EyeOff, ShieldCheck, Wallet, Clock, BadgeCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // ---------- Infos personnelles ----------
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // ---------- Mot de passe ----------
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Visibilité des mots de passe
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---------- Abonnement / Paiements ----------
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, payRes] = await Promise.all([
          api.get('/payments/status'),
          api.get('/payments/my'),
        ]);
        setSubscription(subRes.data);
        setPayments(payRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await api.put('/auth/profile', formData);
      window.location.reload();
      setProfileMsg({ type: 'success', text: 'Profil mis à jour.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la mise à jour.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordMsg({ type: 'success', text: 'Mot de passe modifié.' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const isActive = subscription?.is_active;
  const daysRemaining = subscription?.days_remaining || 0;

  // Composant champ mot de passe avec œil
  const PasswordInput = ({ label, value, onChange, show, setShow }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête avec avatar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          {user?.name?.charAt(0) || 'E'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk">{user?.name}</h1>
          <p className="text-slate-400 flex items-center gap-1">
            <Mail size={14} /> {user?.email}
          </p>
        </div>
      </motion.div>

      {/* ---------- Informations personnelles ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User size={20} className="text-violet-400" />
            Informations personnelles
          </h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            {editMode ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <AnimatePresence>
          {profileMsg.text && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {profileMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {editMode ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nom complet</label>
              <input
                type="text" name="name" value={formData.name} onChange={handleProfileChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleProfileChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                required
              />
            </div>
            <button
              type="submit" disabled={savingProfile}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-2 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {savingProfile ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
              {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-white"><span className="text-slate-400">Nom :</span> {user?.name}</p>
            <p className="text-white"><span className="text-slate-400">Email :</span> {user?.email}</p>
          </div>
        )}
      </motion.div>

      {/* ---------- Sécurité ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={20} className="text-cyan-400" />
          Sécurité
        </h2>

        <AnimatePresence>
          {passwordMsg.text && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {passwordMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {passwordMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <PasswordInput
            label="Mot de passe actuel"
            value={passwordData.current_password}
            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
            show={showCurrent}
            setShow={setShowCurrent}
          />
          <PasswordInput
            label="Nouveau mot de passe"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
            show={showNew}
            setShow={setShowNew}
          />
          <PasswordInput
            label="Confirmer le nouveau mot de passe"
            value={passwordData.confirm_password}
            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
            show={showConfirm}
            setShow={setShowConfirm}
          />
          <button
            type="submit" disabled={savingPassword}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-2 px-6 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {savingPassword ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </motion.div>

      {/* ---------- Abonnement ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BadgeCheck size={20} className="text-emerald-400" />
          Mon abonnement
        </h2>
        {loadingInfo ? (
          <p className="text-slate-400">Chargement...</p>
        ) : (
          <div className={`flex items-center gap-4 p-4 rounded-xl ${
            isActive ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <Calendar size={24} className={isActive ? 'text-emerald-400' : 'text-red-400'} />
            </div>
            <div>
              <p className="text-white font-medium">{isActive ? 'Abonnement actif' : 'Abonnement expiré'}</p>
              <p className="text-sm text-slate-400">
                {isActive
                  ? `Expire le ${new Date(subscription.expires_at).toLocaleDateString()} (${daysRemaining} jour(s) restants)`
                  : 'Aucun abonnement en cours'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ---------- Historique des paiements ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet size={20} className="text-amber-400" />
          Historique des paiements
        </h2>
        {loadingInfo ? (
          <p className="text-slate-400">Chargement...</p>
        ) : payments.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-slate-300 font-medium">Date</th>
                  <th className="p-3 text-slate-300 font-medium">Référence</th>
                  <th className="p-3 text-slate-300 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-300">{p.transaction_ref}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'validated'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;