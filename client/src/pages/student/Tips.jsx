import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, GraduationCap, PenTool, Loader, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

const categories = [
  { key: 'exercises', label: 'Exercices', icon: PenTool, color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
  { key: 'homework', label: 'Devoirs', icon: BookOpen, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { key: 'exams', label: 'Examens', icon: GraduationCap, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
];

// Fonction pour formater le contenu (JSON brut -> objet lisible)
const formatContent = (rawContent) => {
  if (!rawContent) return null;
  // Si le contenu est déjà une chaîne simple, on la retourne
  if (typeof rawContent === 'string' && !rawContent.startsWith('{')) {
    return { text: rawContent };
  }
  // Si c'est du JSON, on le parse et on extrait les champs utiles
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk flex items-center gap-2">
          <Lightbulb className="text-amber-400" size={28} />
          Astuces pour réussir
        </h1>
        <p className="text-slate-400 mt-1">Conseils personnalisés pour progresser</p>
      </motion.div>

      {/* Sélecteur de catégories */}
      <div className="flex flex-wrap gap-3">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all border ${
              category === cat.key
                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <cat.icon size={18} className={category === cat.key ? activeCategory.color.split(' ')[0] : ''} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Liste des astuces */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400 text-lg">Chargement des astuces…</span>
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
          <Sparkles size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucune astuce pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Revenez plus tard ou contactez votre professeur.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tips.map((tip, idx) => {
            const formatted = formatContent(tip.content);
            const tipId = tip.id || idx;
            const isExpanded = expanded[tipId] || false;
            return (
              <motion.div
                key={tipId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white/5 backdrop-blur-lg border ${activeCategory.color.split(' ')[1]} rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer`}
                onClick={() => toggleExpand(tipId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${activeCategory.color.split(' ')[2]} ${activeCategory.color.split(' ')[1]}`}>
                    <Lightbulb size={18} className={activeCategory.color.split(' ')[0]} />
                  </div>
                  <div className="flex-1">
                    {formatted.title && (
                      <h3 className="text-white font-semibold text-lg mb-1">{formatted.title}</h3>
                    )}
                    <p className="text-slate-300 leading-relaxed">
                      {isExpanded ? formatted.text : formatted.text.substring(0, 100) + (formatted.text.length > 100 ? '...' : '')}
                    </p>
                    {formatted.action && isExpanded && (
                      <p className="mt-3 text-sm text-slate-400 italic border-t border-white/10 pt-3">
                        💡 {formatted.action}
                      </p>
                    )}
                  </div>
                  <button className="text-slate-400 hover:text-white mt-1">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tips;