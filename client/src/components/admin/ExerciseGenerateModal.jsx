import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const ExerciseGenerateModal = ({ isOpen, onClose, onSave, groups }) => {
  const [formData, setFormData] = useState({ group_id: '', chapter_id: '', difficulty: 'medium', theme: '' });
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await api.post('/ai/generate-exercise', formData);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération IA.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-violet-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Générer un exercice par IA</h2>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="">Aucun</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
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
          <Input label="Thème (optionnel)" name="theme" value={formData.theme} onChange={handleChange} placeholder="Ex: Théorème de Pythagore" />
          <div className="bg-violet-50 p-3 rounded-lg text-sm text-violet-700">
            L'IA va générer un énoncé complet et un corrigé détaillé.
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} variant="secondary">
              {loading ? 'Génération...' : 'Générer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseGenerateModal;