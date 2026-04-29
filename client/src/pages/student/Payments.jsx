import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, Loader } from 'lucide-react';
import api from '../../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        setPayments(res.data);
      } catch (err) {
        console.error('Erreur chargement paiements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="ml-3 text-slate-400 text-lg">Chargement de l'historique…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Historique des paiements</h1>
        <p className="text-slate-400 mt-1">Retrouvez toutes vos transactions</p>
      </motion.div>

      {payments.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
          <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucun paiement pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Vos paiements apparaîtront ici une fois effectués.</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="p-4 text-slate-300 font-medium">Date</th>
                <th className="p-4 text-slate-300 font-medium">Montant</th>
                <th className="p-4 text-slate-300 font-medium">Méthode</th>
                <th className="p-4 text-slate-300 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-white font-medium">{p.amount} FCFA</td>
                  <td className="p-4 text-slate-400">{p.method}</td>
                  <td className="p-4">
                    {p.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle size={16} /> Payé
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock size={16} /> {p.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;