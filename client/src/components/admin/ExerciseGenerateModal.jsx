import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader, X, CheckCircle, AlertCircle, Zap, HelpCircle } from 'lucide-react';
import api from '../../services/api';

const ExerciseGenerateModal = ({ isOpen, onClose, onSave, groups }) => {
  const [mode, setMode] = useState('exercise');
  const [form, setForm] = useState({ group_id: '', chapter_id: '', difficulty: '' });
  const [count, setCount] = useState(5);
  const [questionCount, setQuestionCount] = useState(5);
  const [chapters, setChapters] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');

  const mountedRef = useRef(true);
  const successTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const fetchChapters = async (groupId) => {
    if (!groupId) return setChapters([]);
    try {
      const res = await api.get(`/chapters?group_id=${groupId}`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
      setChapters([]);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setForm({ ...form, group_id: groupId, chapter_id: '' });
    fetchChapters(groupId);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage({ type: '', text: '' });
    setError('');

    const body = {
      group_id: form.group_id,
      chapter_id: form.chapter_id || undefined,
      difficulty: form.difficulty || 'medium',
    };

    try {
      if (mode === 'exercise') {
        body.count = count;
        await api.post('/ai/generate-exercise', body);
        setMessage({ type: 'success', text: `${count} exercice(s) généré(s) avec succès !` });
      } else {
        body.count = questionCount;
        await api.post('/ai/generate-questions', body);
        setMessage({ type: 'success', text: `${questionCount} question(s) générée(s) avec succès !` });
      }

      successTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          onSave();
        }
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Erreur réseau. Veuillez réessayer.";
      setError(msg);
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2">
            <Sparkles className="text-violet-400" size={22} />
            Génération IA
          </h2>
          <button onClick={onClose} className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        {/* Sélecteur de mode */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('exercise')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              mode === 'exercise' ? 'bg-violet-600/20 border border-violet-400/30 text-violet-200' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Zap size={18} /> Exercice
          </button>
          <button
            onClick={() => setMode('questions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              mode === 'questions' ? 'bg-cyan-600/20 border border-cyan-400/30 text-cyan-200' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <HelpCircle size={18} /> Questions QCM
          </button>
        </div>

        {message.text && message.type === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
            <CheckCircle size={16} /> {message.text}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-red-500/20 border border-red-500/30 text-red-300">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Groupe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Groupe</label>
            <select value={form.group_id} onChange={handleGroupChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" required>
              <option value="">Sélectionnez un groupe</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Chapitre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Chapitre (optionnel)</label>
            <select name="chapter_id" value={form.chapter_id} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all disabled:opacity-50" disabled={!form.group_id}>
              <option value="">Tous les chapitres</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {/* Difficulté */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Difficulté</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" required>
              <option value="">Mixte</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
              <option value="very_hard">Très difficile</option>
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre {mode === 'exercise' ? "d'exercices" : "de questions"}</label>
            <div className="flex items-center gap-2">
              <input type="range" min="1" max="20" value={mode === 'exercise' ? count : questionCount} onChange={(e) => mode === 'exercise' ? setCount(parseInt(e.target.value)) : setQuestionCount(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500" />
              <span className="text-white font-bold w-8 text-center">{mode === 'exercise' ? count : questionCount}</span>
            </div>
          </div>

          <button type="submit" disabled={generating} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg">
            {generating ? (<><Loader size={18} className="animate-spin" /> Génération en cours...</>) : (<><Zap size={18} /> Générer {mode === 'exercise' ? count : questionCount} {mode === 'exercise' ? 'exercice(s)' : 'questions QCM'}</>)}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ExerciseGenerateModal;