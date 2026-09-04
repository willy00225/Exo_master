import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Loader, ChevronLeft, ChevronRight,
  Swords, BookOpen, Filter, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import BottomSheetSelect from '../common/BottomSheetSelect';

const difficultyOptions = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
  { value: 'very_hard', label: 'Très difficile' },
];

const OpponentList = ({ onChallengeCreated }) => {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const [opponents, setOpponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOpponents, setTotalOpponents] = useState(0);
  const [loadingOpponents, setLoadingOpponents] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sendingChallengeId, setSendingChallengeId] = useState(null);

  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/quizzes/available');
        const quizData = res.data;

        const subjectMap = new Map();
        quizData.forEach(q => {
          if (q.subject_id && q.subject_name) {
            subjectMap.set(q.subject_id, q.subject_name);
          }
        });
        const subjectList = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
        setSubjects(subjectList);

        const chapterMap = new Map();
        quizData.filter(q => q.chapter_id).forEach(q => {
          chapterMap.set(q.chapter_id, {
            id: q.chapter_id,
            title: q.chapter_title || `Chapitre ${q.chapter_id}`,
            subject_id: q.subject_id,
          });
        });
        setChapters(Array.from(chapterMap.values()));

        setQuizzes(quizData);

        const mathSubject = subjectList.find(s => s.name === 'Mathématiques') || subjectList[0];
        if (mathSubject) {
          setSelectedSubjectId(mathSubject.id);
        }
      } catch (err) {
        console.error(err);
        setLoadError('Impossible de charger les quiz.');
      }
    };
    fetchData();
  }, []);

  const filteredChapters = useMemo(() => {
    if (!selectedSubjectId) return [];
    return chapters.filter(ch => ch.subject_id === selectedSubjectId);
  }, [chapters, selectedSubjectId]);

  const filteredQuizzes = useMemo(() => {
    let result = quizzes;
    if (selectedSubjectId) {
      result = result.filter(q => q.subject_id === selectedSubjectId);
    }
    if (selectedChapterId !== 'all') {
      result = result.filter(q => q.chapter_id === selectedChapterId);
    }
    if (selectedDifficulty !== 'all') {
      result = result.filter(q => q.difficulty_filter === selectedDifficulty);
    }
    return result;
  }, [quizzes, selectedSubjectId, selectedChapterId, selectedDifficulty]);

  const fetchOpponents = useCallback(async () => {
    setLoadingOpponents(true);
    setLoadError(null);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
      };
      const res = await api.get('/challenges/available-opponents', { params });
      setOpponents(res.data.opponents || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalOpponents(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setLoadError('Impossible de charger les adversaires.');
    } finally {
      setLoadingOpponents(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchOpponents();
    const interval = setInterval(fetchOpponents, 10000);
    return () => clearInterval(interval);
  }, [fetchOpponents]);

  const handleChallenge = async (opponentId) => {
    if (!selectedQuizId) {
      alert('Veuillez sélectionner un quiz pour lancer le défi.');
      return;
    }

    setSendingChallengeId(opponentId);
    try {
      await api.post('/challenges', {
        challenged_id: opponentId,
        quiz_id: selectedQuizId,
      });
      if (onChallengeCreated) onChallengeCreated();
      alert('Défi envoyé !');
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || "Erreur lors de l'envoi du défi.";
      alert(message);
    } finally {
      setSendingChallengeId(null);
    }
  };

  const resetFilters = () => {
    const mathSubject = subjects.find(s => s.name === 'Mathématiques') || subjects[0];
    setSelectedSubjectId(mathSubject ? mathSubject.id : null);
    setSelectedChapterId('all');
    setSelectedDifficulty('all');
    setSelectedQuizId(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 space-y-6">
      {/* Section choix du quiz */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Swords size={20} className="text-violet-400" />
          Choisir le quiz du défi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {/* Matière */}
          <BottomSheetSelect
            value={selectedSubjectId}
            onChange={(newVal) => {
              setSelectedSubjectId(parseInt(newVal));
              setSelectedChapterId('all');
              setSelectedQuizId(null);
            }}
            placeholder="Choisir une matière"
            icon={BookOpen}
            options={subjects.map(s => ({ value: s.id, label: s.name }))}
          />

          {/* Chapitre */}
          <BottomSheetSelect
            value={selectedChapterId}
            onChange={(newVal) => {
              setSelectedChapterId(newVal);
              setSelectedQuizId(null);
            }}
            placeholder="Tous les chapitres"
            icon={Filter}
            options={[
              { value: 'all', label: 'Tous les chapitres' },
              ...filteredChapters.map(ch => ({ value: ch.id, label: ch.title }))
            ]}
            disabled={!selectedSubjectId}
          />

          {/* Difficulté */}
          <BottomSheetSelect
            value={selectedDifficulty}
            onChange={(newVal) => {
              setSelectedDifficulty(newVal);
              setSelectedQuizId(null);
            }}
            placeholder="Toutes les difficultés"
            icon={Filter}
            options={[
              { value: 'all', label: 'Toutes les difficultés' },
              ...difficultyOptions
            ]}
          />

          {/* Quiz précis */}
          <BottomSheetSelect
            value={selectedQuizId}
            onChange={(newVal) => setSelectedQuizId(parseInt(newVal))}
            placeholder="Sélectionner un quiz"
            icon={CheckCircle2}
            options={filteredQuizzes.map(q => ({ value: q.id, label: q.title }))}
            disabled={filteredQuizzes.length === 0}
          />
        </div>

        {selectedQuizId && (
          <p className="text-xs text-emerald-400 mt-2">
            Quiz sélectionné : {quizzes.find(q => q.id === selectedQuizId)?.title}
          </p>
        )}
      </div>

      {/* Section liste des adversaires */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={20} className="text-violet-400" />
            Adversaires disponibles ({totalOpponents})
          </h3>
          <span className="text-xs text-slate-400">
            En ligne : {opponents.filter(o => o.is_online).length}
          </span>
        </div>

        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {loadingOpponents ? (
          <div className="flex justify-center py-8">
            <Loader className="animate-spin text-violet-400" size={32} />
          </div>
        ) : loadError ? (
          <p className="text-red-400 text-center py-4">{loadError}</p>
        ) : opponents.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucun élève trouvé.</p>
        ) : (
          <div className="space-y-3 mt-4">
            <AnimatePresence>
              {opponents.map((opp) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 hover:border-violet-400/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-white font-semibold">
                        {opp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a1a] ${opp.is_online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{opp.name}</p>
                      <p className="text-xs text-slate-400">
                        {opp.is_online ? 'En ligne' : 'Hors ligne'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleChallenge(opp.id)}
                    disabled={!selectedQuizId || sendingChallengeId === opp.id}
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Swords size={16} />
                    {sendingChallengeId === opp.id ? 'Envoi...' : 'Défier'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-slate-400 text-sm">Page {page} sur {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpponentList;