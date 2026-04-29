import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Filter, Loader } from 'lucide-react';
import api from '../../services/api';

const Exercises = () => {
  const [data, setData] = useState({ groups: [], exercises: [] });
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');

  useEffect(() => {
    api
      .get('/exercises/student/available')
      .then((res) => {
        const payload = res.data;
        // Normaliser la réponse pour s'assurer qu'on a bien groups et exercises
        if (Array.isArray(payload)) {
          // L'API a renvoyé directement un tableau d'exercices
          setData({ groups: [], exercises: payload });
        } else if (
          payload &&
          typeof payload === 'object' &&
          Array.isArray(payload.exercises)
        ) {
          setData({
            groups: payload.groups || [],
            exercises: payload.exercises,
          });
        } else {
          // Format inconnu, on initialise à vide
          setData({ groups: [], exercises: [] });
        }
      })
      .catch((err) => {
        console.error(err);
        setData({ groups: [], exercises: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtrage sécurisé
  const filtered = filterGroup
    ? (data.exercises || []).filter((ex) => ex.group_id == filterGroup)
    : data.exercises || [];

  const difficultyStyle = (d) => {
    const map = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      very_hard: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return map[d] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">
          Exercices
        </h1>
        <p className="text-slate-400 mt-1">
          Exercices disponibles pour votre groupe
        </p>
      </motion.div>

      {/* Filtre */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-4">
        <Filter className="text-slate-400" size={20} />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="bg-transparent border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Tous les groupes</option>
          {data.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chargement / résultat */}
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
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <div>
                <h3 className="font-semibold text-white">{ex.title}</h3>
                <p className="text-sm text-slate-400">{ex.group_name}</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${difficultyStyle(
                    ex.difficulty
                  )}`}
                >
                  {ex.difficulty}
                </span>
              </div>
              {ex.file_path ? (
                <a
                  href={`http://localhost:5000/api/exercises/file/${ex.file_path
                    .split('/')
                    .pop()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all"
                >
                  <Download size={16} />
                  Télécharger
                </a>
              ) : (
                <span className="text-slate-500 italic text-sm">
                  Aucun fichier
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exercises;