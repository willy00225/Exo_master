import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const QuizModal = ({ isOpen, onClose, onSave, quiz, groups }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', group_id: '', chapter_id: '', difficulty_filter: '', question_count: 10
  });
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title,
        description: quiz.description || '',
        group_id: quiz.group_id,
        chapter_id: quiz.chapter_id || '',
        difficulty_filter: quiz.difficulty_filter || '',
        question_count: quiz.question_count || 10
      });
    } else {
      setFormData({ title: '', description: '', group_id: '', chapter_id: '', difficulty_filter: '', question_count: 10 });
    }
  }, [quiz]);

  useEffect(() => {
    if (formData.group_id) {
      api.get(`/chapters?group_id=${formData.group_id}`).then(res => setChapters(res.data)).catch(console.error);
    } else {
      setChapters([]);
    }
  }, [formData.group_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (quiz) {
        await api.put(`/quizzes/${quiz.id}`, formData);
      } else {
        await api.post('/quizzes', formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {quiz ? 'Modifier le quiz' : 'Nouveau quiz'}
        </h2>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Titre" name="title" value={formData.title} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Groupe</label>
            <select name="group_id" value={formData.group_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2" required>
              <option value="">Sélectionner un groupe</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chapitre (optionnel)</label>
            <select name="chapter_id" value={formData.chapter_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2" disabled={!formData.group_id}>
              <option value="">Tous les chapitres</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Difficulté cible</label>
            <select name="difficulty_filter" value={formData.difficulty_filter} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="">Mixte</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
              <option value="very_hard">Très difficile</option>
            </select>
          </div>
          <Input
            label="Nombre de questions"
            name="question_count"
            type="number"
            min="1"
            max="50"
            value={formData.question_count}
            onChange={handleChange}
            required
          />
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            Les questions seront tirées aléatoirement de la banque selon ces critères.
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizModal;