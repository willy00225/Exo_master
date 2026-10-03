import { useState, useEffect } from 'react';
import {
  Sparkles, Loader, X, CheckCircle, AlertCircle, BookOpen,
  GraduationCap, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import BottomSheetSelect from '../common/BottomSheetSelect';

const GenerateSummariesModal = ({ isOpen, onClose, onSave }) => {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ group_id: '', subject_id: '' });
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  // Chargement des données
  const fetchData = async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [groupsRes, subjectsRes] = await Promise.all([
        api.get('/groups'),
        api.get('/admin/subjects'),
      ]);
      setGroups(groupsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error(err);
      setDataError('Impossible de charger les classes ou les matières.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setForm({ group_id: '', subject_id: '' });
      setResults([]);
      setDone(false);
    }
  }, [isOpen]);

  // Fermeture Échap + blocage du scroll body
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !generating) onClose();
    };
    document.addEventListener('keydown', handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, generating, onClose]);

  const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.group_id || !form.subject_id) return;
    setGenerating(true);
    setResults([]);
    setDone(false);
    try {
      const res = await api.post('/ai/generate-summaries-batch', form);
      setResults(res.data.results || []);
      setDone(true);
      if (onSave) onSave();
    } catch (err) {
      console.error(err);
      setResults([{
        chapter: 'Erreur globale',
        status: 'error',
        error: err.response?.data?.error || err.message,
      }]);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={generating ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-summaries-title"
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="generate-summaries-title"
            className="text-xl font-bold text-white font-space-grotesk flex items-center gap-2"
          >
            <Sparkles className="text-violet-400" size={22} />
            Générer les résumés par IA
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="p-1.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-colors active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Erreur de chargement initial */}
        {dataError && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-sm">
            <AlertCircle size={16} /> {dataError}
            <button
              type="button"
              onClick={fetchData}
              className="ml-auto flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 transition-colors"
            >
              <RefreshCw size={12} /> Réessayer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                <GraduationCap size={16} className="inline mr-1" /> Classe *
              </label>
              {loadingData ? (
                <div className="flex items-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm">
                  <Loader size={16} className="animate-spin" /> Chargement…
                </div>
              ) : (
                <BottomSheetSelect
                  value={form.group_id}
                  onChange={(val) => handleChange('group_id', val)}
                  placeholder="Sélectionnez une classe"
                  icon={GraduationCap}
                  options={groups.map(g => ({ value: g.id, label: g.name }))}
                  disabled={generating}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                <BookOpen size={16} className="inline mr-1" /> Matière *
              </label>
              {loadingData ? (
                <div className="flex items-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm">
                  <Loader size={16} className="animate-spin" /> Chargement…
                </div>
              ) : (
                <BottomSheetSelect
                  value={form.subject_id}
                  onChange={(val) => handleChange('subject_id', val)}
                  placeholder="Sélectionnez une matière"
                  icon={BookOpen}
                  options={subjects.map(s => ({ value: s.id, label: s.name }))}
                  disabled={generating}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={generating || loadingData || !!dataError || !form.group_id || !form.subject_id}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            aria-label="Générer les résumés"
          >
            {generating ? (
              <>
                <Loader size={18} className="animate-spin" /> Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Générer les résumés
              </>
            )}
          </button>
        </form>

        {/* Résultats — statique */}
        {results.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-white">Résultats</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm border ${
                    item.status === 'ok'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      : 'bg-red-500/10 text-red-300 border-red-500/20'
                  }`}
                >
                  {item.status === 'ok' ? (
                    <CheckCircle size={14} className="shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="shrink-0" />
                  )}
                  <span className="truncate">
                    {item.chapter} {item.error && `— ${item.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message de fin — statique */}
        {done && (
          <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 text-sm bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <CheckCircle size={16} />
            Génération terminée. Les résumés sont en attente de validation.
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateSummariesModal;