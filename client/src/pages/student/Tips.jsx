import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, GraduationCap, PenTool, Loader, Sparkles } from 'lucide-react';
import api from '../../services/api';   // ✅ chemin corrigé

const categories = [
  { key: 'exercises', label: 'Exercices', icon: PenTool, color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
  { key: 'homework', label: 'Devoirs', icon: BookOpen, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { key: 'exams', label: 'Examens', icon: GraduationCap, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
];

const Tips = () => {
  const [tips, setTips] = useState([]);
  const [category, setCategory] = useState('exercises');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/student/tips?category=${category}`)   // ✅ route publique pour les élèves
      .then(res => {
        if (!cancelled) setTips(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category]);

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
          {tips.map((tip, idx) => (
            <motion.div
              key={tip.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white/5 backdrop-blur-lg border ${activeCategory.color.split(' ')[1]} rounded-2xl p-5 hover:bg-white/10 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${activeCategory.color.split(' ')[2]} ${activeCategory.color.split(' ')[1]}`}>
                  <Lightbulb size={18} className={activeCategory.color.split(' ')[0]} />
                </div>
                <p className="text-slate-200 leading-relaxed">{tip.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tips;