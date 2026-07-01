import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { Timer, CheckCircle, XCircle, ArrowLeft, Trophy, Swords } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const formatExplanation = (text) => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  return lines.map((line, i) => {
    let className = "mb-1 leading-relaxed text-slate-300";
    if (/^(Étape\s?\d+|Etape\s?\d+|\d+\.|Phase \d+|Conclusion|En conclusion|Donc|Ainsi|Résultat final)/i.test(line)) {
      className += " font-semibold text-emerald-300 mt-2";
    }
    return <p key={i} className={className}>{line}</p>;
  });
};

// 🔥 Helper pour normaliser les options (toujours un tableau)
const normalizeOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') return options.split(' ').filter(Boolean);
  return [];
};

const QuizGame = ({ quizId, challengeId, onBack }) => {
  const { user } = useAuth();
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [timeLimit, setTimeLimit] = useState(600);
  const [timeLeft, setTimeLeft] = useState(600);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const timerRef = useRef(null);
  const handleSubmitRef = useRef(() => {});

  useEffect(() => {
    const startUrl = challengeId
      ? `/challenges/${challengeId}/start`
      : `/quizzes/${quizId}/start`;

    setInitialLoading(true);
    api.post(startUrl)
      .then(res => {
        const rawQuestions = res.data.questions || [];
        // Normaliser les options de chaque question
        const safeQuestions = rawQuestions.map(q => ({
          ...q,
          options: normalizeOptions(q.options),
        }));
        setAttemptId(res.data.attempt_id);
        setQuestions(safeQuestions);
        setTimeLimit(res.data.time_limit);
        setTimeLeft(res.data.time_limit);
        setInitialLoading(false);
      })
      .catch(err => {
        console.error(err);
        setInitialLoading(false);
      });

    return () => clearInterval(timerRef.current);
  }, [quizId, challengeId]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    clearInterval(timerRef.current);
    const ansArray = Object.entries(answers).map(([qId, opt]) => ({
      questionId: parseInt(qId),
      selectedOption: opt,
    }));
    const submitUrl = challengeId
      ? `/challenges/${challengeId}/submit`
      : `/quizzes/${quizId}/submit`;
    try {
      const res = await api.post(submitUrl, {
        attempt_id: attemptId,
        answers: ansArray,
        time_spent: timeLimit - timeLeft,
      });
      setResult(res.data);
      setSubmitted(true);

      if (challengeId && user) {
        try {
          const statusRes = await api.get(`/challenges/${challengeId}/status`);
          const status = statusRes.data;
          if (status.status === 'completed') {
            const isWinner = status.winner_id === user.id;
            const isDraw = !status.winner_id;
            setChallengeResult({ ...status, isWinner, isDraw });
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [answers, attemptId, timeLimit, timeLeft, quizId, challengeId, submitted, user]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (initialLoading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [initialLoading, quizId, challengeId]);

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const optionClass = (qId, optIdx) =>
    `flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
      answers[qId] === optIdx
        ? 'border-violet-400 bg-violet-500/20 text-white'
        : 'border-white/10 text-slate-300 hover:bg-white/10'
    }`;

  // Écran de chargement
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400"></div>
          <p>Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  // Résultats
  if (submitted && result) {
    const isChallenge = !!challengeId;
    const hasChallengeResult = challengeResult !== null;

    return (
      <div className="space-y-6 text-white">
        {isChallenge && hasChallengeResult && (
          <div className={`text-center p-6 rounded-2xl border ${
            challengeResult.isWinner ? 'bg-emerald-500/10 border-emerald-500/30' :
            challengeResult.isDraw ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-red-500/10 border-red-500/30'
          }`}>
            {challengeResult.isWinner ? (
              <>
                <Trophy size={48} className="mx-auto text-emerald-400 animate-bounce" />
                <h2 className="text-2xl font-bold mt-2 text-emerald-400">Victoire !</h2>
                <p className="text-slate-300">Vous avez gagné le duel !</p>
                <div className="flex justify-center gap-4 mt-3 text-lg">
                  <span className="text-emerald-400 font-bold">{challengeResult.challenger_score} pts</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-red-400 font-bold">{challengeResult.challenged_score} pts</span>
                </div>
              </>
            ) : challengeResult.isDraw ? (
              <>
                <Swords size={48} className="mx-auto text-amber-400 animate-pulse" />
                <h2 className="text-2xl font-bold mt-2 text-amber-400">Égalité</h2>
                <p className="text-slate-300">Aucun vainqueur !</p>
                <div className="flex justify-center gap-4 mt-3 text-lg">
                  <span className="text-amber-400 font-bold">{challengeResult.challenger_score} pts</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-amber-400 font-bold">{challengeResult.challenged_score} pts</span>
                </div>
              </>
            ) : (
              <>
                <XCircle size={48} className="mx-auto text-red-400 animate-shake" />
                <h2 className="text-2xl font-bold mt-2 text-red-400">Défaite</h2>
                <p className="text-slate-300">Vous avez perdu le duel...</p>
                <div className="flex justify-center gap-4 mt-3 text-lg">
                  <span className="text-red-400 font-bold">{challengeResult.challenger_score} pts</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-emerald-400 font-bold">{challengeResult.challenged_score} pts</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="text-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold">Résultat</h2>
          <p className="text-5xl font-bold text-violet-400">{result.score} / {result.total}</p>
          <p className="text-lg text-slate-400">{result.percentage}% de réussite</p>
        </div>

        <h3 className="text-xl font-semibold">Corrigé</h3>
        <div className="space-y-4">
          {result.corrections?.map((corr, idx) => (
            <div key={corr.questionId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className={`mt-1 p-1 rounded-full ${corr.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {corr.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </span>
                <div>
                  <p className="font-medium">{idx + 1}. {corr.text}</p>
                  <div className="mt-2 space-y-1">
                    {normalizeOptions(corr.options).map((opt, optIdx) => (
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
                    <div className="mt-2 text-sm italic border-t border-white/10 pt-2">
                      {formatExplanation(corr.explanation)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onBack} className="w-full py-4">
          <ArrowLeft size={16} /> Retour aux défis
        </Button>
      </div>
    );
  }

  // Quiz en cours (affiché uniquement après chargement réussi)
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
        {questions.length === 0 ? (
          <p className="text-slate-400">Aucune question disponible.</p>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 md:p-6">
              <p className="font-medium text-white text-lg mb-4">
                {idx + 1}. {q.text}
              </p>
              <div className="space-y-3">
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} className={optionClass(q.id, optIdx)}>
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
            </div>
          ))
        )}
      </div>

      <Button onClick={handleSubmit} className="w-full py-4 text-lg">
        Terminer le quiz
      </Button>
    </div>
  );
};

export default QuizGame;