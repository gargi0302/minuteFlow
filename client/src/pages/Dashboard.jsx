import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Trash2, Calendar, Sparkles, ChevronRight, X, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';

/* ── Modal ──────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'var(--overlay-bg)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20, backdropFilter:'blur(2px)' }}>
      <div className="anim-fade-up" style={{ width:'100%', maxWidth:440, background:'var(--bg-primary)', borderRadius:'var(--radius)', padding:28, border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{title}</h2>
          <button onClick={onClose} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:4, transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Workspace Card ────────────────────────────────────────────── */
function WorkspaceCard({ ws, onDelete, onClick }) {
  const initials = ws.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${hovered ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: 20, cursor: 'pointer',
        transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.82rem', fontWeight:700, color:'white' }}>
          {initials}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ opacity: hovered ? 1 : 0, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:4, transition:'all 0.15s' }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}>
          <Trash2 size={14} />
        </button>
      </div>

      <h3 style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)', letterSpacing:'-0.01em', marginBottom:4 }}>{ws.name}</h3>
      {ws.description && (
        <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{ws.description}</p>
      )}

      <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500 }}>
          <Users size={11} /> {ws.members.length}
        </span>
        <span style={{ fontFamily:'monospace', fontSize:'0.68rem', color:'var(--accent)', background:'var(--accent-subtle)', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>
          #{ws.code}
        </span>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [wsRes, statsRes] = await Promise.all([
        api.get('/workspaces'),
        api.get('/workspaces/dashboard/stats'),
      ]);
      setWorkspaces(wsRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workspaces', createForm);
      setWorkspaces([...workspaces, data]);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      fetchAll();
      toast.success('Workspace created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workspaces/join', { code: joinCode });
      setWorkspaces([...workspaces, data]);
      setShowJoin(false);
      setJoinCode('');
      fetchAll();
      toast.success('Joined workspace!');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid code'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workspace?')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      setWorkspaces(workspaces.filter(w => w._id !== id));
      fetchAll();
      toast.success('Deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading…</div>;

  return (
    <div>
      {/* ── Hero greeting ───────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ paddingBottom:40, borderBottom:'1px solid var(--border)', marginBottom:36 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>{format(new Date(), 'EEEE, MMMM d')}</p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <h1 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.1 }}>
            {greeting()},{' '}
            <span style={{ color:'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={() => setShowJoin(true)} className="btn-secondary" style={{ fontSize:'0.82rem' }}>
              Join Workspace
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:'0.82rem' }}>
              <Plus size={14} /> New Workspace
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      {stats && (
        <div className="anim-fade-up delay-1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:40 }}>
          {[
            { label:'Workspaces',      value: stats.totalWorkspaces },
            { label:'Total Meetings',  value: stats.totalMeetings },
            { label:'MoMs Generated',  value: stats.momGenerated },
            { label:'Pending Actions', value: stats.pendingActionItems },
          ].map(({ label, value }, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{value ?? '—'}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:28, alignItems:'start' }}>

        {/* Workspaces */}
        <div>
          <div className="anim-fade-up delay-2" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom:4 }}>Your workspaces</p>
              <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
                {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'}
              </h2>
            </div>
          </div>

          {workspaces.length === 0 ? (
            <div style={{ border:'1px dashed var(--border)', borderRadius:'var(--radius)', padding:'48px 24px', textAlign:'center' }}>
              <Users size={32} style={{ margin:'0 auto 12px', color:'var(--text-muted)', display:'block' }} />
              <p style={{ color:'var(--text-muted)', marginBottom:16, fontSize:'0.875rem' }}>No workspaces yet.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:'0.82rem', margin:'0 auto' }}>
                <Plus size={14} /> Create your first
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {workspaces.map((ws, i) => (
                <div key={ws._id} className={`anim-fade-up delay-${Math.min(i+2,5)}`}>
                  <WorkspaceCard ws={ws} onClick={() => navigate(`/workspace/${ws._id}`)} onDelete={() => handleDelete(ws._id)} />
                </div>
              ))}
              <button onClick={() => setShowCreate(true)}
                style={{ border:'1px dashed var(--border)', borderRadius:'var(--radius)', padding:'20px', color:'var(--text-muted)', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:140, transition:'all 0.15s', fontFamily:'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                <Plus size={20} />
                <span style={{ fontSize:'0.8rem', fontWeight:600 }}>New Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="anim-fade-up delay-3">
          {/* Recent meetings */}
          <p className="eyebrow" style={{ marginBottom:12 }}>Recent meetings</p>
          {!stats?.recentMeetings?.length ? (
            <div style={{ border:'1px dashed var(--border)', borderRadius:'var(--radius)', padding:'28px 16px', textAlign:'center' }}>
              <Calendar size={22} style={{ margin:'0 auto 8px', color:'var(--text-muted)', display:'block' }} />
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>No meetings yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {stats.recentMeetings.map((m) => (
                <button key={m._id} onClick={() => navigate(`/meeting/${m._id}`)}
                  style={{ width:'100%', textAlign:'left', background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', cursor:'pointer', transition:'border-color 0.15s', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ marginBottom:3 }}>
                      <span className={`badge ${m.status === 'finalized' ? 'badge-green' : 'badge-amber'}`}>
                        {m.status === 'finalized' ? 'Ready' : 'Draft'}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {m.visibility === 'restricted'
                        ? <Lock size={10} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                        : <Globe size={10} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                      }
                      <p style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{m.title}</p>
                    </div>
                    <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>
                      {m.workspace?.name} · {format(new Date(m.date), 'MMM d')}
                    </p>
                  </div>
                  <ChevronRight size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                </button>
              ))}
            </div>
          )}

          {/* How it works */}
          <div style={{ marginTop:16, padding:16, borderRadius:'var(--radius)', background:'var(--accent-subtle)', border:'1px solid var(--accent-border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <Sparkles size={12} style={{ color:'var(--accent)' }} />
              <span className="eyebrow">How it works</span>
            </div>
            <ol style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
              {['Create or join a workspace','Add a new meeting','Paste the meeting transcript','Generate MoM with AI'].map((step, i) => (
                <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ flexShrink:0, width:18, height:18, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700, color:'white', marginTop:1 }}>{i+1}</span>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Create Workspace" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label className="label">Workspace name</label><input className="input" placeholder="Engineering Team" required value={createForm.name} onChange={e => setCreateForm({...createForm, name:e.target.value})} /></div>
            <div><label className="label">Description (optional)</label><input className="input" placeholder="Brief description" value={createForm.description} onChange={e => setCreateForm({...createForm, description:e.target.value})} /></div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8 }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}
      {showJoin && (
        <Modal title="Join Workspace" onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="label">Workspace code</label>
              <input className="input mono" placeholder="XXXXXXXX" required style={{ textAlign:'center', fontSize:'1.1rem', letterSpacing:'0.2em' }} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8} />
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:5 }}>Ask your workspace admin for the 8-character code.</p>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8 }}>
              <button type="button" onClick={() => setShowJoin(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Join</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
