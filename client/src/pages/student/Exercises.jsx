import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Loader, Eye, EyeOff, Clock } from 'lucide-react';
import api from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Petit composant pour chaque exercice (correction chronométrée)    */
/* ------------------------------------------------------------------ */
const ExerciseCard = ({ exercise, difficultyStyle }) => {
  const [correctionVisible, setCorrectionVisible] = useState(false);
  const [canViewCorrection, setCanViewCorrection] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Démarrer la tentative et surveiller le statut
  useEffect(() => {
    let interval;
    const startAttempt = async () => {
      try {
        await api.post(`/exercises/${exercise.id}/start-attempt`);
        const checkStatus = async () => {
          const res = await api.get(`/exercises/${exercise.id}/correction-status`);
          if (res.data.canView) {
            setCanViewCorrection(true);
            clearInterval(interval);
          } else {
            setRemaining(res.data.remainingSeconds);
          }
        };
        await checkStatus();
        interval = setInterval(checkStatus, 10000);
      } catch (err) {
        console.error(err);
      }
    };
    startAttempt();
    return () => clearInterval(interval);
  }, [exercise.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{exercise.title}</h3>
          <p className="text-sm text-slate-400">{exercise.group_name}</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${difficultyStyle(exercise.difficulty)}`}>
            {exercise.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {exercise.file_path && (
            <a
              href={`${api.defaults.baseURL}/exercises/file/${exercise.file_path.split('/').pop()}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-cyan-700 transition-all"
            >
              <Download size={16} />
              Télécharger
            </a>
          )}

          {/* Bouton Corrigé / Chronomètre */}
          {exercise.correction && (
            canViewCorrection ? (
              <button
                onClick={() => setCorrectionVisible(!correctionVisible)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                {correctionVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                {correctionVisible ? 'Cacher' : 'Corrigé'}
              </button>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-400 bg-slate-500/10 px-3 py-1.5 rounded-lg">
                <Clock size={14} />
                {Math.ceil(remaining / 60)} min
              </span>
            )
          )}
        </div>
      </div>

      {/* Zone du corrigé */}
      {correctionVisible && exercise.correction && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-100 whitespace-pre-wrap"
        >
          {exercise.correction}
        </motion.div>
      )}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*                  Composant principal Exercises                     */
/* ------------------------------------------------------------------ */
const Exercises = () => {
  const [data, setData] = useState({ groups: [], exercises: [] });
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    api.get('/exercises/student/available')
      .then((res) => {
        const payload = res.data;
        if (Array.isArray(payload)) {
          setData({ groups: [], exercises: payload });
        } else if (payload && typeof payload === 'object' && Array.isArray(payload.exercises)) {
          setData({ groups: payload.groups || [], exercises: payload.exercises });
        } else {
          setData({ groups: [], exercises: [] });
        }
      })
      .catch((err) => {
        console.error(err);
        setData({ groups: [], exercises: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterGroup
    ? (data.exercises || []).filter((ex) => ex.group_id == filterGroup)
    : data.exercises || [];

  const difficultyStyle = (d) => ({
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    very_hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[d] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400 text-lg">Chargement…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center text-slate-400">
          Aucun exercice trouvé.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} difficultyStyle={difficultyStyle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Exercises;