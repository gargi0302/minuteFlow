import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Clock, AlertTriangle, Zap, Info, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY = {
  high:   { label:'High',   bg:'var(--red-bg)',   color:'var(--red-text)',   border:'var(--red-border)',   left:'var(--red)',   icon:<AlertTriangle size={9}/> },
  medium: { label:'Medium', bg:'var(--amber-bg)', color:'var(--amber-text)', border:'var(--amber-border)', left:'var(--amber)', icon:<Zap size={9}/> },
  low:    { label:'Low',    bg:'var(--green-bg)', color:'var(--green-text)', border:'var(--green-border)', left:'var(--green)', icon:<Info size={9}/> },
};
const STATUS_CYCLE = { pending:'in-progress', 'in-progress':'completed', completed:'pending' };

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle2 size={20} style={{ color:'var(--green)' }} />;
  if (status === 'in-progress') return <Clock size={20} style={{ color:'var(--amber)' }} />;
  return <Circle size={20} style={{ color:'var(--text-muted)' }} />;
}

function TaskCard({ task, onStatusChange, onClick }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const isDone = task.status === 'completed';
  const sColor = task.status==='completed'
    ? { bg:'var(--green-bg)', color:'var(--green-text)', border:'var(--green-border)' }
    : task.status==='in-progress'
    ? { bg:'var(--amber-bg)', color:'var(--amber-text)', border:'var(--amber-border)' }
    : { bg:'var(--surface-inset)', color:'var(--text-muted)', border:'var(--border)' };

  return (
    <div style={{ background:'var(--bg-primary)', border:`1px solid var(--border)`, borderLeft:`3px solid ${p.left}`, borderRadius:'var(--radius)', padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:11, opacity: isDone ? 0.55 : 1, transition:'border-color 0.15s' }}>
      <button onClick={() => onStatusChange(task._id, STATUS_CYCLE[task.status])}
        style={{ marginTop:1, flexShrink:0, background:'none', border:'none', cursor:'pointer', padding:0, transition:'transform 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        <StatusIcon status={task.status} />
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:600, fontSize:'0.875rem', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', lineHeight:1.4 }}>
          {task.task}
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:5, marginTop:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--accent-subtle)', color:'var(--accent)', fontSize:'0.72rem', padding:'3px 9px', borderRadius:4, border:'1px solid var(--accent-border)', fontWeight:600 }}>
            <span style={{ width:15, height:15, borderRadius:'50%', background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.52rem', fontWeight:700 }}>
              {task.assignedTo?.charAt(0)?.toUpperCase()}
            </span>
            {task.assignedTo}
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:'0.65rem', fontWeight:700, padding:'2px 8px', borderRadius:4, background:p.bg, color:p.color, border:`1px solid ${p.border}`, textTransform:'uppercase', letterSpacing:'0.04em' }}>
            {p.icon} {p.label}
          </span>
          <span style={{ fontSize:'0.65rem', fontWeight:600, padding:'2px 8px', borderRadius:4, background:sColor.bg, color:sColor.color, border:`1px solid ${sColor.border}` }}>
            {task.status==='in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase()+task.status.slice(1)}
          </span>
        </div>
        <button onClick={onClick}
          style={{ marginTop:7, display:'flex', alignItems:'center', gap:4, fontSize:'0.72rem', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:0, transition:'color 0.15s', fontFamily:'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
          <ChevronRight size={10}/>{task.workspace?.name} · {task.meeting?.title}{task.meeting?.date && ` · ${format(new Date(task.meeting.date),'MMM d')}`}
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try { const { data } = await api.get('/action-items/my-tasks'); setTasks(data); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/action-items/${id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id===id ? {...t, status:data.status} : t));
    } catch { toast.error('Failed to update task'); }
  };

  const filtered = tasks
    .filter(t => filter==='all' || t.status===filter)
    .filter(t => priorityFilter==='all' || t.priority===priorityFilter)
    .sort((a,b) => {
      const pO={high:0,medium:1,low:2}, sO={pending:0,'in-progress':1,completed:2};
      return sO[a.status]-sO[b.status] || pO[a.priority]-pO[b.priority];
    });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t=>t.status==='pending').length,
    'in-progress': tasks.filter(t=>t.status==='in-progress').length,
    completed: tasks.filter(t=>t.status==='completed').length,
  };
  const pct = tasks.length ? Math.round((counts.completed/tasks.length)*100) : 0;

  if (loading) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading…</div>;

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ paddingBottom:36, borderBottom:'1px solid var(--border)', marginBottom:28 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Action items</p>
        <h1 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.1 }}>
          My Tasks
        </h1>
        <p style={{ fontSize:'0.875rem', color:'var(--text-muted)', marginTop:6 }}>All action items assigned across your workspaces</p>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="anim-fade-up delay-1 card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)' }}>Overall Progress</span>
            <span style={{ fontSize:'1rem', fontWeight:700, color:'var(--accent)', letterSpacing:'-0.02em' }}>{pct}%</span>
          </div>
          <div style={{ width:'100%', background:'var(--bg-secondary)', borderRadius:4, height:6, overflow:'hidden', marginBottom:14 }}>
            <div style={{ height:6, borderRadius:4, background:'var(--accent)', width:`${pct}%`, transition:'width 0.6s ease' }} />
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <span style={{ fontSize:'0.72rem', color:'var(--red-text)', fontWeight:600 }}>{counts.pending} pending</span>
            <span style={{ fontSize:'0.72rem', color:'var(--amber-text)', fontWeight:600 }}>{counts['in-progress']} in progress</span>
            <span style={{ fontSize:'0.72rem', color:'var(--green-text)', fontWeight:600 }}>{counts.completed} done</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="anim-fade-up delay-2" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8, marginBottom:20 }}>
        <div style={{ display:'flex', gap:2, background:'var(--bg-primary)', borderRadius:'var(--radius-sm)', padding:3, border:'1px solid var(--border)' }}>
          {[
            { key:'all', label:`All (${counts.all})` },
            { key:'pending', label:`Pending (${counts.pending})` },
            { key:'in-progress', label:`In Progress (${counts['in-progress']})` },
            { key:'completed', label:`Done (${counts.completed})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{ padding:'5px 12px', borderRadius:4, fontSize:'0.75rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit', background: filter===key ? 'var(--accent)' : 'transparent', color: filter===key ? 'white' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Filter size={11} style={{ color:'var(--text-muted)' }} />
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ fontSize:'0.75rem', borderRadius:4, padding:'5px 12px', background:'var(--bg-primary)', color:'var(--text-primary)', border:'1px solid var(--border)', outline:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <CheckCircle2 size={40} style={{ margin:'0 auto 10px', color:'var(--border)', display:'block' }} />
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
            {tasks.length===0 ? 'No tasks yet — generate a MoM to get started.' : 'No tasks match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map((task, i) => (
            <div key={task._id} className={`anim-fade-up delay-${Math.min(i+1,5)}`}>
              <TaskCard task={task} onStatusChange={handleStatusChange}
                onClick={() => task.meeting?._id && navigate(`/meeting/${task.meeting._id}/mom`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
