import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, BookOpen, GraduationCap, PenTool, Loader, Sparkles,
  ChevronDown, ChevronUp, Target, Zap, Info
} from 'lucide-react';
import api from '../../services/api';

const categories = [
  { key: 'exercises', label: 'Exercices', icon: PenTool, color: 'from-violet-500 to-violet-700' },
  { key: 'homework', label: 'Devoirs', icon: BookOpen, color: 'from-cyan-500 to-cyan-700' },
  { key: 'exams', label: 'Examens', icon: GraduationCap, color: 'from-amber-500 to-amber-700' },
];

// Fonction pour formater le contenu (JSON brut -> objet lisible)
const formatContent = (rawContent) => {
  if (!rawContent) return null;
  if (typeof rawContent === 'string' && !rawContent.startsWith('{')) {
    return { text: rawContent };
  }
  try {
    const parsed = JSON.parse(rawContent);
    return {
      title: parsed.title || parsed.nom || parsed.astuce || null,
      text: parsed.content || parsed.description || parsed.explication || parsed.text || '',
      action: parsed.action || parsed.avantages || parsed.effet || '',
    };
  } catch {
    return { text: rawContent };
  }
};

const Tips = () => {
  const [tips, setTips] = useState([]);
  const [category, setCategory] = useState('exercises');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/student/tips?category=${category}`)
      .then(res => {
        if (!cancelled) setTips(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCategory = categories.find(c => c.key === category) || categories[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Lightbulb size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">
            Astuces pour réussir
          </h1>
          <p className="text-slate-400 text-sm">Conseils personnalisés pour progresser</p>
        </div>
      </motion.div>

      {/* Sélecteur de catégories avec indicateur animé */}
      <div className="flex flex-wrap gap-3">
        {categories.map(cat => {
          const isActive = category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <cat.icon size={18} />
              {cat.label}
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 rounded-full border-2 border-white/30 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Liste des astuces */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400 text-lg">Chargement des astuces…</span>
        </div>
      ) : tips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-amber-400" />
          </div>
          <p className="text-slate-400 text-lg">Aucune astuce pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Revenez plus tard ou contactez votre professeur.</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {tips.map((tip, idx) => {
              const formatted = formatContent(tip.content);
              const tipId = tip.id || idx;
              const isExpanded = expanded[tipId] || false;
              return (
                <motion.div
                  key={tipId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
                >
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => toggleExpand(tipId)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${activeCategory.color} bg-opacity-20 shrink-0`}>
                        <Lightbulb size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {formatted.title && (
                          <h3 className="text-white font-semibold text-lg mb-1">{formatted.title}</h3>
                        )}
                        <p className="text-slate-300 leading-relaxed">
                          {isExpanded ? formatted.text : formatted.text.substring(0, 120) + (formatted.text.length > 120 ? '...' : '')}
                        </p>
                      </div>
                      <button className="text-slate-400 hover:text-white mt-1 transition-colors shrink-0">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && formatted.action && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5"
                      >
                        <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2">
                          <Zap size={16} className="text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-300 leading-relaxed">{formatted.action}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Tips;