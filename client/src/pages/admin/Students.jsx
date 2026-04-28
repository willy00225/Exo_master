import { useState, useEffect } from 'react';
import { Users, Calendar, CreditCard, Ban, PlusCircle, MinusCircle, Eye } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ group_id: '', subscription_status: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPayments, setShowPayments] = useState(false);
  const [extendDays, setExtendDays] = useState(30);

  useEffect(() => {
    api.get('/groups').then(res => setGroups(res.data)).catch(console.error);
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.group_id) params.append('group_id', filter.group_id);
      if (filter.subscription_status) params.append('subscription_status', filter.subscription_status);
      const res = await api.get(`/admin/students?${params.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filter]);

  const handleExtend = async (studentId) => {
    try {
      await api.put(`/admin/students/${studentId}/subscription`, { action: 'extend', days: extendDays });
      fetchStudents();
      alert(`Abonnement prolongé de ${extendDays} jours.`);
    } catch (err) {
      alert('Erreur lors de la prolongation.');
    }
  };

  const handleRevoke = async (studentId) => {
    if (!window.confirm('Révoquer l\'abonnement de cet élève ?')) return;
    try {
      await api.put(`/admin/students/${studentId}/subscription`, { action: 'revoke' });
      fetchStudents();
    } catch (err) {
      alert('Erreur.');
    }
  };

  const showPaymentHistory = async (student) => {
    try {
      const res = await api.get(`/admin/students/${student.id}/payments`);
      setPayments(res.data);
      setSelectedStudent(student);
      setShowPayments(true);
    } catch (err) {
      alert('Erreur lors du chargement des paiements.');
    }
  };

  const isActive = (expires) => expires && new Date(expires) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Élèves</h1>
          <p className="text-slate-500 mt-1">Gérez les élèves et leurs abonnements</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex items-center gap-4">
          <Users size={18} className="text-slate-400" />
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={filter.group_id} onChange={e => setFilter({...filter, group_id: e.target.value})}>
            <option value="">Tous les groupes</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={filter.subscription_status} onChange={e => setFilter({...filter, subscription_status: e.target.value})}>
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="expired">Expiré</option>
          </select>
        </div>
      </Card>

      {/* Liste des élèves */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun élève trouvé.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Groupes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Abonnement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {s.groups && s.groups[0] ? s.groups.map(g => (
                        <span key={g.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{g.name}</span>
                      )) : <span className="text-slate-400">Aucun</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive(s.subscription_expires) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isActive(s.subscription_expires) ? `Actif (${new Date(s.subscription_expires).toLocaleDateString()})` : 'Expiré'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExtend(s.id)}>Prolonger</Button>
                      <Button variant="danger" size="sm" onClick={() => handleRevoke(s.id)}>Révoquer</Button>
                      <button onClick={() => showPaymentHistory(s)} className="text-blue-600 hover:underline text-sm">Paiements</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modale rapide pour historique des paiements */}
      {showPayments && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowPayments(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
            <h2 className="text-xl font-bold mb-4">Paiements de {selectedStudent.name}</h2>
            {payments.length === 0 ? (
              <p className="text-slate-500">Aucun paiement.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr><th className="p-2">Date</th><th className="p-2">Montant</th><th className="p-2">Référence</th><th className="p-2">Statut</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{p.amount}</td>
                      <td className="p-2">{p.transaction_ref}</td>
                      <td className="p-2">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;