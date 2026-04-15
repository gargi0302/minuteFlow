import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Sparkles, FileText, ClipboardPaste,
  Mic, MicOff, Square, Lock, Globe, Shield, X,
} from 'lucide-react';
import { format } from 'date-fns';

/* ── Manage Access Modal ─────────────────────────────────────────── */
function ManageAccessModal({ meeting, workspace, currentUserId, onClose, onSaved }) {
  const [visibility, setVisibility] = useState(meeting.visibility || 'everyone');
  const [allowed, setAllowed] = useState(
    (meeting.allowedUserIds || []).map(u => (typeof u === 'object' ? u : { _id: u, name: u }))
  );
  const [saving, setSaving] = useState(false);

  const members = (workspace?.members || []).map(m => m.user).filter(Boolean);
  const isAllowed = (userId) => allowed.some(u => u._id?.toString() === userId?.toString());

  const toggleMember = (member) => {
    if (isAllowed(member._id)) {
      if (member._id?.toString() === meeting.createdBy?._id?.toString()) return;
      setAllowed(prev => prev.filter(u => u._id?.toString() !== member._id?.toString()));
    } else {
      setAllowed(prev => [...prev, member]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/meetings/${meeting._id}/access`, {
        visibility,
        allowedUserIds: allowed.map(u => u._id),
      });
      toast.success('Access settings saved');
      onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--overlay-bg)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20, backdropFilter:'blur(2px)' }}>
      <div className="anim-fade-up" style={{ width:'100%', maxWidth:480, background:'var(--bg-primary)', borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Shield size={15} style={{ color:'var(--accent)' }} />
            <h2 style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>Manage Access</h2>
          </div>
          <button onClick={onClose} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:4, transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding:22 }}>
          {/* Visibility toggle */}
          <div style={{ marginBottom:22 }}>
            <label className="label" style={{ marginBottom:8, display:'block' }}>Who can access this meeting?</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { value:'everyone', icon:<Globe size={14}/>, label:'Everyone in workspace', desc:'All workspace members can open this meeting' },
                { value:'restricted', icon:<Lock size={14}/>, label:'Restricted', desc:'Only people you invite can open this meeting' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setVisibility(opt.value)}
                  style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:'var(--radius-sm)', textAlign:'left', cursor:'pointer', fontFamily:'inherit', background: visibility===opt.value ? 'var(--accent-subtle)' : 'var(--surface-inset)', border:`1px solid ${visibility===opt.value ? 'var(--accent-border)' : 'var(--border)'}`, transition:'all 0.15s' }}>
                  <div style={{ color: visibility===opt.value ? 'var(--accent)' : 'var(--text-muted)', flexShrink:0 }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontSize:'0.85rem', fontWeight:600, color: visibility===opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:1 }}>{opt.desc}</div>
                  </div>
                  <div style={{ marginLeft:'auto', width:16, height:16, borderRadius:'50%', border:`2px solid ${visibility===opt.value ? 'var(--accent)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {visibility===opt.value && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* People with access */}
          {visibility === 'restricted' && (
            <div>
              <label className="label" style={{ marginBottom:8, display:'block' }}>People with access</label>
              {members.length === 0 ? (
                <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>No other members in this workspace.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:220, overflowY:'auto' }}>
                  {members.map(member => {
                    const has = isAllowed(member._id);
                    const isCreator = member._id?.toString() === meeting.createdBy?._id?.toString();
                    return (
                      <div key={member._id} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:'var(--radius-sm)', background:'var(--surface-inset)', border:'1px solid var(--border)' }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'white', flexShrink:0 }}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5 }}>
                            {member.name}
                            {isCreator && <span className="badge badge-blue">Organizer</span>}
                          </div>
                          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{member.email}</div>
                        </div>
                        <button
                          disabled={isCreator}
                          onClick={() => toggleMember(member)}
                          style={{ fontSize:'0.72rem', fontWeight:600, padding:'4px 11px', borderRadius:4, cursor: isCreator ? 'default' : 'pointer', transition:'all 0.15s', fontFamily:'inherit', background: has ? 'var(--green-bg)' : 'var(--surface-inset)', color: has ? 'var(--green-text)' : 'var(--accent)', border:`1px solid ${has ? 'var(--green-border)' : 'var(--accent-border)'}`, opacity: isCreator ? 0.5 : 1 }}>
                          {has ? 'Has access' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Access Denied Screen ────────────────────────────────────────── */
function AccessDenied({ meeting, onBack }) {
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const { data } = await api.post(`/meetings/${meeting._id}/request-access`);
      toast.success(data.message || 'Access request sent!');
      setRequested(true);
    } catch {
      toast.error('Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack}
        style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:'0.82rem', marginBottom:24, padding:0, transition:'color 0.15s', fontFamily:'inherit', fontWeight:600 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="anim-fade-up" style={{ maxWidth:480, margin:'60px auto 0', textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--red-bg)', border:'1px solid var(--red-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Lock size={30} style={{ color:'var(--red)' }} />
        </div>
        <p className="eyebrow" style={{ marginBottom:10 }}>Restricted meeting</p>
        <h1 style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.2, marginBottom:8 }}>
          {meeting.title}
        </h1>
        <p style={{ fontSize:'0.875rem', color:'var(--text-muted)', lineHeight:1.7, maxWidth:360, margin:'0 auto 28px' }}>
          You don't have access to this meeting.
          {meeting.createdBy?.name && (
            <> Request access from <strong style={{ color:'var(--text-primary)' }}>{meeting.createdBy.name}</strong>, the organizer.</>
          )}
        </p>

        {requested ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--radius-sm)', background:'var(--green-bg)', border:'1px solid var(--green-border)', color:'var(--green-text)', fontSize:'0.875rem', fontWeight:600 }}>
            ✓ Request sent
          </div>
        ) : (
          <button onClick={handleRequest} disabled={requesting} className="btn-secondary">
            {requesting ? 'Sending…' : 'Request Access'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main MeetingPage ────────────────────────────────────────────── */
export default function MeetingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [showManageAccess, setShowManageAccess] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => { return () => recognitionRef.current?.stop(); }, []);
  useEffect(() => { fetchMeeting(); }, [id]);

  const fetchMeeting = async () => {
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data.meeting);
      setWorkspace(data.workspace);
      setTranscript(data.meeting.transcript || '');
      setAccessDenied(false);
    } catch (err) {
      if (err.response?.status === 403 && err.response.data?.accessDenied) {
        setMeeting(err.response.data.meeting);
        setAccessDenied(true);
      } else {
        toast.error('Failed to load meeting');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTranscript = async () => {
    setSaving(true);
    try { await api.put(`/meetings/${id}`, { transcript }); toast.success('Saved'); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const generateMoM = async () => {
    if (!transcript || transcript.trim().length < 50)
      return toast.error('Add a transcript first (min 50 characters)');
    setGenerating(true);
    try {
      await api.put(`/meetings/${id}`, { transcript });
      await api.post(`/meetings/${id}/generate-mom`);
      toast.success('MoM generated!');
      navigate(`/meeting/${id}/mom`);
    } catch (err) { toast.error(err.response?.data?.message || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast.error('Use Chrome or Edge for voice recording.');
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let final = '', inter = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else inter += event.results[i][0].transcript;
      }
      if (final) setTranscript(prev => prev + (prev.trim() ? ' ' : '') + final.trim());
      setInterim(inter);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') toast.error('Microphone access denied.');
      else if (e.error !== 'no-speech') toast.error(`Error: ${e.error}`);
      setIsRecording(false); setInterim('');
    };
    rec.onend = () => { setIsRecording(false); setInterim(''); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    toast.success('Recording started');
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); setInterim(''); };

  const canManageAccess = meeting && !accessDenied && (
    meeting.createdBy?._id?.toString() === user?._id?.toString() ||
    workspace?.createdBy?.toString() === user?._id?.toString()
  );

  if (loading) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading…</div>;
  if (!meeting) return null;
  if (accessDenied) return <AccessDenied meeting={meeting} onBack={() => navigate(-1)} />;

  return (
    <div>
      <button onClick={() => navigate(`/workspace/${meeting.workspace?._id || meeting.workspace}`)}
        style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:'0.82rem', marginBottom:24, padding:0, transition:'color 0.15s', fontFamily:'inherit', fontWeight:600 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Meeting Header */}
      <div className="anim-fade-up" style={{ paddingBottom:32, borderBottom:'1px solid var(--border)', marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
          <p className="eyebrow">Meeting</p>
          {meeting.visibility === 'restricted' ? (
            <span className="badge badge-amber"><Lock size={9} /> Restricted</span>
          ) : (
            <span className="badge badge-ghost"><Globe size={9} /> Everyone</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'clamp(20px,2.8vw,32px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.1 }}>
              {meeting.title}
            </h1>
            <div style={{ display:'flex', gap:12, fontSize:'0.8rem', color:'var(--text-muted)', marginTop:7, flexWrap:'wrap' }}>
              <span>{format(new Date(meeting.date), 'EEEE, MMMM d, yyyy · h:mm a')}</span>
              {meeting.venue && <span>📍 {meeting.venue}</span>}
            </div>
            {meeting.attendees?.length > 0 && (
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:3 }}>👥 {meeting.attendees.join(', ')}</p>
            )}
          </div>
          <div style={{ display:'flex', gap:7, flexShrink:0, flexWrap:'wrap' }}>
            {canManageAccess && (
              <button onClick={() => setShowManageAccess(true)} className="btn-secondary" style={{ fontSize:'0.82rem' }}>
                <Shield size={13} /> Manage Access
              </button>
            )}
            {meeting.status === 'finalized' && (
              <button onClick={() => navigate(`/meeting/${id}/mom`)} className="btn-secondary" style={{ fontSize:'0.82rem' }}>
                <FileText size={13} /> View MoM
              </button>
            )}
            <button onClick={generateMoM} disabled={generating} className="btn-accent" style={{ fontSize:'0.82rem' }}>
              <Sparkles size={13} />
              {generating ? 'Generating…' : meeting.status === 'finalized' ? 'Regenerate MoM' : 'Generate MoM'}
            </button>
          </div>
        </div>
      </div>

      {/* Transcript card */}
      <div className="anim-fade-up delay-1 card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <ClipboardPaste size={15} style={{ color:'var(--accent)' }} />
            <h2 style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)', letterSpacing:'-0.01em' }}>Meeting Transcript</h2>
          </div>
          <button onClick={saveTranscript} disabled={saving}
            style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', opacity: saving ? 0.5 : 1, transition:'opacity 0.15s', fontFamily:'inherit' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
          Paste a transcript or use the microphone to record live. AI will extract agenda items, decisions, and action items.
        </p>

        {/* Voice recording control */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:'var(--radius-sm)', marginBottom:14, background: isRecording ? 'var(--red-bg)' : 'var(--surface-inset)', border:`1px solid ${isRecording ? 'var(--red-border)' : 'var(--border)'}`, transition:'all 0.3s ease' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            {isRecording && <div style={{ position:'absolute', inset:-7, borderRadius:'50%', background:'var(--red-bg)', animation:'pulse-soft 1.2s ease-in-out infinite' }} />}
            <div style={{ width:36, height:36, borderRadius:'50%', position:'relative', zIndex:1, background: isRecording ? 'var(--red-bg)' : 'var(--bg-primary)', border:`1px solid ${isRecording ? 'var(--red-border)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>
              {isRecording ? <Mic size={15} style={{ color:'var(--red)' }} /> : <MicOff size={15} style={{ color:'var(--text-muted)' }} />}
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            {isRecording ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', display:'inline-block', animation:'pulse-soft 1s ease-in-out infinite' }} />
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--red)' }}>Recording…</span>
                </div>
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:1 }}>Speaking in real time — words appear in the transcript below</p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)' }}>Voice to Text</span>
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:1 }}>Record meeting audio and convert it to transcript automatically</p>
              </div>
            )}
          </div>
          {isRecording ? (
            <button onClick={stopRecording} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:'var(--radius-sm)', flexShrink:0, background:'var(--red-bg)', color:'var(--red)', border:'1px solid var(--red-border)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', transition:'background 0.15s', fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--red-bg)'}>
              <Square size={11} fill="currentColor" /> Stop
            </button>
          ) : (
            <button onClick={startRecording} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:'var(--radius-sm)', flexShrink:0, background:'var(--accent-subtle)', color:'var(--accent)', border:'1px solid var(--accent-border)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', transition:'background 0.15s', fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-subtle)'}>
              <Mic size={13} /> Start Recording
            </button>
          )}
        </div>

        {/* Live interim */}
        {isRecording && interim && (
          <div style={{ padding:'9px 12px', borderRadius:'var(--radius-sm)', marginBottom:10, background:'var(--red-bg)', border:'1px dashed var(--red-border)', fontSize:'0.8rem', color:'var(--red-text)', fontStyle:'italic', fontFamily:'monospace', lineHeight:1.6 }}>
            {interim}
            <span style={{ display:'inline-block', width:2, height:'0.9em', background:'var(--red)', marginLeft:3, verticalAlign:'middle', animation:'pulse-soft 0.8s ease-in-out infinite' }} />
          </div>
        )}

        <textarea className="input mono"
          rows={14}
          style={{ resize:'none', fontSize:'0.8rem', lineHeight:1.75, fontFamily:"'JetBrains Mono','Fira Code',monospace", borderColor: isRecording ? 'var(--red-border)' : undefined, transition:'border-color 0.3s' }}
          placeholder={`Paste your meeting transcript here or use the microphone above…\n\nExample:\nJohn: Let's discuss the Q2 marketing plan.\nSarah: I've prepared a proposal with a 20% increase in digital ads.\nJohn: Sarah, can you finalize the budget doc by Friday?\nSarah: Sure, I'll have it done by Friday.`}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
        />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'monospace' }}>{transcript.length} chars</span>
            {transcript.length > 0 && (
              <button onClick={() => { if (confirm('Clear the transcript?')) setTranscript(''); }}
                style={{ fontSize:'0.72rem', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', transition:'color 0.15s', fontFamily:'inherit', fontWeight:600 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>Clear</button>
            )}
          </div>
          <button onClick={generateMoM} disabled={generating || !transcript.trim()} className="btn-accent" style={{ fontSize:'0.82rem' }}>
            <Sparkles size={13} />
            {generating ? 'Generating…' : 'Generate MoM with AI'}
          </button>
        </div>
      </div>

      {/* Manage Access modal */}
      {showManageAccess && meeting && workspace && (
        <ManageAccessModal
          meeting={meeting}
          workspace={workspace}
          currentUserId={user?._id}
          onClose={() => setShowManageAccess(false)}
          onSaved={(updated) => setMeeting(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
