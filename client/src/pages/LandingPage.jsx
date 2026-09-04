import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import {
  BookOpen, Brain, Swords, Zap, Users, ArrowRight, ChevronDown,
  Shield, FileText, MessageCircle, GraduationCap, Layers, Target,
  Sparkles, Rocket, Award, Clock, TrendingUp
} from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

/* ------------------------------------------------------------------ */
/*  Curseur lumineux amélioré                                          */
/* ------------------------------------------------------------------ */
const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const springX = useSpring(pos.x, { stiffness: 200, damping: 20 });
  const springY = useSpring(pos.y, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback((e) => {
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  if (!visible) return null;
  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] w-8 h-8 rounded-full bg-violet-500/40 blur-xl mix-blend-screen"
      style={{ left: springX, top: springY, translateX: '-50%', translateY: '-50%' }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Compteur animé d’inscrits                                          */
/* ------------------------------------------------------------------ */
const AnimatedCounter = ({ target = 1247 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-mono text-lg font-bold text-violet-400">
      {count.toLocaleString()}+
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Fond de particules                                                 */
/* ------------------------------------------------------------------ */
const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => { await loadSlim(engine); }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        fpsLimit: 60,
        particles: {
          number: { value: 80, density: { enable: true, area: 800 } },
          color: { value: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'] },
          shape: { type: 'circle' },
          opacity: { value: 0.2 },
          size: { value: { min: 1, max: 4 } },
          links: { enable: true, distance: 150, color: '#8B5CF6', opacity: 0.15, width: 1 },
          move: { enable: true, speed: 0.6, direction: 'none', outModes: 'bounce' },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: 'grab' } },
          modes: { grab: { distance: 200, links: { opacity: 0.3 } } },
        },
        detectRetina: true,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Illustrations animées                                              */
/* ------------------------------------------------------------------ */
const HeroIllustration = () => (
  <div className="relative w-80 h-80 lg:w-96 lg:h-96 mx-auto">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 blur-2xl animate-pulse" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-48 h-48 rounded-full bg-gradient-to-tr from-violet-500/30 via-cyan-500/30 to-violet-500/30 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(139,92,246,0.4)]"
      />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-full h-full">
        {[
          { Icon: BookOpen, pos: 'top-10 left-10', color: 'bg-violet-500/80', y: [0, -12, 0] },
          { Icon: Brain, pos: 'top-10 right-10', color: 'bg-cyan-500/80', y: [0, 12, 0] },
          { Icon: Swords, pos: 'bottom-10 left-10', color: 'bg-emerald-500/80', y: [0, -12, 0] },
          { Icon: Zap, pos: 'bottom-10 right-10', color: 'bg-amber-500/80', y: [0, 12, 0] },
        ].map(({ Icon, pos, color, y }, idx) => (
          <motion.div
            key={idx}
            animate={{ y }}
            transition={{ repeat: Infinity, duration: 3 + idx * 0.2, ease: 'easeInOut', delay: idx * 0.3 }}
            className={`absolute ${pos} w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md`}
          >
            <Icon size={24} className="text-white" />
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const FeatureIllustration1 = () => (
  <div className="relative w-32 h-32 mx-auto">
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ rotateY: [0, 360] }}
      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      style={{ perspective: '200px' }}
    >
      <div className="w-20 h-24 bg-violet-500/20 border border-violet-400/40 rounded-2xl shadow-xl flex items-center justify-center">
        <BookOpen size={32} className="text-violet-400" />
      </div>
    </motion.div>
  </div>
);

const FeatureIllustration2 = () => (
  <div className="relative w-32 h-32 mx-auto">
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
        <Brain size={32} className="text-cyan-400" />
      </div>
    </motion.div>
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-cyan-400"
        style={{ originX: '0px', originY: '0px', rotate: i * 90 }}
        animate={{ x: [0, 30, 0], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
      />
    ))}
  </div>
);

const FeatureIllustration3 = () => (
  <div className="relative w-32 h-32 mx-auto">
    <motion.div
      className="absolute inset-0 flex items-center justify-center gap-4"
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    >
      <Swords size={40} className="text-emerald-400 drop-shadow-lg" />
      <Swords size={40} className="text-emerald-400 drop-shadow-lg -scale-x-100" />
    </motion.div>
  </div>
);

const StepIllustration = ({ step, Icon, color }) => (
  <motion.div
    className={`w-24 h-24 rounded-full bg-${color}-500/20 border border-${color}-400/30 flex items-center justify-center mx-auto mb-4 relative`}
    whileHover={{ scale: 1.1 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
      className="absolute inset-0 rounded-full border border-dashed border-white/10"
    />
    <Icon size={32} className={`text-${color}-400`} />
    <motion.span
      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-lg font-bold text-white"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
    >
      {step}
    </motion.span>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */
const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="relative min-h-screen bg-[#0B0E1A] text-white font-sans overflow-x-hidden">
      <CursorGlow />
      <ParticleBackground />

      {/* Header avec effet glassmorphism */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 inset-x-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="EXO MASTER" className="h-8 w-auto transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold font-space-grotesk bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              EXO MASTER
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#cta" className="hover:text-white transition-colors">Rejoindre</a>
            <Link to="/login" className="px-5 py-2 rounded-full border border-slate-500 text-white hover:bg-white/10 transition-all">
              Connexion
            </Link>
            <Link to="/register" className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all">
              S'inscrire
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section - texte percutant */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex flex-col lg:flex-row items-center justify-between min-h-screen pt-24 pb-16 px-6 max-w-7xl mx-auto gap-12"
      >
        <div className="flex-1 space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300"
          >
            <Sparkles size={14} className="text-violet-400" />
            La nouvelle façon d'apprendre
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl lg:text-7xl font-extrabold font-space-grotesk leading-tight"
          >
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Maîtrisez chaque matière,
            </span>
            <br />
            <span className="text-white">un défi à la fois.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-slate-300 max-w-xl leading-relaxed"
          >
            EXO MASTER transforme vos révisions en une expérience interactive : exercices intelligents, quiz chronométrés, duels entre élèves et suivi de progression boosté par l'IA.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Rocket size={20} className="group-hover:animate-bounce" />
              Commencer gratuitement
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border border-slate-400 text-slate-300 px-8 py-4 rounded-full hover:bg-white/10 transition-all"
            >
              Se connecter
            </Link>
            <div className="flex items-center gap-2 text-slate-400 text-sm ml-4">
              <Users size={16} className="text-emerald-400" />
              <AnimatedCounter target={1247} />
              <span>élèves nous font confiance</span>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          className="flex-1 flex justify-center items-center"
        >
          <HeroIllustration />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-slate-400"
        >
          <ChevronDown size={32} className="animate-bounce" />
        </motion.div>
      </motion.section>

      {/* Features - cartes immersives */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-4xl lg:text-5xl font-bold font-space-grotesk text-center mb-6"
        >
          Pourquoi choisir <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">EXO MASTER</span> ?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-400 text-center max-w-2xl mx-auto mb-20"
        >
          Des outils pensés pour votre réussite, du collège au lycée.
        </motion.p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: BookOpen, color: 'from-violet-400 to-violet-600', label: 'Exercices Progressifs', desc: 'Une progression en douceur, chapitre par chapitre, avec des niveaux adaptés à votre rythme.', illustration: <FeatureIllustration1 /> },
            { icon: Brain, color: 'from-cyan-400 to-cyan-600', label: 'IA Pédagogique', desc: "Des contenus générés automatiquement par l'IA, toujours frais et pertinents.", illustration: <FeatureIllustration2 /> },
            { icon: Swords, color: 'from-emerald-400 to-emerald-600', label: 'Duels & Classements', desc: 'Défiez vos camarades, mesurez vos scores et grimpez dans le classement.', illustration: <FeatureIllustration3 /> },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="mb-6 relative z-10">
                {item.illustration}
              </div>
              <h3 className="text-xl font-semibold mb-3 font-space-grotesk relative z-10">{item.label}</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works - processus simple */}
      <section id="how" className="relative max-w-7xl mx-auto px-6 py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold font-space-grotesk text-center mb-20"
        >
          Comment ça marche ?
        </motion.h2>
        <div className="grid md:grid-cols-4 gap-10">
          {[
            { step: 1, color: 'violet', label: 'Créez votre compte', desc: "Inscription gratuite en 30 secondes.", Icon: GraduationCap },
            { step: 2, color: 'cyan', label: 'Choisissez vos matières', desc: "Accédez aux chapitres de votre classe.", Icon: Layers },
            { step: 3, color: 'emerald', label: 'Faites les exercices', desc: "Progressez avec les quiz chronométrés.", Icon: Target },
            { step: 4, color: 'amber', label: 'Défiez vos amis', desc: "Lancez des challenges et devenez le meilleur.", Icon: Swords },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <StepIllustration step={item.step} Icon={item.Icon} color={item.color} />
              <h3 className="font-semibold mb-2 font-space-grotesk">{item.label}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-20 h-2 bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50 rounded-full blur-sm" />
      </section>

      {/* CTA Final */}
      <section id="cta" className="max-w-4xl mx-auto px-6 py-32 text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-r from-violet-600/30 to-cyan-600/30 backdrop-blur-xl border border-white/10 rounded-3xl p-14 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[#0B0E1A]/40 pointer-events-none" />
          <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-6 relative z-10">
            Prêt à exceller ?
          </h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto text-lg relative z-10">
            Rejoignez la plateforme qui transforme l'apprentissage en expérience interactive.
          </p>
          <Link
            to="/register"
            className="relative z-10 inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 hover:scale-105 transition-all shadow-xl"
          >
            Commencer maintenant <ArrowRight size={24} />
          </Link>
        </motion.div>
      </section>

      {/* Sections légales (discrètes) */}
      <section id="privacy" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10"
        >
          <Shield className="text-violet-400 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-bold text-white font-space-grotesk mb-4">Confidentialité</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Nous prenons la protection de vos données très au sérieux. Aucune information personnelle n'est partagée sans votre consentement. Les données sont stockées de manière sécurisée et utilisées uniquement dans le cadre de la plateforme EXO MASTER.
          </p>
        </motion.div>
      </section>

      <section id="terms" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10"
        >
          <FileText className="text-cyan-400 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-bold text-white font-space-grotesk mb-4">Conditions d'utilisation</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            En utilisant EXO MASTER, vous acceptez nos conditions générales. La plateforme est réservée à un usage éducatif. Nous nous réservons le droit de suspendre tout compte en cas de non-respect des règles de bonne conduite.
          </p>
        </motion.div>
      </section>

      <section id="support" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10"
        >
          <MessageCircle className="text-emerald-400 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-bold text-white font-space-grotesk mb-4">Support</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Besoin d'aide ? Contactez-nous via le bouton WhatsApp en bas à droite de votre écran (lorsque vous êtes connecté), ou envoyez un email à support@exomaster.com. Notre équipe vous répond dans les plus brefs délais.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src={logo} alt="EXO MASTER" className="h-5 w-auto opacity-70" />
            <span>© 2026 EXO MASTER. Tous droits réservés.</span>
          </div>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#terms" className="hover:text-white transition-colors">Conditions</a>
            <a href="#support" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;