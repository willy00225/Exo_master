import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

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
    if (!window.confirm('Valider ce paiement ? L\'abonnement sera activé pour 30 jours.')) return;
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des paiements...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Paiements en attente</h1>
        <p className="text-slate-500 mt-1">Validez ou rejetez les demandes d'abonnement</p>
      </div>

      <Card className="overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun paiement en attente.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Preuve</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{payment.user_name}</p>
                      <p className="text-sm text-slate-500">{payment.user_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {payment.amount} FCFA
                  </td>
                  <td className="px-6 py-4 text-slate-600">{payment.transaction_ref || '-'}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProof(payment.proof_image)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye size={16} />
                      Voir
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleValidate(payment.id)}
                      className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 mr-1"
                      title="Valider"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      title="Rejeter"
                    >
                      <XCircle size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modale d'aperçu de la preuve */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedProof(null)}
        >
          <div className="bg-white rounded-lg overflow-hidden max-w-2xl max-h-full">
            <img
              src={`http://localhost:5000${selectedProof}`}
              alt="Preuve de paiement"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;