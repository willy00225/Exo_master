import { useState, useEffect } from 'react';
import { Plus, Sparkles, Edit, Trash2, FileText, Download, Filter } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ExerciseUploadModal from '../../components/admin/ExerciseUploadModal';
import ExerciseGenerateModal from '../../components/admin/ExerciseGenerateModal';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Difficile', color: 'bg-orange-100 text-orange-700' },
  very_hard: { label: 'Très difficile', color: 'bg-red-100 text-red-700' },
};

const Exercises = () => {
  const [exercises, setExercises] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [filters, setFilters] = useState({ group_id: '', chapter_id: '', difficulty: '' });

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.group_id) params.append('group_id', filters.group_id);
      if (filters.chapter_id) params.append('chapter_id', filters.chapter_id);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      const res = await api.get(`/exercises?${params.toString()}`);
      setExercises(res.data);
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

  const fetchChapters = async (groupId) => {
    if (!groupId) {
      setChapters([]);
      return;
    }
    try {
      const res = await api.get(`/chapters?group_id=${groupId}`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchChapters(filters.group_id);
  }, [filters.group_id]);

  useEffect(() => {
    fetchExercises();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet exercice ?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      fetchExercises();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleDownload = async (exercise) => {
    const filename = exercise.file_path.split('/').pop();
    window.open(`${api.defaults.baseURL}/exercises/file/${filename}`, '_blank');
  };

  const handleSave = () => {
    fetchExercises();
    setUploadModalOpen(false);
    setGenerateModalOpen(false);
    setEditingExercise(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exercices</h1>
          <p className="text-slate-500 mt-1">Gérez les exercices et générez du contenu par IA</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setGenerateModalOpen(true)} variant="secondary" className="flex items-center gap-2">
            <Sparkles size={18} />
            Générer par IA
          </Button>
          <Button onClick={() => setUploadModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Nouvel exercice
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter size={18} className="text-slate-400" />
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filters.group_id}
            onChange={(e) => setFilters({ ...filters, group_id: e.target.value, chapter_id: '' })}
          >
            <option value="">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filters.chapter_id}
            onChange={(e) => setFilters({ ...filters, chapter_id: e.target.value })}
            disabled={!filters.group_id}
          >
            <option value="">Tous les chapitres</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">Toutes difficultés</option>
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
            <option value="very_hard">Très difficile</option>
          </select>
        </div>
      </Card>

      {/* Liste des exercices */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : exercises.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun exercice trouvé.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Groupe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Difficulté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fichier</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{ex.title}</div>
                    <div className="text-sm text-slate-500 truncate max-w-xs">{ex.description}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {groups.find(g => g.id === ex.group_id)?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyLabels[ex.difficulty]?.color}`}>
                      {difficultyLabels[ex.difficulty]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {ex.file_path ? (
                      <button onClick={() => handleDownload(ex)} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Download size={14} /> Télécharger
                      </button>
                    ) : (
                      <span className="text-slate-400">Aucun fichier</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setEditingExercise(ex); setUploadModalOpen(true); }}
                      className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 mr-1"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
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

      {/* Modales */}
      <ExerciseUploadModal
        isOpen={uploadModalOpen}
        onClose={() => { setUploadModalOpen(false); setEditingExercise(null); }}
        onSave={handleSave}
        exercise={editingExercise}
        groups={groups}
        chapters={chapters}
      />
      <ExerciseGenerateModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSave={handleSave}
        groups={groups}
      />
    </div>
  );
};

export default Exercises;