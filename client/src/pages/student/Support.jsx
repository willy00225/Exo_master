import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Loader, X, Eye } from 'lucide-react';
import api from '../../services/api';

const statusLabels = {
  open: { label: 'Ouvert', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  in_progress: { label: 'En cours', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  closed: { label: 'Fermé', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Mes tickets</h1>
        <p className="text-slate-400 mt-1">Suivez l'état de vos demandes de support</p>
      </motion.div>

      {/* Liste des tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun ticket pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer" onClick={() => openTicket(ticket)}>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{ticket.subject}</h3>
                  <p className="text-sm text-slate-400 truncate mt-1">{ticket.message}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[ticket.status]?.color}`}>
                  {statusLabels[ticket.status]?.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

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
                <button onClick={closeDetail} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Statut :</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusLabels[selectedTicket.status]?.color}`}>
                    {statusLabels[selectedTicket.status]?.label}
                  </span>
                </div>

                {selectedTicket.admin_notes && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300 font-medium">Note de l'administration :</p>
                    <p className="text-white mt-1 whitespace-pre-wrap">{selectedTicket.admin_notes}</p>
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