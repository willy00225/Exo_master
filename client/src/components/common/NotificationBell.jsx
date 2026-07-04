import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

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
    const interval = setInterval(fetchNotifs, 15000); // rafraîchit toutes les 15s
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.filter(n => n.id !== id));
      if (link) window.location.href = link;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {notifs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifs.length}
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