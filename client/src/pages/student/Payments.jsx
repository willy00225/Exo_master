import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle, Clock, Loader, AlertCircle,
  ArrowDown, ArrowUp, Wallet, CalendarDays
} from 'lucide-react';
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Historique des paiements</h1>
        <p className="text-slate-400 mt-1">Retrouvez toutes vos transactions</p>
      </motion.div>

      {payments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
            <CreditCard size={32} className="text-violet-400" />
          </div>
          <p className="text-slate-400 text-lg">Aucun paiement pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Vos paiements apparaîtront ici une fois effectués.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {payments.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    p.status === 'completed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                  }`}>
                    {p.status === 'completed' ? (
                      <CheckCircle size={24} className="text-emerald-400" />
                    ) : (
                      <Clock size={24} className="text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium flex items-center gap-1">
                      <CalendarDays size={14} className="text-slate-400" />
                      {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Wallet size={14} className="text-slate-400" />
                      {p.method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-lg font-bold text-white">{p.amount} FCFA</span>
                  {p.status === 'completed' ? (
                    <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                      <CheckCircle size={14} /> Payé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
                      <Clock size={14} /> {p.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Payments;