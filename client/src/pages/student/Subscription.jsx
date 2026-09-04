import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Send, CreditCard, AlertCircle, CheckCircle, Loader,
  Wallet, FileImage, X
} from 'lucide-react';
import api from '../../services/api';

const Subscription = () => {
  const [formData, setFormData] = useState({ amount: '', transaction_ref: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez joindre une capture d'écran du paiement.");
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 sm:px-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <CreditCard size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">
            Souscrire un abonnement
          </h1>
          <p className="text-slate-400 text-sm">Activez votre accès en envoyant votre preuve de paiement</p>
        </div>
      </motion.div>

      {/* Carte principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-6"
      >
        {/* Instructions */}
        <div className="flex items-start gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <Wallet size={20} className="text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-slate-300 text-sm leading-relaxed">
            Effectuez un paiement Mobile Money au numéro indiqué puis soumettez la preuve ci-dessous.
            <span className="block mt-1 text-cyan-300 font-medium">Numéro : +225 07 00 00 00 00</span>
          </p>
        </div>

        {/* Messages de feedback */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 p-3 rounded-lg"
            >
              <CheckCircle size={18} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
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
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="Réf. reçue après le paiement"
              required
            />
          </div>

          {/* Capture d'écran */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Capture d'écran du paiement</label>
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 bg-white/5 border border-dashed border-white/20 rounded-xl text-slate-400 hover:bg-white/10 hover:border-violet-400/50 transition-all"
              >
                <Upload size={28} />
                <span className="text-sm">Cliquez pour choisir une image</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/20 rounded-xl">
                <FileImage size={24} className="text-violet-400" />
                <span className="flex-1 text-sm text-white truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
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