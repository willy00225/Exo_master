import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader, FileText, BookOpen, ChevronRight, Filter,
  Unlock, Lock, CheckCircle, Info, Search, ArrowRight, AlertTriangle,
  ChevronLeft, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// ------------------------------------------------------------------
// 🧮 Formatage mathématique (exposants, indices, racines)
// ------------------------------------------------------------------
const formatMathText = (text) => {
  if (!text) return '';
  return text
    .replace(/\^(\d+)/g, '<sup>$1</sup>')           // x^2 → x²
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')     // x^{2} → x²
    .replace(/_\{(\d+)\}/g, '<sub>$1</sub>')        // H_{2}O → H₂O
    .replace(/sqrt\{([^}]+)\}/g, '√($1)')           // sqrt{...} → √(...)
    .replace(/\b(sqrt)\b/g, '√');                   // sqrt → √
};

// ------------------------------------------------------------------
// 🎨 Labels de difficulté
// ------------------------------------------------------------------
const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

// ------------------------------------------------------------------
// 🧩 Composant ExerciseItem (version complète)
// ------------------------------------------------------------------
const ExerciseItem = ({ ex, apiBaseURL }) => {
  const [showContent, setShowContent] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [canViewCorrection, setCanViewCorrection] = useState(false);
  const [attemptCompleted, setAttemptCompleted] = useState(false);
  const timerRef = useRef(null);

  const requiredMinutes = { easy: 5, medium: 10, hard: 15, very_hard: 20 }[ex.difficulty] || 10;
  const requiredSeconds = requiredMinutes * 60;

  const startAttempt = async () => {
    try { await api.post(`/exercises/${ex.id}/start-attempt`); } catch (err) { console.error(err); }
    setAttemptStarted(true);
    setRemainingSeconds(requiredSeconds);
  };

  useEffect(() => {
    if (!attemptStarted || remainingSeconds <= 0) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanViewCorrection(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [attemptStarted, remainingSeconds]);

  useEffect(() => {
    if (canViewCorrection && !attemptCompleted) {
      api.post(`/exercises/${ex.id}/complete`).catch(console.error);
      setAttemptCompleted(true);
    }
  }, [canViewCorrection, attemptCompleted, ex.id]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}min ${sec}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{ex.title}</h3>
          <p className="text-sm text-slate-400">{ex.group_name}</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${difficultyLabels[ex.difficulty]?.color}`}>
            {difficultyLabels[ex.difficulty]?.label}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {ex.content && (
            <button onClick={() => setShowContent(!showContent)} className="text-blue-400 hover:underline text-sm">
              {showContent ? 'Cacher l’énoncé' : 'Voir l’énoncé'}
            </button>
          )}

          {ex.correction && !attemptStarted && (
            <button onClick={startAttempt} className="text-emerald-400 hover:underline text-sm">
              Commencer l’exercice
            </button>
          )}

          {ex.correction && attemptStarted && !canViewCorrection && (
            <span className="text-amber-400 text-sm">Corrigé dans {formatTime(remainingSeconds)}</span>
          )}

          {ex.correction && canViewCorrection && (
            <button onClick={() => setShowCorrection(!showCorrection)} className="text-emerald-400 hover:underline text-sm">
              {showCorrection ? 'Cacher le corrigé' : 'Voir le corrigé'}
            </button>
          )}

          {ex.file_path && (
            <a
              href={`${apiBaseURL}/exercises/file/${ex.file_path.split('/').pop()}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-cyan-700 transition-all"
            >
              <Download size={16} /> Télécharger
            </a>
          )}

          {attemptCompleted && (
            <span className="text-emerald-400 ml-2"><CheckCircle size={18} /></span>
          )}
        </div>
      </div>

      {showContent && ex.content && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 whitespace-pre-wrap"
             dangerouslySetInnerHTML={{ __html: formatMathText(ex.content) }} />
      )}

      {showCorrection && ex.correction && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-slate-300 whitespace-pre-wrap"
             dangerouslySetInnerHTML={{ __html: formatMathText(ex.correction) }} />
      )}
    </motion.div>
  );
};

// ------------------------------------------------------------------
// 🧠 Composant principal
// ------------------------------------------------------------------
const Exercises = () => {
  const [data, setData] = useState({ groups: [], subjects: [] });
  const [progress, setProgress] = useState([]);
  const [chaptersProgress, setChaptersProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [searchChapter, setSearchChapter] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [message, setMessage] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Chargement initial (groupes / matières)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/exercises/student/available');
        setData(res.data);
        if (res.data.subjects.length > 0) {
          const firstSubject = res.data.subjects[0];
          setActiveSubject(firstSubject.id);
          if (firstSubject.chapters?.length > 0) {
            const firstChapter = firstSubject.chapters[0];
            const groupId = firstChapter.exercises?.[0]?.group_id || null;
            setActiveGroupId(groupId);
          }
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Impossible de charger les matières.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Chargement de la progression détaillée
  useEffect(() => {
    if (!activeSubject || !activeGroupId) return;
    const fetchChaptersProgress = async () => {
      setChaptersLoading(true);
      try {
        const res = await api.get(
          `/student/chapters-progress?group_id=${activeGroupId}&subject_id=${activeSubject}`
        );
        setChaptersProgress(res.data);
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Erreur lors du chargement de la progression.' });
      } finally {
        setChaptersLoading(false);
      }
    };
    fetchChaptersProgress();
  }, [activeSubject, activeGroupId]);

  // Changement de matière
  const handleSubjectChange = (subjectId) => {
    setActiveSubject(subjectId);
    setSelectedChapter(null);
    setSearchChapter('');
    setMessage(null);
    const subject = data.subjects.find(s => s.id === subjectId);
    if (subject?.chapters?.length > 0 && subject.chapters[0].exercises?.length > 0) {
      setActiveGroupId(subject.chapters[0].exercises[0].group_id);
    } else {
      setActiveGroupId(null);
    }
  };

  // Recherche & sélection d'un chapitre
  const handleChapterSearch = (e) => {
    e.preventDefault();
    setMessage(null);
    const term = searchChapter.trim().toLowerCase();
    if (!term) return;

    const found = chaptersProgress.find(ch =>
      ch.title.toLowerCase().includes(term)
    );
    if (!found) {
      setMessage({ type: 'error', text: 'Aucun chapitre trouvé avec ce nom.' });
      setSelectedChapter(null);
      return;
    }
    selectChapterIfUnlocked(found);
  };

  const handleChapterClick = (chapter) => {
    setSearchChapter('');
    selectChapterIfUnlocked(chapter);
  };

  const selectChapterIfUnlocked = (chapter) => {
    const idx = chaptersProgress.findIndex(ch => ch.id === chapter.id);
    if (idx > 0) {
      const prev = chaptersProgress[idx - 1];
      if (!prev.is_completed) {
        setMessage({
          type: 'warning',
          text: `Vous n'avez pas encore terminé le chapitre "${prev.title}". ${prev.social_percent}% des élèves de votre niveau l'ont déjà terminé. Continuez vos efforts !`
        });
        setSelectedChapter(null);
        return;
      }
    }
    setMessage(null);
    setSelectedChapter(chapter);
  };

  // Déverrouillage manuel (passer à la suite)
  const handleUnlock = async (chapterId) => {
    try {
      const res = await api.post('/student/check-unlock', { chapter_id: chapterId });
      if (res.data.unlocked) {
        const [progRes, exRes] = await Promise.all([
          api.get(`/student/chapters-progress?group_id=${activeGroupId}&subject_id=${activeSubject}`),
          api.get('/exercises/student/available')
        ]);
        setChaptersProgress(progRes.data);
        setData(exRes.data);
        setMessage({ type: 'success', text: 'Niveau suivant débloqué !' });
      } else {
        setMessage({ type: 'warning', text: 'Vous devez réussir un quiz de ce chapitre avec au moins 70 % pour passer à la suite.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Impossible de débloquer le niveau suivant.' });
    }
  };

  // Récupération des exercices du chapitre selon la difficulté actuelle
  const getChapterExercises = (chapterId) => {
    const subject = data.subjects.find(s => s.id === activeSubject);
    if (!subject) return [];
    const chapter = subject.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return [];
    const progDetail = chaptersProgress.find(p => p.id === chapterId);
    const currentDiff = progDetail?.current_difficulty || 'easy';
    return chapter.exercises.filter(ex => ex.difficulty === currentDiff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
      </div>
    );
  }

  const subjects = data.subjects;
  const currentSubject = subjects.find(s => s.id === activeSubject);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Exercices</h1>
        <p className="text-slate-400 mt-1">
          Progression adaptative – Validez un niveau pour débloquer le suivant
        </p>
      </motion.div>

      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2" role="tablist">
          {subjects.map(subject => (
            <button
              key={subject.id || 'none'}
              onClick={() => handleSubjectChange(subject.id)}
              role="tab"
              aria-selected={activeSubject === subject.id}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSubject === subject.id
                  ? 'bg-violet-600/20 border border-violet-400/30 text-violet-200 shadow-lg shadow-violet-500/10'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen size={16} />
              {subject.name}
            </button>
          ))}
        </div>
      )}

      {currentSubject ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 space-y-5">
          <div>
            <p className="text-white text-lg font-medium">
              👋 Bonjour <span className="text-violet-400">{user?.name || 'élève'}</span>, on s’exerce dans quelle matière aujourd’hui ?
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Vous avez choisi : <span className="text-white font-semibold">{currentSubject.name}</span>
            </p>
          </div>

          <form onSubmit={handleChapterSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un chapitre par nom…"
                value={searchChapter}
                onChange={(e) => setSearchChapter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
              {searchChapter && (
                <button
                  type="button"
                  onClick={() => { setSearchChapter(''); setMessage(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Effacer la recherche"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl flex items-start gap-2 ${
                  message.type === 'error'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                    : message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                }`}
              >
                <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedChapter && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Chapitres disponibles
              </h3>
              {chaptersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-violet-400" size={24} />
                  <span className="ml-2 text-slate-400">Chargement des chapitres…</span>
                </div>
              ) : chaptersProgress.length === 0 ? (
                <p className="text-slate-500 italic bg-white/5 border border-white/10 rounded-xl p-4">
                  Aucun chapitre trouvé pour cette matière.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {chaptersProgress.map((ch, idx) => {
                    const isLocked = idx > 0 && !chaptersProgress[idx - 1].is_completed;
                    const isCompleted = ch.is_completed;
                    return (
                      <motion.button
                        key={ch.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChapterClick(ch)}
                        disabled={isLocked}
                        className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                          isLocked
                            ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                            : isCompleted
                            ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                            : 'bg-white/5 border-white/10 hover:border-violet-400/40 hover:bg-white/10'
                        }`}
                        aria-disabled={isLocked}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                            {ch.title}
                          </span>
                          {isCompleted ? (
                            <CheckCircle size={18} className="text-green-400" />
                          ) : isLocked ? (
                            <Lock size={18} className="text-slate-500" />
                          ) : (
                            <Unlock size={18} className="text-violet-400" />
                          )}
                        </div>
                        <div className="flex items-center text-xs text-slate-400 gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full"
                              style={{ width: `${ch.social_percent || 0}%` }}
                            />
                          </div>
                          <span>{ch.social_percent || 0}% social</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Aucune matière disponible pour le moment.
        </div>
      )}

      {/* Zone d'exercices du chapitre sélectionné */}
      <AnimatePresence>
        {selectedChapter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedChapter(null); setMessage(null); }}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors"
                aria-label="Retour à la liste des chapitres"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ChevronRight size={20} className="text-violet-400" />
                {selectedChapter.title}
              </h2>
            </div>

            <div className="space-y-3">
              {getChapterExercises(selectedChapter.id).map(ex => (
                <ExerciseItem key={ex.id} ex={ex} apiBaseURL={api.defaults.baseURL} />
              ))}
              {getChapterExercises(selectedChapter.id).length === 0 && (
                <p className="text-slate-500 italic bg-white/5 border border-white/10 rounded-2xl p-4">
                  Aucun exercice pour ce niveau. Passez à la suite ou revenez plus tard.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              {selectedChapter.current_difficulty !== 'very_hard' && (
                <button
                  onClick={() => handleUnlock(selectedChapter.id)}
                  className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Unlock size={14} /> Passer à la suite
                </button>
              )}
              <span
                className="text-xs text-slate-500 cursor-help flex items-center gap-1"
                title="Pour débloquer le niveau suivant, vous devez obtenir au moins 70 % à un quiz de ce chapitre."
              >
                <Info size={14} /> Comment débloquer ?
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Exercises;