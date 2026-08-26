import { useState, useEffect } from 'react';
import { Play, Clock, Loader, HelpCircle, BookOpen } from 'lucide-react';
import api from '../../services/api';
import QuizGame from '../../components/student/QuizGame';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, chapterRes] = await Promise.all([
          api.get('/quizzes/available'),
          api.get('/student/quiz-chapters')   // 🔥 nouvelle route backend
        ]);
        setQuizzes(quizRes.data);
        setChapters(chapterRes.data);
        setLoadError(null);
      } catch (err) {
        console.error(err);
        setLoadError('Impossible de charger les quiz. Vérifiez votre abonnement.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrer les quiz par chapitre sélectionné
  const filteredQuizzes = selectedChapter === 'all'
    ? quizzes
    : quizzes.filter(q => q.chapter_id == selectedChapter);

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Quiz disponibles</h1>

      {/* Filtre par chapitre */}
      {chapters.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedChapter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedChapter === 'all'
                ? 'bg-violet-600/20 border border-violet-400/30 text-violet-200'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            Tous
          </button>
          {chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapter(ch.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedChapter == ch.id
                  ? 'bg-violet-600/20 border border-violet-400/30 text-violet-200'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {ch.title}
            </button>
          ))}
        </div>
      )}

      {/* Liste des quiz */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
          <HelpCircle size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucun quiz pour ce chapitre.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuizzes.map(q => (
            <div
              key={q.id}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer"
              onClick={() => setActiveQuiz(q.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <HelpCircle size={20} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{q.title}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <BookOpen size={14} /> {q.chapter_title || 'Chapitre général'}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                    <Clock size={14} /> {Math.floor(q.time_limit / 60)} min
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all shadow-md self-start sm:self-center">
                <Play size={18} /> Jouer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;