import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  UserPlus, Mail, Lock, User, ArrowLeft, GraduationCap,
  Building2, Eye, EyeOff, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';
import BottomSheetSelect from '../../components/common/BottomSheetSelect';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    group_id: '',
    school_code: '',
  });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/public/groups')
      .then((res) => setGroups(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await api.post('/auth/register', submitData);
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-start justify-center p-4 font-sans relative overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 my-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-4"
        >
          <img src={logo} alt="EXO MASTER" className="h-12 w-auto mb-1" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            DEVENEZ LE MEILLEUR
          </p>
        </motion.div>

        <h1 className="text-2xl font-bold text-white text-center mb-4 font-space-grotesk">
          Créer un compte
        </h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom complet */}
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
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="Votre nom"
              required
            />
          </div>

          {/* Email */}
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
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="exemple@email.com"
              required
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Lock size={16} className="inline mr-1" />
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-12"
                placeholder="6 caractères minimum"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Lock size={16} className="inline mr-1" />
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-12"
                placeholder="Confirmez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Sélection de classe avec BottomSheetSelect */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <GraduationCap size={16} className="inline mr-1" />
              Niveau / Classe
            </label>
            <BottomSheetSelect
              value={formData.group_id}
              onChange={(value) => setFormData({ ...formData, group_id: value })}
              placeholder="Sélectionnez votre classe"
              icon={GraduationCap}
              options={groups.map(g => ({
                value: g.id,
                label: g.subject ? `${g.name} (${g.subject})` : g.name,
              }))}
            />
          </div>

          {/* Code école */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Building2 size={16} className="inline mr-1" />
              Code école (optionnel)
            </label>
            <input
              type="text"
              name="school_code"
              value={formData.school_code}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              placeholder="Code fourni par votre établissement"
            />
          </div>

          {/* Bouton d'inscription */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" /> Inscription...
              </>
            ) : (
              <>
                <UserPlus size={20} /> Créer mon compte
              </>
            )}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Connectez-vous
          </Link>
        </p>

        <div className="mt-3 text-center">
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