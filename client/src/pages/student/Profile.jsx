import { useState, useEffect } from 'react';
import { Calendar, CreditCard } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments/status').then(res => setSubscription(res.data));
    api.get('/payments/my').then(res => setPayments(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mon profil</h1>
      <Card>
        <p className="font-semibold">{user?.name}</p>
        <p className="text-slate-500">{user?.email}</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold mb-2">Abonnement</h2>
        <p>{subscription?.is_active ? `Actif (${subscription.days_remaining} jours restants)` : 'Expiré'}</p>
        <p className="text-sm text-slate-400">Expire le {new Date(subscription?.expires_at).toLocaleDateString()}</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Historique des paiements</h2>
        <ul className="space-y-2">
          {payments.map(p => (
            <li key={p.id} className="flex justify-between text-sm">
              <span>{new Date(p.created_at).toLocaleDateString()} - {p.transaction_ref}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default Profile;