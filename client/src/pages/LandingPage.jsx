import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import {
  BookOpen, Brain, Swords, Zap, Users, ArrowRight, ChevronDown
} from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

/* ------------------------------
   Curseur personnalisé lumineux
------------------------------ */
const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  const handleMouseMove = useCallback((e) => {
    setPos({ x: e.clientX, y: e.clientY });
    if (!visible) setVisible(true);
  }, [visible]);

  const handleMouseLeave = () => setVisible(false);
  const handleMouseEnter = () => setVisible(true);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [handleMouseMove]);

  if (!visible) return null;
  return (
    <div
      className="pointer-events-none fixed z-[9999] w-6 h-6 rounded-full bg-violet-500/40 blur-xl"
      style={{
        left: pos.x - 12,
        top: pos.y - 12,
        transition: 'left 0.05s ease-out, top 0.05s ease-out',
      }}
    />
  );
};

/* ------------------------------
   Compteur animé d'inscrits
------------------------------ */
const AnimatedCounter = ({ target = 1247 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-mono text-lg font-bold text-violet-400">
      {count.toLocaleString()}+
    </span>
  );
};

/* ------------------------------
   Particules (fond animé)
------------------------------ */
const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

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
          number: { value: 60, density: { enable: true, area: 800 } },
          color: { value: ['#8B5CF6', '#06B6D4', '#10B981'] },
          shape: { type: 'circle' },
          opacity: { value: 0.15 },
          size: { value: { min: 1, max: 3 } },
          links: {
            enable: true,
            distance: 150,
            color: '#8B5CF6',
            opacity: 0.1,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.5,
            direction: 'none',
            outModes: 'bounce',
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
          },
          modes: {
            grab: { distance: 200, links: { opacity: 0.2 } },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

/* ------------------------------
   Composant principal
------------------------------ */
const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="relative min-h-screen bg-[#0B0E1A] text-white font-sans overflow-x-hidden">
      <CursorGlow />
      <ParticleBackground />

      {/* Header glassmorphism */}
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

      {/* Hero Section avec animation CSS */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex flex-col lg:flex-row items-center justify-between min-h-screen pt-24 pb-16 px-6 max-w-7xl mx-auto gap-12"
      >
        <div className="flex-1 space-y-8 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl lg:text-7xl font-extrabold font-space-grotesk leading-tight"
          >
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Devenez le meilleur
            </span>
            <br />
            <span className="text-white">avec l'apprentissage intelligent</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-slate-300 max-w-xl"
          >
            EXO MASTER combine exercices progressifs, quiz chronométrés et challenges entre élèves pour booster votre réussite scolaire. Propulsé par l'IA.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              Commencer gratuitement <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border border-slate-400 text-slate-300 px-8 py-4 rounded-full hover:bg-white/10 transition-all"
            >
              Se connecter
            </Link>
            <div className="flex items-center gap-2 text-slate-400 text-sm ml-4">
              <Users size={16} />
              <AnimatedCounter target={1247} />
              <span>élèves déjà inscrits</span>
            </div>
          </motion.div>
        </div>

        {/* Illustration animée CSS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          className="flex-1 flex justify-center items-center"
        >
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 blur-2xl animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="animate-spin w-48 h-48 rounded-full bg-gradient-to-tr from-violet-500/30 via-cyan-500/30 to-violet-500/30 backdrop-blur-xl border border-white/20 shadow-[0_0_60px_rgba(139,92,246,0.3)]"
                style={{ animationDuration: '8s' }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute top-10 left-10 w-12 h-12 bg-violet-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                >
                  <BookOpen size={24} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute top-10 right-10 w-12 h-12 bg-cyan-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                >
                  <Brain size={24} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-10 left-10 w-12 h-12 bg-emerald-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                >
                  <Swords size={24} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 1.5 }}
                  className="absolute bottom-10 right-10 w-12 h-12 bg-amber-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                >
                  <Zap size={24} className="text-white" />
                </motion.div>
              </div>
            </div>
          </div>
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

      {/* Features Section */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-4xl lg:text-5xl font-bold font-space-grotesk text-center mb-20"
        >
          Pourquoi EXO MASTER ?
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: BookOpen, color: 'from-violet-400 to-violet-600', label: 'Exercices Progressifs', desc: 'Des contenus classés par niveau et par chapitre, pour une progression en douceur.' },
            { icon: Brain, color: 'from-cyan-400 to-cyan-600', label: 'IA Intégrée', desc: "L'intelligence artificielle génère automatiquement exercices et quiz adaptés." },
            { icon: Swords, color: 'from-emerald-400 to-emerald-600', label: 'Challenges & Duels', desc: 'Défiez vos camarades, mesurez vos scores et grimpez dans le classement.' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-default"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                <item.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-space-grotesk">{item.label}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-violet-500/10 to-transparent" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
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
            { step: 1, color: 'violet', label: 'Inscrivez-vous', desc: "Créez votre compte en quelques secondes." },
            { step: 2, color: 'cyan', label: 'Choisissez vos matières', desc: "Accédez aux groupes et chapitres qui vous concernent." },
            { step: 3, color: 'emerald', label: 'Faites les exercices', desc: "Progressez pas à pas avec les quiz chronométrés." },
            { step: 4, color: 'amber', label: 'Défiez vos amis', desc: "Lancez des challenges et devenez le meilleur." }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold font-mono border ${
                item.color === 'violet' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                item.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {item.step}
              </div>
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
          className="relative bg-gradient-to-r from-violet-600/30 to-cyan-600/30 backdrop-blur-xl border border-white/10 rounded-3xl p-14 shadow-2xl"
        >
          <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-6">
            Prêt à exceller ?
          </h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto text-lg">
            Rejoignez la plateforme qui transforme l'apprentissage en expérience interactive.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 hover:scale-105 transition-all shadow-xl"
          >
            Commencer maintenant <ArrowRight size={24} />
          </Link>
          <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20">
            <div className="w-full h-full bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-violet-500 via-cyan-500 to-violet-500 rounded-3xl blur-3xl" />
          </div>
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
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Conditions</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;