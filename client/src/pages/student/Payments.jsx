import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle, Clock, Loader, AlertCircle,
  ArrowDown, ArrowUp, Wallet, CalendarDays, RefreshCw, XCircle
} from 'lucide-react';
import api from '../../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments/history');
      setPayments(res.data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement paiements', err);
      setError("Impossible de charger l'historique des paiements. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPayments();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="text-slate-400 text-lg">Chargement de l'historique…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <p className="text-red-400 text-center max-w-md">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50"
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white font-space-grotesk">Historique des paiements</h1>
            <p className="text-slate-400 mt-1">Retrouvez toutes vos transactions</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
            aria-label="Actualiser l'historique"
            title="Actualiser"
          >
            {refreshing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>
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
            {payments.map((p, index) => {
              const isCompleted = p.status === 'completed';
              const isPending = p.status === 'pending';
              const isFailed = p.status === 'failed' || p.status === 'cancelled';
              const statusColor = isCompleted
                ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
                : isPending
                ? 'text-amber-400 bg-amber-500/20 border-amber-500/30'
                : 'text-red-400 bg-red-500/20 border-red-500/30';
              const statusIcon = isCompleted ? (
                <CheckCircle size={14} />
              ) : isPending ? (
                <Clock size={14} />
              ) : (
                <XCircle size={14} />
              );

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/10 hover:border-violet-500/30 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? 'bg-cyan-500/20' : isPending ? 'bg-amber-500/20' : 'bg-red-500/20'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle size={24} className="text-cyan-400" />
                      ) : isPending ? (
                        <Clock size={24} className="text-amber-400" />
                      ) : (
                        <XCircle size={24} className="text-red-400" />
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
                    <span className="text-lg font-bold text-white tabular-nums">{p.amount} FCFA</span>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                      {statusIcon}
                      {isCompleted ? 'Payé' : isPending ? 'En attente' : p.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Payments;