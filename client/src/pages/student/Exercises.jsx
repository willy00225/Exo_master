import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Loader, FileText, CheckCircle } from 'lucide-react';
import api from '../../services/api';

// Style de badge de difficulté (utilisé dans le composant ExerciseItem)
const difficultyStyle = (d) => ({
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  very_hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}[d] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

// Composant pour un exercice individuel (avec chrono local)
const ExerciseItem = ({ ex, apiBaseURL }) => {
  const [showContent, setShowContent] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [canViewCorrection, setCanViewCorrection] = useState(false);
  const timerRef = useRef(null);

  // Délais selon la difficulté (en minutes)
  const requiredMinutes = {
    easy: 5,
    medium: 10,
    hard: 15,
    very_hard: 20,
  }[ex.difficulty] || 10;

  const requiredSeconds = requiredMinutes * 60;

  const startAttempt = async () => {
    try {
      await api.post(`/exercises/${ex.id}/start-attempt`);
    } catch (err) {
      console.error("Erreur lors de la création de la tentative :", err);
      // On continue même si la tentative échoue (l'essentiel est le chrono)
    }
    // Lancement du chrono local
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
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${difficultyStyle(ex.difficulty)}`}>
            {ex.difficulty}
          </span>
        </div>

        <div className="flex gap-2">
          {ex.content && (
            <button
              onClick={() => setShowContent(!showContent)}
              className="text-blue-400 hover:underline text-sm"
            >
              {showContent ? 'Cacher l’énoncé' : 'Voir l’énoncé'}
            </button>
          )}

          {ex.correction && !attemptStarted && (
            <button
              onClick={startAttempt}
              className="text-emerald-400 hover:underline text-sm"
            >
              Commencer l’exercice
            </button>
          )}

          {ex.correction && attemptStarted && !canViewCorrection && (
            <span className="text-amber-400 text-sm">
              Corrigé dans {formatTime(remainingSeconds)}
            </span>
          )}

          {ex.correction && canViewCorrection && (
            <button
              onClick={() => setShowCorrection(!showCorrection)}
              className="text-emerald-400 hover:underline text-sm"
            >
              {showCorrection ? 'Cacher le corrigé' : 'Voir le corrigé'}
            </button>
          )}

          {ex.file_path && (
            <a
              href={`${apiBaseURL}/exercises/file/${ex.file_path.split('/').pop()}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-cyan-700 transition-all self-end sm:self-center"
            >
              <Download size={16} />
              Télécharger
            </a>
          )}
        </div>
      </div>

      {/* Énoncé */}
      {showContent && ex.content && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 whitespace-pre-wrap">
          {ex.content}
        </div>
      )}

      {/* Corrigé structuré */}
      {showCorrection && ex.correction && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-slate-300">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400" /> Corrigé
          </h4>
          {/* Si le corrigé est du JSON (commence par {), on le formate */}
          {typeof ex.correction === 'string' && ex.correction.trim().startsWith('{') ? (
            (() => {
              try {
                const parsed = JSON.parse(ex.correction);
                return Object.entries(parsed).map(([step, desc]) => (
                  <p key={step} className="mb-2">
                    <span className="font-semibold text-emerald-300">{step} :</span>{' '}
                    <span className="text-slate-300">{desc}</span>
                  </p>
                ));
              } catch {
                return <p className="whitespace-pre-wrap">{ex.correction}</p>;
              }
            })()
          ) : (
            <p className="whitespace-pre-wrap">{ex.correction}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

const Exercises = () => {
  const [data, setData] = useState({ groups: [], chapters: [] });
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    api.get('/exercises/student/available')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredChapters = filterGroup
    ? data.chapters.filter(ch => ch.group_id == filterGroup)
    : data.chapters;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-violet-400" size={32} />
        <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Exercices</h1>
        <p className="text-slate-400 mt-1">Exercices disponibles pour votre groupe</p>
      </motion.div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-4">
        <Filter className="text-slate-400" size={20} />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="bg-transparent border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Tous les groupes</option>
          {data.groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {filteredChapters.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center text-slate-400">
          Aucun exercice trouvé.
        </div>
      ) : (
        filteredChapters.map((chapter, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="space-y-3"
          >
            <h2 className="text-xl font-semibold text-white">
              <FileText className="inline mr-2 h-5 w-5 text-violet-400" />
              {chapter.title}
            </h2>
            {chapter.exercises.length === 0 ? (
              <p className="text-slate-500 italic bg-white/5 border border-white/10 rounded-2xl p-4">
                Aucun exercice dans ce chapitre.
              </p>
            ) : (
              chapter.exercises.map((ex) => (
                <ExerciseItem key={ex.id} ex={ex} apiBaseURL={api.defaults.baseURL} />
              ))
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

export default Exercises;