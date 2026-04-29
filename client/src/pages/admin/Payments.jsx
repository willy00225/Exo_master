import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Eye, Clock, Loader, X } from 'lucide-react';
import api from '../../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/pending');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleValidate = async (id) => {
    if (!window.confirm("Valider ce paiement ? L'abonnement sera activé pour 30 jours.")) return;
    try {
      await api.put(`/payments/${id}/validate`, { subscription_days: 30 });
      fetchPending();
    } catch (err) {
      alert('Erreur lors de la validation.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet (optionnel) :');
    try {
      await api.put(`/payments/${id}/reject`, { admin_notes: reason });
      fetchPending();
    } catch (err) {
      alert('Erreur lors du rejet.');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Paiements en attente</h1>
        <p className="text-slate-400 mt-1">Validez ou rejetez les demandes d'abonnement</p>
      </motion.div>

      {/* Tableau des paiements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement des paiements…</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <Clock size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun paiement en attente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Élève</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Preuve</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{payment.user_name}</p>
                        <p className="text-sm text-slate-400">{payment.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {payment.amount} FCFA
                    </td>
                    <td className="px-6 py-4 text-slate-300">{payment.transaction_ref || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedProof(payment.proof_image)}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                      >
                        <Eye size={16} />
                        Voir
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleValidate(payment.id)}
                        className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-emerald-500/10 mr-1 transition-all"
                        title="Valider"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={() => handleReject(payment.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                        title="Rejeter"
                      >
                        <XCircle size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modale d'aperçu de la preuve */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden max-w-2xl max-h-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>
              <img
                src={`http://localhost:5000${selectedProof}`}
                alt="Preuve de paiement"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;