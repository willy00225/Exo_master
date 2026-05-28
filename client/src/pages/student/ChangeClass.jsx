import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import api from '../../services/api';

const ChangeClass = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/public/groups').then(res => setGroups(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) {
      setMessage({ type: 'error', text: 'Veuillez choisir une classe.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/student/change-class', { new_group_id: selectedGroup });
      setMessage({ type: 'success', text: 'Classe changée avec succès !' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors du changement.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/5 border border-white/10 rounded-2xl text-white">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1">
        <ArrowLeft size={18} /> Retour
      </button>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <GraduationCap size={24} className="text-violet-400" />
        Changer de classe
      </h1>
      {message.text && (
        <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label className="block text-sm mb-2">Nouvelle classe</label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white mb-4"
          required
        >
          <option value="">Sélectionnez</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Changement...' : 'Changer de classe'}
        </button>
      </form>
    </div>
  );
};

export default ChangeClass;