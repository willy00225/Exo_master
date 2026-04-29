import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Send, CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const [formData, setFormData] = useState({ amount: '', transaction_ref: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez joindre une capture d\'écran du paiement.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('transaction_ref', formData.transaction_ref);
      data.append('proof', file);

      await api.post('/payments/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Preuve de paiement envoyée. Votre accès sera activé après validation.');
      setFormData({ amount: '', transaction_ref: '' });
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Souscrire un abonnement</h1>
        <p className="text-slate-400 mt-1">Activez votre accès en envoyant votre preuve de paiement</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        {/* Message d'information */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <CreditCard size={20} className="text-cyan-400 mt-0.5" />
          <p className="text-slate-300 text-sm">
            Effectuez un paiement Mobile Money au numéro indiqué puis soumettez la preuve ci-dessous.
          </p>
        </div>

        {/* Messages de feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg mb-4">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 p-3 rounded-lg mb-4">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="Ex: 5000"
              required
            />
          </div>

          {/* Référence transaction */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Référence de la transaction</label>
            <input
              type="text"
              name="transaction_ref"
              value={formData.transaction_ref}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="Réf. reçue après le paiement"
              required
            />
          </div>

          {/* Capture d'écran */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Capture d'écran du paiement</label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-medium hover:file:bg-violet-700 transition-all"
                required
              />
              <Upload size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" /> Envoi...
              </>
            ) : (
              <>
                <Send size={18} /> Envoyer la preuve
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Subscription;