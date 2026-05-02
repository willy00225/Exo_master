import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Key, MessageCircle, Clock, AlertCircle, CheckCircle, Loader,
  Building2, Quote,
} from 'lucide-react';
import api from '../../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    app_name: '',
    slogan: '',
    openai_api_key: '',
    whatsapp_number: '',
    subscription_days: '30',
    trial_days: '7',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        // L'API renvoie un tableau de {key, value} ou un objet ? On s'adapte.
        let settingsObj = {};
        if (Array.isArray(res.data)) {
          res.data.forEach((s) => {
            settingsObj[s.key] = s.value;
          });
        } else if (typeof res.data === 'object') {
          settingsObj = res.data;
        }
        setSettings((prev) => ({ ...prev, ...settingsObj }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Erreur lors de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="ml-3 text-slate-400 text-lg">Chargement des paramètres…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Paramètres</h1>
        <p className="text-slate-400 mt-1">Configurez votre plateforme EXO MASTER</p>
      </motion.div>

      {/* Message de feedback */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Identité de la plateforme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <Building2 size={20} className="text-violet-400" />
            Identité de la plateforme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nom de l'application</label>
              <input
                type="text"
                name="app_name"
                value={settings.app_name}
                onChange={handleChange}
                placeholder="EXO MASTER"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Slogan</label>
              <input
                type="text"
                name="slogan"
                value={settings.slogan}
                onChange={handleChange}
                placeholder="DEVENEZ LE MEILLEUR"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Ces informations apparaîtront dans l’en-tête et le pied de page.
          </p>
        </motion.div>

        {/* Section Intelligence Artificielle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <Key size={20} className="text-violet-400" />
            Intelligence Artificielle
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Clé API OpenAI</label>
            <input
              type="password"
              name="openai_api_key"
              value={settings.openai_api_key}
              onChange={handleChange}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            <p className="text-sm text-slate-500 mt-2">
              Nécessaire pour la génération automatique d'exercices et de questions.
            </p>
          </div>
        </motion.div>

        {/* Section Support client */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <MessageCircle size={20} className="text-cyan-400" />
            Support client
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Numéro WhatsApp</label>
            <input
              type="text"
              name="whatsapp_number"
              value={settings.whatsapp_number}
              onChange={handleChange}
              placeholder="+225XXXXXXXXX"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            <p className="text-sm text-slate-500 mt-2">
              Sera affiché dans le bouton WhatsApp pour les élèves.
            </p>
          </div>
        </motion.div>

        {/* Section Abonnement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-space-grotesk">
            <Clock size={20} className="text-amber-400" />
            Abonnement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Durée de l'abonnement (jours)</label>
              <input
                type="number"
                name="subscription_days"
                value={settings.subscription_days}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Durée de l'essai (jours)</label>
              <input
                type="number"
                name="trial_days"
                value={settings.trial_days}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                min="1"
              />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            L'essai gratuit est accordé automatiquement à l'inscription. L'abonnement standard est utilisé pour les renouvellements.
          </p>
        </motion.div>

        {/* Bouton enregistrer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {saving ? (
              <>
                <Loader size={18} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} /> Enregistrer les paramètres
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default Settings;