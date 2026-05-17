import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
      setScore(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Thème sombre pour les options
  const optionClass = (qId, optIdx) =>
    `flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
      answers[qId] === optIdx
        ? 'border-violet-500 bg-violet-500/20 text-white'
        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
    }`;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-white font-space-grotesk">Résultat</h2>
        <p className="text-5xl font-bold text-violet-400">{score?.score} / {score?.total}</p>
        <p className="text-slate-400 text-lg">{score?.percentage}% de réussite</p>
        <Button onClick={onBack} className="mt-4">Retour aux quiz</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white font-space-grotesk">Quiz en cours</h2>
        <div className="flex items-center gap-2 text-xl font-mono text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5">
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