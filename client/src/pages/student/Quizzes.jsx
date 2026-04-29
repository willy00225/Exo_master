import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, BookOpen, Loader, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import QuizGame from '../../components/student/QuizGame';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);

  useEffect(() => {
    api.get('/quizzes/available')
      .then(res => setQuizzes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Si un quiz est actif, on affiche le composant de jeu
  if (activeQuiz) return <QuizGame quizId={activeQuiz} onBack={() => setActiveQuiz(null)} />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white font-space-grotesk">Quiz disponibles</h1>
        <p className="text-slate-400 mt-1">Testez vos connaissances avec des quiz chronométrés</p>
      </motion.div>

      {/* État de chargement */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400 text-lg">Chargement des quiz…</span>
        </div>
      ) : quizzes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center"
        >
          <HelpCircle size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucun quiz disponible pour le moment.</p>
          <p className="text-slate-500 text-sm mt-2">Revenez plus tard ou contactez votre professeur.</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer"
              onClick={() => setActiveQuiz(q.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <HelpCircle size={20} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{q.title}</h3>
                  <p className="text-sm text-slate-400">{q.group_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={14} /> {Math.floor(q.time_limit / 60)} min
                    </span>
                    {q.chapter_title && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <BookOpen size={14} /> {q.chapter_title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md self-start sm:self-center"
              >
                <Play size={18} /> Jouer
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;