import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ArrowRight, Mail } from 'lucide-react';

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  const renderContent = () => {
    if (success === 'true') {
      return {
        icon: <CheckCircle size={64} className="mx-auto text-cyan-400 mb-6" />,
        title: 'Email vérifié !',
        message: 'Votre compte est maintenant actif.',
        actionLink: '/login',
        actionLabel: 'Se connecter',
      };
    }
    if (error === 'expired') {
      return {
        icon: <Clock size={64} className="mx-auto text-violet-400 mb-6" />,
        title: 'Lien expiré',
        message: 'Le lien de vérification a expiré (valable 24h). Veuillez demander un nouveau lien ou vous réinscrire.',
        actionLink: '/forgot-password',
        actionLabel: 'Mot de passe oublié',
      };
    }
    return {
      icon: <XCircle size={64} className="mx-auto text-red-400 mb-6" />,
      title: 'Échec de vérification',
      message: 'Le lien de vérification est invalide ou a déjà été utilisé.',
      actionLink: '/register',
      actionLabel: 'Créer un compte',
    };
  };

  const { icon, title, message, actionLink, actionLabel } = renderContent();

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white max-w-md w-full shadow-2xl"
      >
        {icon}

        <h1 className="text-2xl font-bold mb-2 font-space-grotesk">
          {title}
        </h1>

        <p className="text-slate-400 mb-6 leading-relaxed">
          {message}
        </p>

        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-violet-500/20 active:scale-95"
          aria-label={actionLabel}
        >
          {actionLabel}
          <ArrowRight size={18} />
        </Link>

        <p className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-1">
          <Mail size={14} />
          <a
            href="mailto:support@exomaster.com"
            className="hover:text-violet-400 transition-colors"
            aria-label="Contacter le support"
          >
            Besoin d'aide ? Contactez le support
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default EmailVerified;