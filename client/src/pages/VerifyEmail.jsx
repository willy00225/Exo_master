import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Mail, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    let redirectTimer;

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          // Redirection SPA après un court instant
          redirectTimer = setTimeout(() => {
            navigate('/email-verified?success=true', { replace: true });
          }, 1500);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          redirectTimer = setTimeout(() => {
            navigate('/email-verified?error=invalid', { replace: true });
          }, 1500);
        }
      });

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif statique (plus d'animate-pulse) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white max-w-md w-full shadow-2xl"
      >
        {status === 'verifying' && (
          <div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mx-auto mb-6">
              <Mail size={40} className="text-white" />
            </div>

            {/* Spinner rotatif — CSS au lieu de Framer Motion pour éviter les re-renders */}
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 border-r-cyan-500 rounded-full animate-spin" />
            </div>

            <h1 className="text-2xl font-bold font-space-grotesk mb-2">
              Vérification en cours...
            </h1>
            <p className="text-slate-400">
              Nous vérifions votre adresse email, un instant s'il vous plaît.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-cyan-400" />
            </div>

            <h1 className="text-2xl font-bold font-space-grotesk mb-2">
              Email vérifié !
            </h1>
            <p className="text-slate-400">
              Redirection en cours...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-red-400" />
            </div>

            <h1 className="text-2xl font-bold font-space-grotesk mb-2">
              Échec de la vérification
            </h1>
            <p className="text-slate-400">
              Le lien est invalide ou a expiré. Redirection...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;