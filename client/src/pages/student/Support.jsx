import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Clock, Loader, X, Eye, AlertCircle, CheckCircle, HelpCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';

// Harmonisation des couleurs des statuts sur le thème violet/cyan
const statusLabels = {
  open: { label: 'Ouvert', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'text-violet-400 bg-violet-500/20 border-violet-500/30', icon: Clock },
  closed: { label: 'Fermé', color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30', icon: CheckCircle },
};

const StudentSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/my');
      setTickets(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger vos tickets. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTickets();
    } finally {
      setRefreshing(false);
    }
  };

  const openTicket = (ticket) => setSelectedTicket(ticket);
  const closeDetail = () => setSelectedTicket(null);

  // Fermeture de la modale avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDetail();
    };
    if (selectedTicket) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTicket]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="text-slate-400 text-lg">Chargement de vos tickets…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <p className="text-red-400 text-center max-w-md">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50"
        >
          {refreshing ? <Loader size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
            <MessageSquare size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">Mes tickets</h1>
            <p className="text-slate-400 text-sm">Suivez l'état de vos demandes de support</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
          aria-label="Actualiser la liste"
          title="Actualiser"
        >
          {refreshing ? <Loader size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </motion.div>

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-violet-400" />
          </div>
          <p className="text-slate-400 text-lg">Aucun ticket pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Vos demandes apparaîtront ici.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tickets.map((ticket, index) => {
              const status = statusLabels[ticket.status] || statusLabels.open;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => openTicket(ticket)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openTicket(ticket);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                      <StatusIcon size={20} className={status.color.split(' ')[0]} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                      <p className="text-sm text-slate-400 truncate mt-0.5">{ticket.message}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modale détail ticket */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ticket-detail-title"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="ticket-detail-title" className="text-xl font-bold text-white font-space-grotesk">
                  {selectedTicket.subject}
                </h2>
                <button
                  onClick={closeDetail}
                  className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors active:scale-90"
                  aria-label="Fermer la fenêtre"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Statut :</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[selectedTicket.status]?.color}`}>
                    {(() => {
                      const StatusIcon = statusLabels[selectedTicket.status]?.icon || AlertCircle;
                      return <StatusIcon size={14} />;
                    })()}
                    {statusLabels[selectedTicket.status]?.label}
                  </span>
                </div>

                {selectedTicket.admin_notes && (
                  <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                    <p className="text-sm text-violet-300 font-medium mb-1">Note de l'administration :</p>
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedTicket.admin_notes}</p>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Créé le {new Date(selectedTicket.created_at).toLocaleString()}
                  {selectedTicket.updated_at !== selectedTicket.created_at && (
                    <> · Mis à jour le {new Date(selectedTicket.updated_at).toLocaleString()}</>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentSupport;