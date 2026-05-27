import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  if (success === 'true') {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white max-w-md">
          <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email vérifié !</h1>
          <p className="text-slate-400 mb-4">Votre compte est maintenant actif.</p>
          <Link to="/login" className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2 rounded-lg">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white max-w-md">
          <Clock size={64} className="mx-auto text-amber-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lien expiré</h1>
          <p className="text-slate-400 mb-4">Le lien de vérification a expiré (valable 24h). Veuillez demander un nouveau lien ou vous réinscrire.</p>
          <Link to="/forgot-password" className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2 rounded-lg">
            Mot de passe oublié
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white max-w-md">
        <XCircle size={64} className="mx-auto text-red-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Échec de vérification</h1>
        <p className="text-slate-400 mb-4">Le lien de vérification est invalide ou a déjà été utilisé.</p>
        <Link to="/register" className="inline-block bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-2 rounded-lg">
          Créer un compte
        </Link>
      </div>
    </div>
  );
};

export default EmailVerified;