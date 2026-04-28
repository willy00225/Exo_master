import { useState, useEffect } from 'react';
import { Swords, Clock, Trophy, UserPlus } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const Challenges = () => {
  const [challenges, setChallenges] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/challenges/pending').then(res => setChallenges(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id) => {
    await api.put(`/challenges/${id}/accept`);
    api.get('/challenges/pending').then(res => setChallenges(res.data));
  };

  const handleDecline = async (id) => {
    await api.put(`/challenges/${id}/decline`);
    api.get('/challenges/pending').then(res => setChallenges(res.data));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Challenges</h1>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Défis reçus</h2>
        {challenges.received?.length === 0 ? <p className="text-slate-500">Aucun défi reçu.</p> : challenges.received.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2">
            <div><p className="font-medium">{c.challenger_name}</p><p className="text-sm">{c.quiz_title}</p></div>
            <div className="flex gap-2">
              <Button onClick={() => handleAccept(c.id)} size="sm">Accepter</Button>
              <Button variant="outline" onClick={() => handleDecline(c.id)} size="sm">Refuser</Button>
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Défis envoyés</h2>
        {challenges.sent?.length === 0 ? <p className="text-slate-500">Aucun défi envoyé.</p> : challenges.sent.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div><p className="font-medium">{c.challenged_name}</p><p className="text-sm">{c.quiz_title}</p></div>
            <span className="text-sm text-blue-600">En attente</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default Challenges;