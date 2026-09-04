import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Clock, Loader, X, Eye, AlertCircle, CheckCircle, HelpCircle
} from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  open: { label: 'Ouvert', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: Clock },
  closed: { label: 'Fermé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
};

const StudentSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    api.get('/support/my')
      .then(res => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openTicket = (ticket) => setSelectedTicket(ticket);
  const closeDetail = () => setSelectedTicket(null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <MessageSquare size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">Mes tickets</h1>
          <p className="text-slate-400 text-sm">Suivez l'état de vos demandes de support</p>
        </div>
      </motion.div>

      {/* Liste des tickets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
        </div>
      ) : tickets.length === 0 ? (
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
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => openTicket(ticket)}
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
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white font-space-grotesk">{selectedTicket.subject}</h2>
                <button
                  onClick={closeDetail}
                  className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors"
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
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-sm text-blue-300 font-medium mb-1">Note de l'administration :</p>
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