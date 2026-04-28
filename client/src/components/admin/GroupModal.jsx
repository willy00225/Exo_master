import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const GroupModal = ({ isOpen, onClose, onSave, group }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    level: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        subject: group.subject,
        level: group.level
      });
    } else {
      setFormData({ name: '', subject: '', level: '' });
    }
  }, [group]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (group) {
        await api.put(`/groups/${group.id}`, formData);
      } else {
        await api.post('/groups', formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {group ? 'Modifier le groupe' : 'Nouveau groupe'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du groupe"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Maths 6ème"
            required
          />
          <Input
            label="Matière"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Mathématiques"
            required
          />
          <Input
            label="Niveau"
            name="level"
            value={formData.level}
            onChange={handleChange}
            placeholder="6e, 5e, 4e..."
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : group ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;