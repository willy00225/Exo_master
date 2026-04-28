import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const ExerciseUploadModal = ({ isOpen, onClose, onSave, exercise, groups, chapters }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', difficulty: 'easy', group_id: '', chapter_id: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredChapters, setFilteredChapters] = useState([]);

  useEffect(() => {
    if (exercise) {
      setFormData({
        title: exercise.title,
        description: exercise.description || '',
        difficulty: exercise.difficulty,
        group_id: exercise.group_id,
        chapter_id: exercise.chapter_id || ''
      });
    } else {
      setFormData({ title: '', description: '', difficulty: 'easy', group_id: '', chapter_id: '' });
      setFile(null);
    }
  }, [exercise]);

  useEffect(() => {
    if (formData.group_id) {
      setFilteredChapters(chapters.filter(c => c.group_id == formData.group_id));
    } else {
      setFilteredChapters([]);
    }
  }, [formData.group_id, chapters]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exercise && !file) {
      setError('Veuillez sélectionner un fichier.');
      return;
    }
    setLoading(true);
    setError('');
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('difficulty', formData.difficulty);
    data.append('group_id', formData.group_id);
    if (formData.chapter_id) data.append('chapter_id', formData.chapter_id);
    if (file) data.append('file', file);

    try {
      if (exercise) {
        await api.put(`/exercises/${exercise.id}`, data);
      } else {
        await api.post('/exercises', data);
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
          {exercise ? 'Modifier l\'exercice' : 'Nouvel exercice'}
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
              <option value="">Aucun chapitre</option>
              {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Difficulté</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
              <option value="very_hard">Très difficile</option>
            </select>
          </div>
          {!exercise && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fichier (PDF, image)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="text-sm" required />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseUploadModal;