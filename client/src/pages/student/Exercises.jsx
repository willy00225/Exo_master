import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Loader, FileText } from 'lucide-react';
import api from '../../services/api';

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

  // Filtrer les chapitres par groupe sélectionné
  const filteredChapters = filterGroup
    ? data.chapters.filter(ch => ch.group_id == filterGroup)
    : data.chapters;

  const difficultyStyle = (d) => ({
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    very_hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[d] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

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

      {/* Filtre par groupe */}
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

      {/* Affichage par chapitre */}
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
                <motion.div
                  key={ex.id}
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

                    {ex.file_path && (
                      <a
                        href={`${api.defaults.baseURL}/exercises/file/${ex.file_path.split('/').pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-cyan-700 transition-all self-end sm:self-center"
                      >
                        <Download size={16} />
                        Télécharger
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

export default Exercises;