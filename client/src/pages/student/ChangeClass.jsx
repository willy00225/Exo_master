import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import BottomSheetSelect from '../../components/common/BottomSheetSelect';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-10 p-6 bg-white/5 border border-white/10 rounded-2xl text-white backdrop-blur-lg"
    >
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-1 transition-colors">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <GraduationCap size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">Changer de classe</h1>
      </div>

      {message.text && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nouvelle classe</label>
          <BottomSheetSelect
            value={selectedGroup}
            onChange={setSelectedGroup}
            placeholder="Sélectionner une classe"
            icon={GraduationCap}
            options={groups.map(g => ({ value: g.id, label: g.name }))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" /> Changement...
            </>
          ) : (
            'Changer de classe'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default ChangeClass;