import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { useEffect, useRef, useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import SecurityAssistant from './SecurityAssistant';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ── Live attack alerts ─────────────────────────────────────────────
   Polls every protected site's counters every 8 seconds. The moment
   NetGuard stops requests on any site (throttled / challenged /
   blocked), a popup toast fires on whatever dashboard page the admin
   is viewing — so an attack launched from anywhere (even a different
   website) is visible live in the dashboard. */
function useAttackAlerts() {
  const baseline = useRef(null);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      try {
        const res = await api.get('/api/dashboard/sites');
        if (!alive) return;
        const sites = res.data?.data || [];
        const next = {};
        sites.forEach((s) => {
          next[s._id] = {
            name: s.siteName,
            throttled: s.counters?.throttled || 0,
            challenged: s.counters?.challenged || 0,
            blocked: s.counters?.blocked || 0,
          };
        });
        const prev = baseline.current;
        baseline.current = next;
        if (!prev) return; // first load after login only sets the baseline
        Object.keys(next).forEach((id) => {
          const before = prev[id];
          const after = next[id];
          if (!before || !after) return;
          const blocked = after.blocked - before.blocked;
          const challenged = after.challenged - before.challenged;
          const throttled = after.throttled - before.throttled;
          const stopped = blocked + challenged + throttled;
          if (stopped <= 0) return;
          const parts = [];
          if (blocked) parts.push(`${blocked} blocked`);
          if (challenged) parts.push(`${challenged} challenged`);
          if (throttled) parts.push(`${throttled} throttled`);
          toast(
            `LIVE ATTACK STOPPED — ${after.name}: ${stopped} request${stopped === 1 ? '' : 's'} (${parts.join(', ')})`,
            {
              icon: '🚨',
              duration: 7000,
              style: {
                background: '#161a26',
                color: '#e2e8f0',
                border: '1px solid rgba(255,59,92,.6)',
                fontWeight: 600,
                maxWidth: 520,
              },
            },
          );
        });
      } catch {
        /* silent — retried on the next tick; auth errors redirect via the api interceptor */
      }
    };

    check();
    const timer = setInterval(check, 8000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
}

export default function Layout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  useAttackAlerts();

  return (
    <div className="flex min-h-screen bg-dark">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64 min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5" aria-label="Open navigation">
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-gray-200">NetGuard Cloud</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">v3.6.3</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-200">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role === 'admin' ? 'Admin' : 'User'}</div>
            </div>
            {user?.avatar && (
              <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full border-2 border-border" />
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <SecurityAssistant />
    </div>
  );
}
