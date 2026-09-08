import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, GraduationCap, CheckCircle, AlertCircle, Loader, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import BottomSheetSelect from '../../components/common/BottomSheetSelect';

const ChangeClass = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const fetchGroups = async () => {
    setLoadingGroups(true);
    setGroupsError(null);
    try {
      const res = await api.get('/public/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      setGroupsError("Impossible de charger les classes. Veuillez réessayer.");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
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
      <button
        onClick={() => navigate(-1)}
        className="text-slate-400 hover:text-white mb-6 flex items-center gap-1 transition-colors active:scale-95"
        aria-label="Retour"
      >
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
          <GraduationCap size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold font-space-grotesk">Changer de classe</h1>
      </div>

      {/* Message d'erreur / succès */}
      {message.text && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="class-select">
            Nouvelle classe
          </label>

          {loadingGroups ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-400">
              <Loader size={18} className="animate-spin" />
              Chargement des classes…
            </div>
          ) : groupsError ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={18} />
                {groupsError}
              </div>
              <button
                type="button"
                onClick={fetchGroups}
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors self-start"
              >
                <RefreshCw size={14} /> Réessayer
              </button>
            </div>
          ) : (
            <BottomSheetSelect
              value={selectedGroup}
              onChange={setSelectedGroup}
              placeholder="Sélectionner une classe"
              icon={GraduationCap}
              options={groups.map(g => ({ value: g.id, label: g.name }))}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading || loadingGroups || !!groupsError}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg active:scale-95"
          aria-label="Changer de classe"
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