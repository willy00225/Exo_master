import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, ArrowLeft, UserPlus } from 'lucide-react';
import logo from '../../assets/exo_master_logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
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
          Connexion
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Mail size={16} className="inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <LogIn size={20} />
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Inscrivez-vous <UserPlus size={14} className="inline ml-1" />
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

export default Login;