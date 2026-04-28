import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { Timer } from 'lucide-react';

const QuizGame = ({ quizId, onBack }) => {
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [timeLimit, setTimeLimit] = useState(600);
  const [timeLeft, setTimeLeft] = useState(600);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.post(`/quizzes/${quizId}/start`).then(res => {
      setAttemptId(res.data.attempt_id);
      setQuestions(res.data.questions);
      setTimeLimit(res.data.time_limit);
      setTimeLeft(res.data.time_limit);
    }).catch(console.error);
    return () => clearInterval(timerRef.current);
  }, [quizId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions]);

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const ansArray = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId: parseInt(questionId), selectedOption }));
    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, { attempt_id: attemptId, answers: ansArray, time_spent: timeLimit - timeLeft });
      setScore(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (submitted) return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Résultat</h2>
      <p className="text-4xl font-bold text-blue-600">{score?.score} / {score?.total}</p>
      <p className="text-slate-500">{score?.percentage}% de réussite</p>
      <Button onClick={onBack}>Retour aux quiz</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz en cours</h2>
        <div className="flex items-center gap-2 text-xl font-mono"><Timer /> {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
      </div>
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <p className="font-medium mb-3">{idx+1}. {q.text}</p>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <label key={optIdx} className={`flex items-center p-3 rounded-lg cursor-pointer border ${answers[q.id] === optIdx ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === optIdx} onChange={() => selectAnswer(q.id, optIdx)} className="mr-2" />
                  {opt}
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Button onClick={handleSubmit} className="w-full py-4">Terminer le quiz</Button>
    </div>
  );
};

export default QuizGame;