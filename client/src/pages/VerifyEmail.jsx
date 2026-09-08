import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white max-w-md w-full shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {status === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                {/* Spinner amélioré */}
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                  <motion.div
                    className="absolute inset-0 border-4 border-transparent border-t-violet-500 border-r-cyan-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                </div>
                <h1 className="text-2xl font-bold font-space-grotesk mb-2">
                  Vérification en cours...
                </h1>
                <p className="text-slate-400">
                  Nous vérifions votre adresse email, un instant s'il vous plaît.
                </p>
              </motion.div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle size={48} className="text-cyan-400" />
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                transition={{ delay: 0.4, duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
                className="mt-4"
              >
                <Sparkles className="text-violet-400 mx-auto" size={24} />
              </motion.div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex justify-center"
              >
                <Sparkles className="text-red-400/50" size={20} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;