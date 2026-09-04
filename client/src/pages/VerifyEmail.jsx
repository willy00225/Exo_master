import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Mail, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          // Redirection après un court instant pour laisser l'animation se terminer
          setTimeout(() => {
            window.location.href = '/email-verified?success=true';
          }, 1500);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setTimeout(() => {
            window.location.href = '/email-verified?error=invalid';
          }, 1500);
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white max-w-md w-full shadow-2xl"
      >
        {status === 'verifying' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mx-auto mb-6"
            >
              <Mail size={40} className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Loader className="animate-spin text-violet-400 mx-auto mb-4" size={32} />
              <h1 className="text-2xl font-bold font-space-grotesk mb-2">
                Vérification en cours...
              </h1>
              <p className="text-slate-400">
                Nous vérifions votre adresse email, un instant s'il vous plaît.
              </p>
            </motion.div>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={48} className="text-emerald-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-space-grotesk mb-2"
            >
              Email vérifié !
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400"
            >
              Redirection en cours...
            </motion.p>
            <Sparkles className="text-amber-400 mx-auto mt-4 animate-pulse" size={24} />
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <XCircle size={48} className="text-red-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-space-grotesk mb-2"
            >
              Échec de la vérification
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400"
            >
              Le lien est invalide ou a expiré. Redirection...
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;