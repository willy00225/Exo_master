import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { Timer, CheckCircle, XCircle, ArrowLeft, Trophy, Swords, Send, MessageCircle } from 'lucide-react';
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

const normalizeOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') return options.split(' ').filter(Boolean);
  return [];
};

// 🆕 Fonction utilitaire pour afficher le temps relatif
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

  // 🆕 États pour le chat amélioré
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

  // 🆕 Charger les messages avec polling intelligent
  useEffect(() => {
    if (!isChallenge) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/challenges/${challengeId}/messages`);
        const newMessages = res.data;
        
        // Détecter les messages non lus
        if (lastReadMessageId && newMessages.length > 0) {
          const unread = newMessages.filter(msg => 
            msg.id > lastReadMessageId && msg.sender_id !== user?.id
          );
          if (unread.length > 0) {
            setUnreadCount(prev => prev + unread.length);
          }
        } else if (newMessages.length > 0) {
          // Initialisation : marquer le dernier message comme lu
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
          // Réessayer après un délai plus long
          setTimeout(() => {
            setRetryCount(0);
          }, 5000);
        } else {
          setChatError("Impossible de charger les messages. Nouvelle tentative...");
        }
      }
    };

    fetchMessages();
    chatPollingRef.current = setInterval(fetchMessages, 3000);

    // 🆕 Mettre en pause le polling quand l'onglet n'est pas visible
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

  // 🆕 Auto-scroll intelligent (seulement si l'utilisateur est en bas)
  useEffect(() => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, shouldAutoScroll]);

  // 🆕 Gestion du scroll pour détecter si l'utilisateur est en bas
  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldAutoScroll(isNearBottom);
      
      // Marquer les messages comme lus quand l'utilisateur scrolle en bas
      if (isNearBottom && messages.length > 0) {
        setUnreadCount(0);
        setLastReadMessageId(messages[messages.length - 1].id);
      }
    }
  };

  // 🆕 Envoyer un message avec mise à jour optimiste
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage || sending) return;
    
    // Validation de la longueur
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

    // Mise à jour optimiste
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);
    setChatError(null);
    setShouldAutoScroll(true);

    try {
      const res = await api.post(`/challenges/${challengeId}/messages`, { 
        message: trimmedMessage 
      });
      
      // Remplacer le message temporaire par le vrai
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? { ...res.data, sender_name: user.name || 'Vous' } : msg)
      );
      
      // Mettre à jour lastReadMessageId
      setLastReadMessageId(res.data.id);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
      // Retirer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(trimmedMessage); // Restaurer le message
      setChatError("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  // 🆕 Gestion de la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Soumission du quiz (identique à avant)
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

  // Écran d'erreur
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

  // Quiz en cours (avec chat si challenge)
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

      {/* 🆕 Zone de chat améliorée pour les challenges */}
      {isChallenge && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={20} className="text-violet-400" />
            <h3 className="text-lg font-semibold">Discussion</h3>
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </span>
            )}
          </div>

          <div 
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-violet-500/30 scrollbar-track-transparent"
          >
            {messages.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-4">
                Aucun message pour l'instant. Commencez la conversation !
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} ${
                    msg.isTemp ? 'opacity-70' : ''
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm transition-all ${
                      msg.sender_id === user?.id
                        ? 'bg-violet-600 text-white rounded-br-none'
                        : 'bg-white/10 text-slate-300 rounded-bl-none'
                    } ${msg.isTemp ? 'shadow-lg shadow-violet-500/20' : ''}`}
                  >
                    <p className="font-semibold text-xs mb-1">
                      {msg.sender_id === user?.id ? 'Vous' : msg.sender_name}
                      {msg.isTemp && (
                        <span className="ml-2 text-[10px] text-violet-200 animate-pulse">
                          envoi...
                        </span>
                      )}
                    </p>
                    <p className="break-words">{msg.message}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              {chatError}
            </p>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrire un message... (Entrée pour envoyer)"
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-violet-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-violet-600 disabled:hover:to-cyan-600"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Envoyer
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <Button onClick={handleSubmit} className="w-full py-4 text-lg">
        Terminer le quiz
      </Button>
    </div>
  );
};

export default QuizGame;