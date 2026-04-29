import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, BookOpen, GraduationCap, Loader } from 'lucide-react';
import api from '../../services/api';
import GroupModal from '../../components/admin/GroupModal';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [error, setError] = useState('');

  // Charger les groupes
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des groupes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Ouvrir la modale pour création
  const handleCreate = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  // Ouvrir la modale pour édition
  const handleEdit = (group) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  // Supprimer un groupe
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  // Après création ou mise à jour
  const handleSave = () => {
    fetchGroups();
    setModalOpen(false);
    setEditingGroup(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white font-space-grotesk">Groupes</h1>
          <p className="text-slate-400 mt-1">Gérez les groupes par matière et niveau</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg"
        >
          <Plus size={18} />
          Nouveau groupe
        </button>
      </motion.div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Tableau des groupes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-violet-400" size={32} />
            <span className="ml-3 text-slate-400 text-lg">Chargement des groupes…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Aucun groupe pour le moment.</p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus size={16} /> Créer votre premier groupe
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Matière</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Niveau</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date de création</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                          <Users size={16} className="text-violet-400" />
                        </div>
                        <span className="font-medium text-white">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-slate-400" />
                        {group.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-slate-400" />
                        {group.level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(group.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-slate-400 hover:text-violet-400 p-2 rounded-lg hover:bg-white/10 transition-all mr-1"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modale de création/édition */}
      <GroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        group={editingGroup}
      />
    </div>
  );
};

export default Groups;