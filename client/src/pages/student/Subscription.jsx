import { useState } from 'react';
import { Upload, Send } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const [formData, setFormData] = useState({ amount: '', transaction_ref: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez joindre une capture d\'écran du paiement.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('transaction_ref', formData.transaction_ref);
      data.append('proof', file);

      await api.post('/payments/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Preuve de paiement envoyée. Votre accès sera activé après validation.');
      setFormData({ amount: '', transaction_ref: '' });
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Souscrire un abonnement</h1>
      <Card>
        <p className="text-slate-600 mb-4">Effectuez un paiement Mobile Money au numéro indiqué puis soumettez la preuve ci-dessous.</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Montant (FCFA)" name="amount" value={formData.amount} onChange={handleChange} required />
          <Input label="Référence de la transaction" name="transaction_ref" value={formData.transaction_ref} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capture d'écran du paiement</label>
            <input type="file" onChange={handleFileChange} accept="image/*" className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Send size={18} className="mr-2" />
            {loading ? 'Envoi...' : 'Envoyer la preuve'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Subscription;