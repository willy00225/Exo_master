import { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Card from '../common/Card';
import { Swords } from 'lucide-react';

const ChallengeForm = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Récupérer les quiz disponibles et les élèves du même groupe
    const fetchData = async () => {
      try {
        const [quizRes, userRes] = await Promise.all([
          api.get('/quizzes/available'),
          api.get('/student/classmates')   // À créer côté backend
        ]);
        setQuizzes(quizRes.data);
        setUsers(userRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/challenges', {
        challenged_id: selectedUser,
        quiz_id: selectedQuiz
      });
      setMessage('Défi envoyé avec succès !');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erreur lors de l\'envoi du défi');
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Swords size={20} /> Défier un camarade
      </h2>
      {message && <div className="mb-3 text-sm text-blue-700 bg-blue-50 p-2 rounded">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Quiz</label>
          <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}
                  className="w-full border rounded px-3 py-2" required>
            <option value="">Sélectionner un quiz</option>
            {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Adversaire</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                  className="w-full border rounded px-3 py-2" required>
            <option value="">Sélectionner un camarade</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <Button type="submit">Envoyer le défi</Button>
      </form>
    </Card>
  );
};

export default ChallengeForm;