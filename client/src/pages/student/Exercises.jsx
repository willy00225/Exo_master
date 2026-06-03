import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader, FileText, BookOpen, ChevronRight, Filter } from 'lucide-react';
import api from '../../services/api';

const difficultyLabels = {
  easy: { label: 'Facile', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  medium: { label: 'Moyen', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  very_hard: { label: 'Très difficile', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
};

const Exercises = () => {
  const [data, setData] = useState({ groups: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null); // id de la matière active

  useEffect(() => {
    api.get('/exercises/student/available')
      .then(res => {
        setData(res.data);
        if (res.data.subjects.length > 0) {
          setActiveSubject(res.data.subjects[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <p className="text-slate-400 mt-1">Organisés par matière</p>
      </motion.div>

      {/* Onglets des matières */}
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

      {/* Contenu de la matière active */}
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
            currentSubject.chapters.map((chapter, idx) => (
              <motion.div
                key={chapter.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <h3 className="text-lg font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <ChevronRight size={16} className="text-violet-400" />
                  {chapter.title}
                </h3>
                <div className="space-y-3">
                  {chapter.exercises.map(ex => (
                    <ExerciseItem key={ex.id} ex={ex} apiBaseURL={api.defaults.baseURL} />
                  ))}
                </div>
              </motion.div>
            ))
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

// Composant ExerciseItem (identique à celui déjà présent, je l'inclus pour compacité)
const ExerciseItem = ({ ex, apiBaseURL }) => {
  const [showContent, setShowContent] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [canViewCorrection, setCanViewCorrection] = useState(false);
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

        <div className="flex gap-2">
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
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-cyan-700 transition-all self-end sm:self-center"
            >
              <Download size={16} /> Télécharger
            </a>
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