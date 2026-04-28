import { useState, useEffect } from 'react';
import { Play, Clock } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import QuizGame from '../../components/student/QuizGame';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);

  useEffect(() => {
    api.get('/quizzes/available').then(res => setQuizzes(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (activeQuiz) return <QuizGame quizId={activeQuiz} onBack={() => setActiveQuiz(null)} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quiz disponibles</h1>
      {loading ? <p>Chargement...</p> : quizzes.length === 0 ? <p>Aucun quiz.</p> : (
        <div className="grid gap-4">
          {quizzes.map(q => (
            <Card key={q.id} className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="text-sm text-slate-500">{q.group_name}</p>
                <div className="flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> {Math.floor(q.time_limit/60)} min</div>
              </div>
              <Button onClick={() => setActiveQuiz(q.id)}><Play size={16} /> Jouer</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;