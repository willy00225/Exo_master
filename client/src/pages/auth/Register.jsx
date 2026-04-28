import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserPlus, Mail, Lock, User, ArrowLeft, GraduationCap } from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    group_id: '',
  });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Charger les groupes disponibles
  useEffect(() => {
    api
      .get('/public/groups')
      .then((res) => setGroups(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-x-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EXO MASTER" className="h-14 w-auto mb-2" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-6 font-space-grotesk">
          Inscription
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <User size={16} className="inline mr-1" />
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Mail size={16} className="inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="exemple@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Lock size={16} className="inline mr-1" />
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="6 caractères minimum"
              minLength={6}
              required
            />
          </div>

          {/* Sélecteur de groupe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <GraduationCap size={16} className="inline mr-1" />
              Niveau / Classe
            </label>
            <select
              name="group_id"
              value={formData.group_id}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all appearance-none"
              required
            >
              <option value="" disabled className="bg-slate-800 text-slate-400">
                Sélectionnez votre classe
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-800 text-white">
                  {g.name} {g.subject ? `(${g.subject})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <UserPlus size={20} />
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Connectez-vous
          </Link>
        </p>

        {/* Retour à l'accueil */}
        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;