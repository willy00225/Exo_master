import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifs(res.data.filter(n => !n.read));
      } catch (e) { console.error(e); }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Bell size={20} />
        {notifs.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifs.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl border p-2 z-50">
          <h3 className="text-sm font-semibold p-2">Notifications</h3>
          {notifs.length === 0 ? (
            <p className="text-sm text-slate-500 p-2">Aucune nouvelle notification</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className="p-2 hover:bg-slate-50 rounded text-sm cursor-pointer"
                   onClick={() => { markRead(n.id); window.location.href = n.link || '#'; }}>
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;