import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, HelpCircle, Clock, Layers } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import QuizModal from '../../components/admin/QuizModal';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Difficile', color: 'bg-orange-100 text-orange-700' },
  very_hard: { label: 'Très difficile', color: 'bg-red-100 text-red-700' },
};

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce quiz ?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      fetchQuizzes();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleSave = () => {
    fetchQuizzes();
    setModalOpen(false);
    setEditingQuiz(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quiz</h1>
          <p className="text-slate-500 mt-1">Créez des quiz intelligents générés automatiquement</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Nouveau quiz
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <HelpCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun quiz pour le moment.</p>
            <Button variant="outline" onClick={() => setModalOpen(true)} className="mt-4">
              Créer votre premier quiz
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Groupe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Difficulté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Temps limite</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{quiz.title}</div>
                    <div className="text-sm text-slate-500 truncate max-w-xs">{quiz.description}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {groups.find(g => g.id === quiz.group_id)?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyLabels[quiz.difficulty_filter]?.color || 'bg-gray-100'}`}>
                      {difficultyLabels[quiz.difficulty_filter]?.label || 'Mixte'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Layers size={14} />
                      {quiz.question_count || 10} questions
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {Math.floor(quiz.time_limit / 60)} min {quiz.time_limit % 60}s
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setEditingQuiz(quiz); setModalOpen(true); }}
                      className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 mr-1"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="text-slate-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <QuizModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingQuiz(null); }}
        onSave={handleSave}
        quiz={editingQuiz}
        groups={groups}
      />
    </div>
  );
};

export default Quizzes;