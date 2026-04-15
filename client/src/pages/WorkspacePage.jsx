import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Calendar, ChevronRight, Copy, ArrowLeft, ClipboardList, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';

const PRIO = {
  high:   { bg:'var(--red-bg)',   color:'var(--red-text)',   border:'var(--red-border)'   },
  medium: { bg:'var(--amber-bg)', color:'var(--amber-text)', border:'var(--amber-border)' },
  low:    { bg:'var(--green-bg)', color:'var(--green-text)', border:'var(--green-border)' },
};

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', date:'', venue:'', attendees:'' });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [wsRes, meetRes, aiRes] = await Promise.all([
        api.get(`/workspaces/${id}`),
        api.get(`/meetings/workspace/${id}`),
        api.get(`/action-items/workspace/${id}`),
      ]);
      setWorkspace(wsRes.data);
      setMeetings(meetRes.data);
      setActionItems(aiRes.data);
    } catch { toast.error('Failed to load workspace'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, attendees: form.attendees.split(',').map(s => s.trim()).filter(Boolean) };
      const { data } = await api.post(`/meetings/workspace/${id}`, payload);
      setMeetings([data, ...meetings]);
      setShowCreate(false);
      setForm({ title:'', date:'', venue:'', attendees:'' });
      toast.success('Meeting created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const copyCode = () => { navigator.clipboard.writeText(workspace.code); toast.success('Code copied!'); };
  const pending = actionItems.filter(a => a.status !== 'completed');

  if (loading) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading…</div>;
  if (!workspace) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)' }}>Not found</div>;

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/dashboard')}
        style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:'0.82rem', marginBottom:24, padding:0, transition:'color 0.15s', fontFamily:'inherit', fontWeight:600 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="anim-fade-up" style={{ paddingBottom:36, borderBottom:'1px solid var(--border)', marginBottom:32 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Workspace</p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.1 }}>
              {workspace.name}
            </h1>
            {workspace.description && (
              <p style={{ fontSize:'0.875rem', color:'var(--text-muted)', marginTop:5 }}>{workspace.description}</p>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Invite code</span>
              <code style={{ fontFamily:'monospace', fontSize:'0.82rem', fontWeight:700, color:'var(--accent)', background:'var(--accent-subtle)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.08em' }}>
                {workspace.code}
              </code>
              <button onClick={copyCode} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', transition:'color 0.15s', padding:2 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Copy size={13} />
              </button>
            </div>
          </div>
          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:500 }}>{workspace.members.length} members</span>
        </div>
      </div>

      {/* Stats */}
      <div className="anim-fade-up delay-1" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:32 }}>
        {[
          { val: meetings.length, label:'Meetings' },
          { val: pending.length, label:'Pending Actions' },
          { val: meetings.filter(m => m.status === 'finalized').length, label:'MoMs Generated' },
        ].map(({ val, label }, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Meetings header */}
      <div className="anim-fade-up delay-2" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom:3 }}>Meetings</p>
          <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{meetings.length} total</h2>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:'0.82rem' }}>
          <Plus size={14} /> New Meeting
        </button>
      </div>

      {meetings.length === 0 ? (
        <div style={{ border:'1px dashed var(--border)', borderRadius:'var(--radius)', padding:'40px 24px', textAlign:'center' }}>
          <Calendar size={28} style={{ margin:'0 auto 10px', color:'var(--text-muted)', display:'block' }} />
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>No meetings yet.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {meetings.map((m, i) => {
            const accessible = m.hasAccess !== false;
            const isRestricted = m.visibility === 'restricted';
            return (
              <div key={m._id}
                className={`anim-fade-up delay-${Math.min(i+2,5)}`}
                title={!accessible ? "Restricted — you don't have access" : undefined}
                onClick={() => navigate(`/meeting/${m._id}`)}
                style={{ width:'100%', textAlign:'left', background:'var(--bg-primary)', border:`1px solid ${!accessible ? 'var(--red-border)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'14px 18px', cursor:'pointer', transition:'border-color 0.15s', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, opacity: accessible ? 1 : 0.6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accessible ? 'var(--accent-border)' : 'var(--red-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = !accessible ? 'var(--red-border)' : 'var(--border)'; }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, flexWrap:'wrap' }}>
                    {isRestricted
                      ? <Lock size={12} style={{ color: accessible ? 'var(--text-muted)' : 'var(--red)', flexShrink:0 }} />
                      : <Globe size={12} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                    }
                    <h3 style={{ fontWeight:600, fontSize:'0.88rem', color: accessible ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.title}</h3>
                    <span className={`badge ${m.status === 'finalized' ? 'badge-green' : 'badge-amber'}`}>
                      {m.status === 'finalized' ? 'MoM Ready' : 'Draft'}
                    </span>
                    {!accessible && (
                      <span className="badge badge-red">No Access</span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:'0.75rem', color:'var(--text-muted)' }}>
                    <span>{format(new Date(m.date), 'MMM d, yyyy')}</span>
                    {m.venue && <span>{m.venue}</span>}
                    {m.createdBy?.name && <span>by {m.createdBy.name}</span>}
                  </div>
                </div>
                {!accessible
                  ? <Lock size={14} style={{ color:'var(--red)', flexShrink:0 }} />
                  : <ChevronRight size={15} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                }
              </div>
            );
          })}
        </div>
      )}

      {/* Pending action items */}
      {pending.length > 0 && (
        <div style={{ marginTop:40 }}>
          <div style={{ paddingBottom:14, borderBottom:'1px solid var(--border)', marginBottom:14 }}>
            <p className="eyebrow" style={{ marginBottom:3 }}>Action items</p>
            <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:7 }}>
              <ClipboardList size={15} style={{ color:'var(--accent)' }} /> {pending.length} pending
            </h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {pending.slice(0, 5).map(item => {
              const p = PRIO[item.priority] || PRIO.medium;
              return (
                <div key={item._id} style={{ background:'var(--bg-primary)', border:`1px solid ${p.border}`, borderLeft:`3px solid ${p.border}`, borderRadius:'var(--radius)', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>{item.task}</p>
                    <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>→ {item.assignedTo}</p>
                  </div>
                  <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'2px 9px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.05em', background:p.bg, color:p.color, border:`1px solid ${p.border}`, flexShrink:0, marginLeft:10 }}>{item.priority}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'var(--overlay-bg)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20, backdropFilter:'blur(2px)' }}>
          <div className="anim-fade-up" style={{ width:'100%', maxWidth:440, background:'var(--bg-primary)', borderRadius:'var(--radius)', padding:28, border:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:20 }}>New Meeting</h2>
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label className="label">Meeting title</label><input className="input" placeholder="Weekly Sync" required value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></div>
              <div><label className="label">Date & time</label><input className="input" type="datetime-local" required value={form.date} onChange={e => setForm({...form, date:e.target.value})} /></div>
              <div><label className="label">Venue</label><input className="input" placeholder="Conference Room A" value={form.venue} onChange={e => setForm({...form, venue:e.target.value})} /></div>
              <div><label className="label">Attendees (comma-separated)</label><input className="input" placeholder="Alice, Bob, Charlie" value={form.attendees} onChange={e => setForm({...form, attendees:e.target.value})} /></div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8 }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
