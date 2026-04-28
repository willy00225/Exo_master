import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement des groupes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Groupes</h1>
          <p className="text-slate-500 mt-1">Gérez les groupes par matière et niveau</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={18} />
          Nouveau groupe
        </Button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Tableau des groupes */}
      <Card className="overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun groupe pour le moment.</p>
            <Button variant="outline" onClick={handleCreate} className="mt-4">
              Créer votre premier groupe
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Matière
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-slate-800">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-400" />
                      {group.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-slate-400" />
                      {group.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(group.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors mr-1"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-slate-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Supprimer"
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