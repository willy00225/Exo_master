import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Clock, Loader, HelpCircle, BookOpen, Search,
  Filter, ChevronLeft, ChevronRight, RotateCcw, X,
  BookMarked, GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import QuizGame from '../../components/student/QuizGame';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const difficultyOrder = {
  easy: 0,
  medium: 1,
  hard: 2,
  very_hard: 3,
};

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);

  // État de la vue : 'chapters' (par défaut) ou 'global'
  const [viewMode, setViewMode] = useState('chapters');

  // Filtres
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/quizzes/available');
        setQuizzes(res.data);
        setLoadError(null);
      } catch (err) {
        console.error(err);
        setLoadError("Impossible de charger les quiz. Vérifiez votre abonnement.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Réinitialiser la pagination et les filtres lors du changement de vue
  const switchView = (mode) => {
    setViewMode(mode);
    setPage(1);
    setSearchTerm('');
    setSelectedDifficulty('all');
    setSelectedChapter('all');
    setSelectedSubject('all');
  };

  // Extraire les matières uniques (tous les quiz)
  const subjects = useMemo(() => {
    const set = new Set(quizzes.map(q => q.subject).filter(Boolean));
    return Array.from(set).sort();
  }, [quizzes]);

  // Chapitres disponibles pour la vue "chapters" selon la matière sélectionnée
  const chapters = useMemo(() => {
    if (viewMode !== 'chapters' || selectedSubject === 'all') return [];
    const filtered = quizzes.filter(q => q.chapter_id && q.subject === selectedSubject);
    const map = new Map();
    filtered.forEach(q => {
      map.set(q.chapter_id, q.chapter_title || `Chapitre ${q.chapter_id}`);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [quizzes, selectedSubject, viewMode]);

  // Quiz à afficher selon le mode et les filtres
  const filteredQuizzes = useMemo(() => {
    let result = [...quizzes];

    // Filtrer par type de quiz
    result = viewMode === 'chapters'
      ? result.filter(q => q.chapter_id !== null)
      : result.filter(q => q.chapter_id === null);

    // Filtres communs
    if (selectedSubject !== 'all') {
      result = result.filter(q => q.subject === selectedSubject);
    }

    if (selectedDifficulty !== 'all') {
      result = result.filter(q => q.difficulty_filter === selectedDifficulty);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.title.toLowerCase().includes(term) ||
        (q.chapter_title && q.chapter_title.toLowerCase().includes(term))
      );
    }

    // Pour la vue chapitres, on peut filtrer par chapitre spécifique
    if (viewMode === 'chapters' && selectedChapter !== 'all') {
      result = result.filter(q => q.chapter_id == selectedChapter);
    }

    // 🔥 Tri pédagogique : du plus facile au plus difficile, puis par titre
    result.sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty_filter] ?? 0;
      const diffB = difficultyOrder[b.difficulty_filter] ?? 0;
      if (diffA !== diffB) return diffA - diffB;
      return (a.title || '').localeCompare(b.title || '');
    });

    return result;
  }, [quizzes, viewMode, selectedSubject, selectedChapter, selectedDifficulty, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE);
  const currentPageQuizzes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredQuizzes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuizzes, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedSubject, selectedChapter, selectedDifficulty, searchTerm, viewMode]);

  const resetFilters = () => {
    setSelectedSubject('all');
    setSelectedChapter('all');
    setSelectedDifficulty('all');
    setSearchTerm('');
    setPage(1);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-12 text-white">
        <p className="text-red-400">{loadError}</p>
      </div>
    );
  }

  if (activeQuiz) {
    if (!quizzes.find(q => q.id === activeQuiz)) {
      return (
        <div className="flex items-center justify-center py-12 text-white">
          <p>Quiz introuvable. Veuillez revenir à la liste.</p>
          <button onClick={() => setActiveQuiz(null)} className="text-blue-400 underline ml-2">Retour</button>
        </div>
      );
    }
    return <QuizGame quizId={activeQuiz} onBack={() => setActiveQuiz(null)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-white">
        <Loader className="animate-spin text-violet-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Quiz disponibles</h1>
        <p className="text-slate-400 mt-1">
          {viewMode === 'chapters'
            ? "Validez un chapitre avec un score ≥ 70 % pour débloquer le niveau suivant."
            : "Révisez librement avec les quiz globaux de votre classe."}
        </p>
      </motion.div>

      {/* Bouton bascule vers quiz globaux / retour */}
      <div className="flex justify-end">
        <button
          onClick={() => switchView(viewMode === 'chapters' ? 'global' : 'chapters')}
          className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 bg-violet-500/10 px-4 py-2 rounded-lg transition-colors"
        >
          {viewMode === 'chapters' ? (
            <>
              <BookMarked size={16} />
              Réviser avec les quiz globaux
            </>
          ) : (
            <>
              <GraduationCap size={16} />
              Revenir aux quiz par chapitre
            </>
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Matière */}
          <div className="relative">
            <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter('all'); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">Toutes les matières</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-[-90deg]" size={16} />
          </div>

          {/* Chapitre (uniquement en vue chapitres et si une matière est choisie) */}
          {viewMode === 'chapters' && (
            <div className="relative">
              <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                disabled={selectedSubject === 'all' || chapters.length === 0}
              >
                <option value="all">
                  {selectedSubject === 'all' ? 'Choisissez d\'abord une matière' : 'Tous les chapitres'}
                </option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-[-90deg]" size={16} />
            </div>
          )}

          {/* Difficulté */}
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">Toutes les difficultés</option>
              {Object.entries(difficultyLabels).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-[-90deg]" size={16} />
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des quiz */}
      <AnimatePresence>
        {currentPageQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center"
          >
            <HelpCircle size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">
              {viewMode === 'chapters'
                ? "Aucun quiz de chapitre trouvé avec ces critères."
                : "Aucun quiz global trouvé pour le moment."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {currentPageQuizzes.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer"
                onClick={() => setActiveQuiz(q.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <HelpCircle size={20} className="text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{q.title}</h3>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <BookOpen size={14} /> {q.chapter_title || 'Révision générale'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${difficultyLabels[q.difficulty_filter]?.color}`}>
                        {difficultyLabels[q.difficulty_filter]?.label}
                      </span>
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock size={14} /> {Math.floor(q.time_limit / 60)} min
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md self-start sm:self-center shrink-0">
                  <Play size={18} /> Jouer
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-slate-400 text-sm">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Quizzes;