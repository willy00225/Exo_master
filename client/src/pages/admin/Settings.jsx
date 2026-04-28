import { useState, useEffect } from 'react';
import { Save, Key, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Settings = () => {
  const [settings, setSettings] = useState({
    openai_api_key: '',
    whatsapp_number: '',
    subscription_days: '30'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>
        <p className="text-slate-500 mt-1">Configurez votre plateforme</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Intelligence Artificielle */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Key size={20} className="text-violet-600" />
            Intelligence Artificielle
          </h2>
          <Input
            label="Clé API OpenAI"
            name="openai_api_key"
            type="password"
            value={settings.openai_api_key}
            onChange={handleChange}
            placeholder="sk-..."
          />
          <p className="text-sm text-slate-500 mt-1">
            Nécessaire pour la génération automatique d'exercices et de questions.
          </p>
        </Card>

        {/* Section Support */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MessageCircle size={20} className="text-green-600" />
            Support client
          </h2>
          <Input
            label="Numéro WhatsApp"
            name="whatsapp_number"
            value={settings.whatsapp_number}
            onChange={handleChange}
            placeholder="+225XXXXXXXXX"
          />
          <p className="text-sm text-slate-500 mt-1">
            Sera affiché dans le bouton WhatsApp pour les élèves.
          </p>
        </Card>

        {/* Section Abonnement */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-amber-600" />
            Abonnement
          </h2>
          <Input
            label="Durée de l'abonnement (jours)"
            name="subscription_days"
            type="number"
            value={settings.subscription_days}
            onChange={handleChange}
          />
        </Card>

        {/* Bouton enregistrer */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save size={18} />
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;