import { useState, useEffect } from 'react';
import {
  Lightbulb, BookOpen, GraduationCap, PenTool, Loader, Sparkles,
  ChevronDown, ChevronUp, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const categories = [
  { key: 'exercises', label: 'Exercices', icon: PenTool, color: 'from-violet-500 to-violet-700' },
  { key: 'homework', label: 'Devoirs', icon: BookOpen, color: 'from-cyan-500 to-cyan-700' },
  { key: 'exams', label: 'Examens', icon: GraduationCap, color: 'from-amber-500 to-amber-700' },
];

// Formate le contenu JSON brut en objet lisible
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
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchTips = async (cat = category) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/student/tips?category=${cat}`);
      setTips(res.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les astuces. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips(category);
  }, [category]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTips(category);
    setRefreshing(false);
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCategory = categories.find(c => c.key === category) || categories[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête — statique */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
            <Lightbulb size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk">
              Astuces pour réussir
            </h1>
            <p className="text-slate-400 text-sm">Conseils personnalisés pour progresser</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
          aria-label="Actualiser les astuces"
          title="Actualiser"
        >
          {refreshing ? <Loader size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      {/* Sélecteur de catégories — indicateur CSS au lieu de layoutId */}
      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Catégories d'astuces">
        {categories.map(cat => {
          const isActive = category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Afficher les astuces ${cat.label}`}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors active:scale-95 ${
                isActive
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <cat.icon size={18} />
              {cat.label}
              {/* Indicateur actif : bordure CSS simple */}
              {isActive && (
                <span className="absolute inset-0 rounded-full border-2 border-white/30 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Gestion des erreurs */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <p className="text-red-400 text-center max-w-md">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-colors shadow-lg active:scale-95"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="text-slate-400 text-lg">Chargement des astuces…</span>
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-amber-400" />
          </div>
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
              <div
                key={tipId}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-violet-500/30 transition-colors"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => toggleExpand(tipId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(tipId);
                    }
                  }}
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
                        {isExpanded
                          ? formatted.text
                          : formatted.text.substring(0, 120) + (formatted.text.length > 120 ? '...' : '')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-white mt-1 transition-colors shrink-0"
                      tabIndex={-1}
                      aria-label={isExpanded ? 'Réduire' : 'Développer'}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Section action — rendu conditionnel simple (plus d'AnimatePresence) */}
                {isExpanded && formatted.action && (
                  <div className="px-5 pb-5">
                    <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2">
                      <Zap size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-300 leading-relaxed">{formatted.action}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tips;