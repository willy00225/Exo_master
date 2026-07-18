import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader, FileText, BookOpen, ChevronRight, Filter, Unlock, Lock, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const Exercises = () => {
  const [data, setData] = useState({ groups: [], subjects: [] });
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, progRes] = await Promise.all([
          api.get('/exercises/student/available'),
          api.get('/student/difficulty-progress'),
        ]);
        setData(exRes.data);
        setProgress(progRes.data);
        if (exRes.data.subjects.length > 0) {
          setActiveSubject(exRes.data.subjects[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUnlock = async (chapterId) => {
    try {
      const res = await api.post('/student/check-unlock', { chapter_id: chapterId });
      if (res.data.unlocked) {
        const [progRes, exRes] = await Promise.all([
          api.get('/student/difficulty-progress'),
          api.get('/exercises/student/available'),
        ]);
        setProgress(progRes.data);
        setData(exRes.data);
      } else {
        alert("Vous devez réussir un quiz de la difficulté actuelle avec au moins 70 % pour passer à la suite.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la vérification. Réessayez plus tard.");
    }
  };

  const getFilteredExercises = (chapter) => {
    const prog = progress.find(p => p.chapter_id === chapter.id);
    const currentDiff = prog ? prog.current_difficulty : 'easy';
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

  const currentSubject = data.subjects.find(s => s.id === activeSubject);
  const subjects = data.subjects;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Exercices</h1>
        <p className="text-slate-400 mt-1">Progression adaptative – Validez un niveau pour débloquer le suivant</p>
      </motion.div>

      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {subjects.map(subject => (
            <button
              key={subject.id || 'none'}
              onClick={() => setActiveSubject(subject.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeSubject === subject.id
                  ? 'bg-violet-600/20 border border-violet-400/30 text-violet-200 shadow-lg'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <BookOpen size={16} />
              {subject.name}
            </button>
          ))}
        </div>
      )}

      {currentSubject && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="text-violet-400" size={24} />
            {currentSubject.name}
          </h2>
          {currentSubject.chapters.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              Aucun exercice dans cette matière pour le moment.
            </div>
          ) : (
            currentSubject.chapters.map((chapter, idx) => {
              const filtered = getFilteredExercises(chapter);
              const prog = progress.find(p => p.chapter_id === chapter.id);
              const currentDiff = prog ? prog.current_difficulty : 'easy';

              return (
                <motion.div
                  key={chapter.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                      <ChevronRight size={16} className="text-violet-400" />
                      {chapter.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        {currentDiff === 'very_hard' ? '🏆 Maîtrise' : `Niveau : ${currentDiff}`}
                      </span>
                      {currentDiff !== 'very_hard' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUnlock(chapter.id)}
                            className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg"
                            title="Débloquez ce niveau en réussissant un quiz avec 70 %"
                          >
                            <Unlock size={14} /> Passer à la suite
                          </button>
                          <span className="text-xs text-slate-500 cursor-help" title="Pour débloquer le niveau suivant, vous devez obtenir au moins 70 % à un quiz de ce chapitre.">
                            <Info size={14} />
                          </span>
                        </div>
                      )}
                      {/* Lien rapide vers les quiz du chapitre */}
                      <Link
                        to={`/student/quizzes?chapter=${chapter.id}`}
                        className="text-xs text-violet-400 hover:underline ml-2"
                      >
                        Quiz disponibles
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filtered.length === 0 ? (
                      <p className="text-slate-500 italic bg-white/5 border border-white/10 rounded-2xl p-4">
                        Aucun exercice pour ce niveau. Passez à la suite ou revenez plus tard.
                      </p>
                    ) : (
                      filtered.map(ex => (
                        <ExerciseItem key={ex.id} ex={ex} apiBaseURL={api.defaults.baseURL} />
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {subjects.length === 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          Aucun exercice disponible pour le moment.
        </div>
      )}
    </div>
  );
};

// Composant ExerciseItem (inchangé – déjà complet avec la validation par corrigé)
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
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 whitespace-pre-wrap">{ex.content}</div>
      )}

      {showCorrection && ex.correction && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-slate-300 whitespace-pre-wrap">{ex.correction}</div>
      )}
    </motion.div>
  );
};

export default Exercises;