import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { Timer, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const QuizGame = ({ quizId, onBack }) => {
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [timeLimit, setTimeLimit] = useState(600);
  const [timeLeft, setTimeLeft] = useState(600);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { score, total, percentage, corrections }
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
    const ansArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId: parseInt(questionId),
      selectedOption,
    }));
    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, {
        attempt_id: attemptId,
        answers: ansArray,
        time_spent: timeLimit - timeLeft,
      });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Thème sombre pour les options
  const optionClass = (qId, optIdx) =>
    `flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
      answers[qId] === optIdx
        ? 'border-violet-400 bg-violet-500/20 text-white'
        : 'border-white/10 text-slate-300 hover:bg-white/10'
    }`;

  if (submitted && result) {
    return (
      <div className="space-y-6 text-white">
        <div className="text-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold">Résultat</h2>
          <p className="text-5xl font-bold text-violet-400">{result.score} / {result.total}</p>
          <p className="text-lg text-slate-400">{result.percentage}% de réussite</p>
        </div>

        <h3 className="text-xl font-semibold">Corrigé</h3>
        <div className="space-y-4">
          {result.corrections.map((corr, idx) => (
            <div key={corr.questionId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className={`mt-1 p-1 rounded-full ${corr.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {corr.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </span>
                <div>
                  <p className="font-medium">{idx + 1}. {corr.text}</p>
                  <div className="mt-2 space-y-1">
                    {corr.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`p-2 rounded-lg text-sm ${
                        optIdx === corr.correctOption
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : optIdx === corr.selectedOption && optIdx !== corr.correctOption
                          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                          : 'text-slate-400'
                      }`}>
                        {opt} {optIdx === corr.correctOption && '✓'}
                      </div>
                    ))}
                  </div>
                  {corr.explanation && (
                    <p className="mt-2 text-sm text-slate-400 italic">{corr.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onBack} className="w-full py-4">
          <ArrowLeft size={16} /> Retour aux quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white font-space-grotesk">Quiz en cours</h2>
        <div className={`flex items-center gap-2 text-xl font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-violet-400'}`}>
          <Timer size={20} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 md:p-6"
          >
            <p className="font-medium text-white text-lg mb-4">
              {idx + 1}. {q.text}
            </p>
            <div className="space-y-3">
              {q.options.map((opt, optIdx) => (
                <label
                  key={optIdx}
                  className={optionClass(q.id, optIdx)}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === optIdx}
                    onChange={() => selectAnswer(q.id, optIdx)}
                    className="mr-3 accent-violet-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={handleSubmit} className="w-full py-4 text-lg">
        Terminer le quiz
      </Button>
    </div>
  );
};

export default QuizGame;