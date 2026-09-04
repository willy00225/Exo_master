import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/common/Button';
import {
  Timer, CheckCircle, XCircle, ArrowLeft, Trophy, Swords,
  Send, MessageCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Formatage des explications (inchangé)
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

// Normalisation des options (inchangé)
const normalizeOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') return options.split(' ').filter(Boolean);
  return [];
};

// Formatage du temps relatif (inchangé)
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const msgTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - msgTime) / 1000);
  if (diffInSeconds < 5) return "à l'instant";
  if (diffInSeconds < 60) return `il y a ${diffInSeconds} sec`;
  if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
  return msgTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Composant TimerCirculaire
const CircularTimer = ({ timeLeft, totalTime }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);
  const color = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#f59e0b' : '#8b5cf6';

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#ffffff20" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-white">
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </div>
    </div>
  );
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
  const [loadError, setLoadError] = useState(null);
  const timerRef = useRef(null);
  const handleSubmitRef = useRef(() => {});

  // Nouveau state pour le mode une question à la fois
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  // États du chat (inchangés, mais on ajoute chatOpen)
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatPollingRef = useRef(null);
  const chatContainerRef = useRef(null);

  const isChallenge = !!challengeId;
  const MAX_MESSAGE_LENGTH = 500;

  // Chargement initial du quiz/challenge
  useEffect(() => {
    const startUrl = challengeId
      ? `/challenges/${challengeId}/start`
      : `/quizzes/${quizId}/start`;

    setInitialLoading(true);
    setLoadError(null);
    api.post(startUrl)
      .then(res => {
        const rawQuestions = res.data.questions || [];
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
        const msg = err.response?.data?.error || err.message || "Erreur lors du chargement du quiz.";
        setLoadError(msg);
        setInitialLoading(false);
      });

    return () => clearInterval(timerRef.current);
  }, [quizId, challengeId]);

  // Charger les messages avec polling intelligent (inchangé)
  useEffect(() => {
    if (!isChallenge) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/challenges/${challengeId}/messages`);
        const newMessages = res.data;
        if (lastReadMessageId && newMessages.length > 0) {
          const unread = newMessages.filter(msg =>
            msg.id > lastReadMessageId && msg.sender_id !== user?.id
          );
          if (unread.length > 0) {
            setUnreadCount(prev => prev + unread.length);
          }
        } else if (newMessages.length > 0) {
          setLastReadMessageId(newMessages[newMessages.length - 1].id);
        }
        setMessages(newMessages);
        setChatError(null);
        setRetryCount(0);
      } catch (err) {
        console.error(err);
        setRetryCount(prev => prev + 1);
        if (retryCount >= 3) {
          setChatError("Connexion instable. Tentative de reconnexion...");
          setTimeout(() => setRetryCount(0), 5000);
        } else {
          setChatError("Impossible de charger les messages. Nouvelle tentative...");
        }
      }
    };

    fetchMessages();
    chatPollingRef.current = setInterval(fetchMessages, 3000);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (chatPollingRef.current) clearInterval(chatPollingRef.current);
      } else {
        fetchMessages();
        chatPollingRef.current = setInterval(fetchMessages, 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [challengeId, isChallenge, lastReadMessageId, retryCount, user?.id]);

  // Auto-scroll et gestion du scroll (inchangé)
  useEffect(() => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, shouldAutoScroll]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldAutoScroll(isNearBottom);
      if (isNearBottom && messages.length > 0) {
        setUnreadCount(0);
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || sending) return;
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setChatError(`Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.`);
      return;
    }

    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      sender_name: user.name || 'Vous',
      message: trimmedMessage,
      created_at: new Date().toISOString(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);
    setChatError(null);
    setShouldAutoScroll(true);

    try {
      const res = await api.post(`/challenges/${challengeId}/messages`, { message: trimmedMessage });
      setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...res.data, sender_name: user.name || 'Vous' } : msg));
      setLastReadMessageId(res.data.id);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(trimmedMessage);
      setChatError("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Soumission du quiz (inchangé)
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

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-12 text-white">
        <div className="text-center space-y-4">
          <XCircle size={48} className="mx-auto text-red-400" />
          <p className="text-red-400 text-lg">{loadError}</p>
          <Button onClick={onBack}>Retour</Button>
        </div>
      </div>
    );
  }

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

  if (submitted && result) {
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

  return (
    <div className="space-y-6 text-white max-w-3xl mx-auto">
      {/* En-tête avec progression et timer */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <CircularTimer timeLeft={timeLeft} totalTime={timeLimit} />
      </div>

      {/* Question actuelle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
        >
          <p className="text-sm text-slate-400 mb-2">
            Question {currentIndex + 1} / {questions.length}
          </p>
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, optIdx) => (
              <button
                key={optIdx}
                onClick={() => selectAnswer(currentQuestion.id, optIdx)}
                className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                  answers[currentQuestion.id] === optIdx
                    ? 'border-violet-400 bg-violet-500/20 text-white'
                    : 'border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                  answers[currentQuestion.id] === optIdx ? 'border-violet-400 bg-violet-500' : 'border-slate-500'
                }`}>
                  {answers[currentQuestion.id] === optIdx && <CheckCircle size={14} className="text-white" />}
                </span>
                <span className="text-left flex-1">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation précédent/suivant */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} /> Précédent
        </button>
        {!isLastQuestion ? (
          <button
            onClick={goToNext}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition"
          >
            Suivant <ChevronRight size={18} />
          </button>
        ) : (
          <Button onClick={handleSubmit} className="px-6 py-2 text-lg">
            Terminer le quiz
          </Button>
        )}
      </div>

      {/* Chat pour les challenges */}
      {isChallenge && (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative p-3 bg-violet-600 rounded-full shadow-lg hover:bg-violet-700 transition"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-16 right-0 w-80 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={18} className="text-violet-400" />
                  <h4 className="font-semibold text-white">Discussion</h4>
                </div>
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3"
                >
                  {messages.length === 0 ? (
                    <p className="text-slate-500 text-xs italic text-center py-4">Aucun message</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-2 rounded-lg text-xs ${
                            msg.sender_id === user?.id
                              ? 'bg-violet-600 text-white rounded-br-none'
                              : 'bg-white/10 text-slate-300 rounded-bl-none'
                          }`}
                        >
                          <p className="font-semibold mb-0.5">
                            {msg.sender_id === user?.id ? 'Vous' : msg.sender_name}
                          </p>
                          <p className="break-words">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">
                            {formatRelativeTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrire..."
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-violet-600 text-white p-2 rounded-lg disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default QuizGame;