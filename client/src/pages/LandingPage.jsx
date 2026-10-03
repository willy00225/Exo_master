import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen, Brain, Swords, Zap, Users, ArrowRight,
  Shield, FileText, MessageCircle, GraduationCap, Layers, Target,
  Sparkles, Rocket, Star, Menu, X, Check, Play,
  BarChart3, Trophy, Clock, Lock, ChevronDown
} from 'lucide-react';
import logo from '../assets/exo_master_logo.png';

/* ------------------------------------------------------------------ */
/*  Compteur animé (déclenché au scroll)                               */
/* ------------------------------------------------------------------ */
const AnimatedCounter = ({ target = 1247, suffix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
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
  }, [target, isInView]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {count.toLocaleString('fr-FR')}{suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Section wrapper avec animation d'entrée propre                     */
/* ------------------------------------------------------------------ */
const Section = ({ id, className = '', children }) => (
  <section id={id} className={`relative ${className}`}>
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const testimonials = [
    {
      name: 'Awa Kouassi',
      role: 'Élève en 3ᵉ',
      school: 'Collège Sainte-Marie',
      text: "J'ai gagné 4 points de moyenne en maths en un trimestre. Les quiz chronométrés me forcent à réfléchir vite.",
      initials: 'AK',
    },
    {
      name: 'Ibrahim Sanogo',
      role: 'Élève en Terminale',
      school: 'Lycée Classique d\'Abidjan',
      text: "Les duels entre camarades, c'est ce qui me fait revenir tous les jours. On révise sans s'en rendre compte.",
      initials: 'IS',
    },
    {
      name: 'Mariam Diallo',
      role: 'Parent d\'élève',
      school: 'Abidjan',
      text: "Mon fils était en échec scolaire. En 3 mois, il est passé de 8 à 14 de moyenne. Je recommande à tous les parents.",
      initials: 'MD',
    },
  ];

  const features = [
    {
      Icon: BookOpen,
      title: 'Progression par niveaux',
      desc: 'Chaque chapitre est découpé en 4 niveaux de difficulté. Vous ne passez au suivant qu\'après avoir validé le précédent avec 70 %.',
    },
    {
      Icon: Brain,
      title: 'Contenus générés par IA',
      desc: 'Des milliers d\'exercices et résumés produits et vérifiés par nos équipes pédagogiques, constamment enrichis.',
    },
    {
      Icon: Swords,
      title: 'Défis entre élèves',
      desc: 'Défiez un camarade sur un quiz, comparez vos scores en temps réel et grimpez dans le classement de votre classe.',
    },
  ];

  const steps = [
    { n: '01', title: 'Créez votre compte', desc: 'Inscription en 30 secondes avec votre code école ou en autonomie.' },
    { n: '02', title: 'Choisissez votre classe', desc: 'Accédez directement aux chapitres de votre programme officiel.' },
    { n: '03', title: 'Travaillez à votre rythme', desc: 'Exercices progressifs, corrigés détaillés, résumés de cours.' },
    { n: '04', title: 'Mesurez vos progrès', desc: 'Statistiques détaillées, badges, classement et suivi par chapitre.' },
  ];

  const stats = [
    { value: 1247, suffix: '+', label: 'Élèves actifs', Icon: Users },
    { value: 12500, suffix: '+', label: 'Exercices résolus', Icon: BarChart3 },
    { value: 87, suffix: '%', label: 'Améliorent leur moyenne', Icon: Trophy },
    { value: 45, suffix: '+', label: 'Établissements partenaires', Icon: GraduationCap },
  ];

  const faq = [
    {
      q: 'Est-ce que c\'est vraiment gratuit ?',
      a: 'L\'inscription et la découverte sont gratuites. Un abonnement mensuel ou annuel permet d\'accéder à l\'intégralité des contenus et fonctionnalités.',
    },
    {
      q: 'Mon école n\'est pas encore partenaire. Puis-je quand même utiliser EXO MASTER ?',
      a: 'Absolument. Vous pouvez vous inscrire en autonomie et choisir votre classe manuellement lors de l\'inscription.',
    },
    {
      q: 'Les contenus sont-ils conformes au programme officiel ?',
      a: 'Oui. Nos chapitres sont alignés sur les programmes officiels du collège et du lycée, validés par des enseignants en exercice.',
    },
    {
      q: 'Comment fonctionne la génération par IA ?',
      a: 'Nos modèles génèrent des exercices et résumés à partir des programmes officiels. Chaque contenu est ensuite relu et validé par notre équipe pédagogique avant publication.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0E1A] text-white font-sans overflow-x-hidden">

      {/* -------------------- HEADER -------------------- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0E1A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="EXO MASTER" className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight">EXO MASTER</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
            >
              Commencer
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0B0E1A] border-t border-white/10">
            <div className="flex flex-col p-4 gap-1">
              <a href="#features" onClick={() => setMenuOpen(false)} className="py-3 text-slate-300 hover:text-white">Fonctionnalités</a>
              <a href="#how" onClick={() => setMenuOpen(false)} className="py-3 text-slate-300 hover:text-white">Comment ça marche</a>
              <a href="#testimonials" onClick={() => setMenuOpen(false)} className="py-3 text-slate-300 hover:text-white">Témoignages</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="py-3 text-slate-300 hover:text-white">FAQ</a>
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2.5 text-center text-slate-200 hover:text-white">Connexion</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="py-2.5 text-center rounded-lg bg-white text-slate-900 font-semibold">Commencer</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -------------------- HERO -------------------- */}
      <Section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Colonne gauche : texte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3 py-1.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Nouveau : IA pédagogique disponible
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                La plateforme qui fait
                <br />
                <span className="text-slate-400">progresser vos élèves.</span>
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Exercices progressifs, quiz chronométrés et suivi détaillé — pensés avec des enseignants pour le collège et le lycée.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Créer un compte gratuit
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <Play size={16} />
                  Voir une démo
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-cyan-400" />
                  Sans engagement
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-cyan-400" />
                  Conforme aux programmes
                </div>
              </div>
            </motion.div>

            {/* Colonne droite : mockup statique (pas d'animation infinie) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              {/* Carte mockup du dashboard */}
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
                {/* Header mockup */}
                <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  <span className="ml-3 text-xs text-slate-500">exo-master.com/student</span>
                </div>

                {/* Contenu mockup */}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Bonjour</p>
                      <p className="text-lg font-semibold text-white">Awa K.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                      AK
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <BookOpen size={14} /> Exercices
                      </div>
                      <p className="text-2xl font-bold text-white">142</p>
                      <p className="text-xs text-cyan-400 mt-1">+12 cette semaine</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Trophy size={14} /> Score moyen
                      </div>
                      <p className="text-2xl font-bold text-white">84%</p>
                      <p className="text-xs text-cyan-400 mt-1">Top 15% de la classe</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">Progression du chapitre</span>
                      <span className="text-xs text-slate-500">3/4 niveaux</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Théorème de Pythagore</p>
                  </div>
                </div>
              </div>

              {/* Badge flottant discret (statique) */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-xl px-4 py-3 shadow-xl hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Résumé validé par IA</p>
                    <p className="text-xs text-white font-medium">Il y a 2 minutes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* -------------------- TRUST BAR -------------------- */}
      <Section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-8">
            Utilisé par des établissements à Abidjan et à l'intérieur du pays
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
            {/* Placeholders de logos d'écoles — remplacez par les vrais logos */}
            {['Collège Sainte-Marie', 'Lycée Classique', 'Groupe Scolaire Les Palmiers', 'Lycée Moderne', 'Collège Notre-Dame'].map((school) => (
              <span key={school} className="text-sm font-medium text-slate-500">
                {school}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- FEATURES -------------------- */}
      <Section id="features" className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <p className="text-sm text-cyan-400 mb-3 font-medium">Fonctionnalités</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Tout ce dont un élève a besoin pour progresser
            </h2>
            <p className="text-slate-400 text-lg">
              Une méthode structurée, des contenus vérifiés, et un suivi transparent pour l'élève comme pour le parent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <feature.Icon size={20} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- STATS -------------------- */}
      <Section className="py-20 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="text-center"
              >
                <stat.Icon size={20} className="text-slate-500 mx-auto mb-3" />
                <p className="text-3xl lg:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- HOW IT WORKS -------------------- */}
      <Section id="how" className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <p className="text-sm text-cyan-400 mb-3 font-medium">Comment ça marche</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              De l'inscription à la progression, en 4 étapes
            </h2>
            <p className="text-slate-400 text-lg">
              Pas de configuration complexe. En moins de 5 minutes, l'élève est prêt à travailler.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <span className="text-5xl font-bold text-white/5 block mb-4 font-mono">{step.n}</span>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- TESTIMONIALS -------------------- */}
      <Section id="testimonials" className="py-24 lg:py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <p className="text-sm text-cyan-400 mb-3 font-medium">Témoignages</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Ce qu'en disent les élèves et les parents
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                  « {t.text} »
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-semibold text-slate-300">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role} · {t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- FAQ -------------------- */}
      <Section id="faq" className="py-24 lg:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-sm text-cyan-400 mb-3 font-medium">Questions fréquentes</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Vous avez des questions ?
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faq.map((item, idx) => (
              <motion.details
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-white/[0.03] transition-colors list-none">
                  <span className="font-medium text-white pr-4">{item.q}</span>
                  <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------- FINAL CTA -------------------- */}
      <Section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-10 lg:p-16 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Prêt à améliorer vos résultats ?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Rejoignez plus de 1 200 élèves qui progressent chaque semaine avec EXO MASTER.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 text-slate-200 hover:bg-white/5 transition-colors"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="border-t border-white/10 py-14 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="EXO MASTER" className="h-7 w-auto" />
                <span className="font-bold">EXO MASTER</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                La plateforme éducative conçue avec des enseignants pour le collège et le lycée en Côte d'Ivoire.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-4">Produit</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-4">Support</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <a href="mailto:support@exomaster.com" className="hover:text-white transition-colors">
                    support@exomaster.com
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/" className="hover:text-white transition-colors">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 EXO MASTER. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Conditions</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;