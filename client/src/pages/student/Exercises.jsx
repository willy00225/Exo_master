import { useState, useEffect } from 'react';
import { Download, FileText, Filter } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const Exercises = () => {
  const [data, setData] = useState({ groups: [], exercises: [] });
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    api.get('/exercises/student/available')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterGroup
    ? data.exercises.filter(ex => ex.group_id == filterGroup)
    : data.exercises;

  const difficultyStyle = (d) => ({
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-orange-100 text-orange-700',
    very_hard: 'bg-red-100 text-red-700'
  }[d] || 'bg-gray-100');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exercices</h1>
      <Card>
        <div className="flex gap-4">
          <select className="border rounded px-3 py-2" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
            <option value="">Tous les groupes</option>
            {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </Card>

      {loading ? <p>Chargement...</p> : filtered.length === 0 ? <p>Aucun exercice.</p> : (
        <div className="grid gap-4">
          {filtered.map(ex => (
            <Card key={ex.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{ex.title}</h3>
                <p className="text-sm text-slate-500">{ex.group_name}</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyStyle(ex.difficulty)}`}>{ex.difficulty}</span>
              </div>
              <a href={`http://localhost:5000/api/exercises/file/${ex.file_path.split('/').pop()}`} target="_blank" className="text-blue-600 flex items-center gap-1"><Download size={16} /> Télécharger</a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exercises;