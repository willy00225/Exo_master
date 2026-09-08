import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Send, CreditCard, AlertCircle, CheckCircle, Loader,
  Wallet, FileImage, X, Phone, Copy
} from 'lucide-react';
import api from '../../services/api';

const Subscription = () => {
  const [formData, setFormData] = useState({ amount: '', transaction_ref: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(null);
  const fileInputRef = useRef(null);

  const paymentNumbers = [
    {
      operator: 'Orange Money',
      number: '+225 0777852157',
      gradient: 'from-orange-500 to-orange-700',
      initials: 'OM',
      bg: 'bg-orange-500',
    },
    {
      operator: 'Moov Money',
      number: '+225 0150912519',
      gradient: 'from-blue-500 to-blue-700',
      initials: 'MM',
      bg: 'bg-blue-500',
    },
    {
      operator: 'Wave',
      number: '+225 0150912519', // à ajuster si nécessaire
      gradient: 'from-cyan-500 to-cyan-700',
      initials: 'W',
      bg: 'bg-cyan-500',
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
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

      {/* Moyens de paiement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Phone size={20} className="text-violet-400" />
          Numéros de paiement
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Effectuez un paiement Mobile Money au numéro correspondant à votre opérateur.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentNumbers.map((item) => (
            <div
              key={item.operator}
              className={`bg-gradient-to-br ${item.gradient} p-4 rounded-2xl flex items-center gap-3 shadow-lg`}
            >
              {/* Logo de l'opérateur */}
              <div className={`w-12 h-12 rounded-full ${item.bg} bg-opacity-20 flex items-center justify-center text-white font-bold text-lg border border-white/30`}>
                {item.initials}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{item.operator}</p>
                <p className="text-white/90 font-mono">{item.number}</p>
              </div>
              <button
                onClick={() => handleCopyNumber(item.number)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Copier le numéro"
              >
                {copiedNumber === item.number ? (
                  <CheckCircle size={18} className="text-white" />
                ) : (
                  <Copy size={18} className="text-white" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          💡 Copiez le numéro puis effectuez le paiement via votre application Mobile Money.
        </p>
      </motion.div>

      {/* Carte principale formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-6"
      >
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