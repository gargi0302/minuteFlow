import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FileText, CheckSquare, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/action-items/my-tasks')
      .then(({ data }) => setPendingCount(data.filter(t => t.status !== 'completed').length))
      .catch(() => {});
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <nav style={{
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 28px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo */}
        <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{ width:28, height:28, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileText size={14} color="white" />
          </div>
          <span style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
            minute<span style={{ color:'var(--accent)' }}>Flow</span>
          </span>
        </Link>

        <div />

        {/* Right side */}
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <NavLink to="/tasks" label="My Tasks" icon={<CheckSquare size={14}/>} active={isActive('/tasks')} badge={pendingCount} />

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', transition:'background 0.15s, color 0.15s', marginLeft:2 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button onClick={() => navigate('/profile')}
              style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none', cursor:'pointer', padding:'4px 8px 4px 4px', borderRadius:6, transition:'background 0.15s', fontFamily:'inherit', marginLeft:2 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', border:'1.5px solid var(--border)', flexShrink:0 }} />
              ) : (
                <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, color:'white', flexShrink:0 }}>
                  {(user.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)' }}>
                {user.name?.split(' ')[0]}
              </span>
            </button>

            <button onClick={handleLogout}
              style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', transition:'color 0.15s', padding:'4px 8px', fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={toggleTheme}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', transition:'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link to="/login"
              style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-muted)', textDecoration:'none', padding:'6px 10px', borderRadius:6, transition:'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              Log In
            </Link>
            <Link to="/register" className="btn-primary" style={{ padding:'7px 16px', fontSize:'0.82rem', textDecoration:'none' }}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, label, icon, active, badge }) {
  return (
    <Link to={to} style={{
      display:'flex', alignItems:'center', gap:5,
      padding:'6px 12px', borderRadius:6,
      fontSize:'0.82rem', fontWeight:600,
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      background: active ? 'var(--accent-subtle)' : 'transparent',
      textDecoration:'none', position:'relative',
      transition:'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-hover)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent'; }}}>
      {icon}{label}
      {badge > 0 && (
        <span style={{ position:'absolute', top:-3, right:-3, background:'var(--accent)', color:'white', fontSize:'0.58rem', fontWeight:700, width:14, height:14, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
