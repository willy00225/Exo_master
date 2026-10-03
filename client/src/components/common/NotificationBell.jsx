import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data.filter(n => !n.read));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();

    // Rafraîchit toutes les 60s (au lieu de 15s) pour réduire les re-renders
    const interval = setInterval(fetchNotifs, 60000);

    // 🎯 Pause l'intervalle quand l'onglet n'est pas visible (économie CPU)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifs(); // refresh immédiat au retour
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const markRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.filter(n => n.id !== id));
      setOpen(false);

      // 🎯 Navigation SPA (pas de rechargement complet de la page)
      if (link) {
        navigate(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {notifs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-600">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Aucune notification</p>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id, n.link)}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0 transition-colors"
                >
                  <p className="text-sm text-slate-200">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;