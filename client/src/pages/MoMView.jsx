import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, RefreshCw, Users, FileText, CheckSquare, Zap, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIORITY = {
  high:   { label:'High',   bg:'var(--red-bg)',   color:'var(--red-text)',   border:'var(--red-border)',   bar:'var(--red)' },
  medium: { label:'Medium', bg:'var(--amber-bg)', color:'var(--amber-text)', border:'var(--amber-border)', bar:'var(--amber)' },
  low:    { label:'Low',    bg:'var(--green-bg)', color:'var(--green-text)', border:'var(--green-border)', bar:'var(--green)' },
};
const IMPACT = {
  high:   { bg:'var(--red-bg)',     color:'var(--red-text)',   border:'var(--red-border)',   label:'High Impact' },
  medium: { bg:'var(--accent-subtle)', color:'var(--accent)', border:'var(--accent-border)', label:'Med Impact' },
  low:    { bg:'var(--surface-inset)', color:'var(--text-muted)', border:'var(--border)', label:'Low Impact' },
};

const TH = { background:'var(--surface-inset)', color:'var(--text-muted)', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', padding:'10px 16px', textAlign:'left', whiteSpace:'nowrap' };
const TD = { padding:'11px 16px', fontSize:'0.85rem', color:'var(--text-primary)', borderBottom:'1px solid var(--border)' };

function PriorityBadge({ level }) {
  const p = PRIORITY[level] || PRIORITY.medium;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.65rem', fontWeight:700, padding:'2px 9px', borderRadius:4, background:p.bg, color:p.color, border:`1px solid ${p.border}`, textTransform:'uppercase', letterSpacing:'0.04em' }}>
      {level === 'high' && <AlertTriangle size={9} />}
      {level === 'medium' && <Zap size={9} />}
      {level === 'low' && <Info size={9} />}
      {p.label}
    </span>
  );
}

function PriorityChart({ actionItems }) {
  const counts = { high:0, medium:0, low:0 };
  actionItems.forEach(a => { counts[a.priority] = (counts[a.priority]||0)+1; });
  const total = actionItems.length || 1;
  return (
    <div className="card" style={{ marginBottom:20 }}>
      <h2 style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)', marginBottom:18, display:'flex', alignItems:'center', gap:7 }}>
        <Zap size={14} style={{ color:'var(--amber)' }} /> Priority Distribution
      </h2>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
        {['high','medium','low'].map(level => {
          const p = PRIORITY[level];
          const pct = Math.round((counts[level]/total)*100);
          return (
            <div key={level} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'0.72rem', fontWeight:600, width:52, color:p.color, flexShrink:0 }}>{p.label}</span>
              <div style={{ flex:1, background:'var(--bg-secondary)', borderRadius:3, height:6, overflow:'hidden' }}>
                <div style={{ height:6, borderRadius:3, background:p.bar, width:`${pct}%`, transition:'width 0.6s ease' }} />
              </div>
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', width:76, textAlign:'right', flexShrink:0 }}>{counts[level]} ({pct}%)</span>
            </div>
          );
        })}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {['high','medium','low'].map(level => {
          const p = PRIORITY[level];
          return (
            <div key={level} style={{ borderRadius:'var(--radius-sm)', padding:'14px 10px', textAlign:'center', background:p.bg, border:`1px solid ${p.border}` }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:p.color, letterSpacing:'-0.03em' }}>{counts[level]}</div>
              <div style={{ fontSize:'0.68rem', color:p.color, marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 }}>{p.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MoMView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => { fetchMeeting(); }, [id]);

  const fetchMeeting = async () => {
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data.meeting);
      setTranscript(data.meeting.transcript || '');
      if (data.meeting.mom?.content) {
        try {
          const raw = data.meeting.mom.content.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
          setMom(JSON.parse(raw));
        } catch { setMom(null); }
      }
    } catch { toast.error('Failed to load MoM'); }
    finally { setLoading(false); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try { await api.post(`/meetings/${id}/generate-mom`); await fetchMeeting(); toast.success('Regenerated!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRegenerating(false); }
  };

  const handleDownload = () => {
    if (!mom) return;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const accent = [75,94,255], dark=[26,26,46], muted=[102,102,153];

    const addSection = (title) => {
      if (y > doc.internal.pageSize.getHeight()-80) { doc.addPage(); y = margin; }
      y += 18;
      doc.setFillColor(...accent); doc.rect(margin, y, 3, 14, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...accent);
      doc.text(title, margin+10, y+11); y += 26;
    };
    const addText = (text, opts={}) => {
      const { size=10, color=dark, bold=false, indent=0 } = opts;
      doc.setFontSize(size); doc.setTextColor(...color); doc.setFont('helvetica', bold?'bold':'normal');
      doc.setCharSpace(0);
      const lines = doc.splitTextToSize(text||'', contentW-indent);
      lines.forEach(line => {
        if (y > doc.internal.pageSize.getHeight()-60) { doc.addPage(); y=margin; }
        doc.text(line, margin+indent, y, { charSpace: 0, maxWidth: contentW-indent });
        y += size*1.6;
      });
    };

    doc.setFillColor(45,47,143); doc.rect(0,0,pageW,90,'F');
    doc.setFillColor(127,212,75); doc.rect(0,0,4,90,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(255,255,255);
    doc.text('Minutes of Meeting', margin, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(200,204,255);
    const sub = [mom.meetingDetails?.title, mom.meetingDetails?.date, mom.meetingDetails?.venue].filter(Boolean).join('  ·  ');
    doc.text(sub, margin, 56);
    if (meeting.mom?.generatedAt) doc.text(`Generated: ${format(new Date(meeting.mom.generatedAt), 'MMM d, yyyy · h:mm a')}`, margin, 72);
    doc.setCharSpace(0);
    y = 110;

    addSection('MEETING DETAILS');
    [['Title',mom.meetingDetails?.title||'—'],['Date',mom.meetingDetails?.date||'—'],['Venue',mom.meetingDetails?.venue||'—'],['Organization',mom.meetingDetails?.organization||'—']].forEach(([l,v]) => {
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...muted); doc.text(l+':', margin, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(...dark); doc.text(v, margin+90, y); y+=16;
    });

    if (mom.attendees?.length > 0) { addSection('ATTENDEES'); addText(mom.attendees.join(', '), { color:[30,30,40] }); }
    if (mom.summary) { addSection('EXECUTIVE SUMMARY'); addText(mom.summary, { color:[30,40,80] }); }

    const pageH = doc.internal.pageSize.getHeight();
    const ensureSpace = (needed = 80) => { if (y > pageH - needed) { doc.addPage(); y = margin; } };

    if (mom.agendaItems?.length > 0) {
      addSection('AGENDA ITEMS');
      ensureSpace(80);
      autoTable(doc, { startY:y, margin:{left:margin,right:margin}, head:[['#','Agenda Item','Discussion']], body:mom.agendaItems.map((a,i)=>[i+1,a.item,a.discussion]), styles:{fontSize:9,cellPadding:7,textColor:[30,30,40]}, headStyles:{fillColor:accent,textColor:255,fontStyle:'bold',fontSize:9}, columnStyles:{0:{cellWidth:24},1:{cellWidth:140}}, alternateRowStyles:{fillColor:[238,239,254]}, theme:'striped' });
      y = doc.lastAutoTable.finalY + 16;
    }
    if (mom.decisions?.length > 0) {
      addSection('DECISIONS');
      ensureSpace(80);
      autoTable(doc, { startY:y, margin:{left:margin,right:margin}, head:[['#','Decision','Decided By','Impact']], body:mom.decisions.map((d,i)=>[i+1,d.decision,d.decidedBy||'—',(d.impact||'medium').toUpperCase()]), styles:{fontSize:9,cellPadding:7,textColor:[30,30,40]}, headStyles:{fillColor:[127,212,75],textColor:[26,26,46],fontStyle:'bold',fontSize:9}, columnStyles:{0:{cellWidth:24},2:{cellWidth:100},3:{cellWidth:70}}, alternateRowStyles:{fillColor:[238,239,254]}, theme:'striped' });
      y = doc.lastAutoTable.finalY + 16;
    }
    if (mom.actionItems?.length > 0) {
      addSection('ACTION ITEMS');
      ensureSpace(80);
      const pc = (p) => p==='high'?[220,38,38]:p==='low'?[61,138,26]:[180,83,9];
      autoTable(doc, { startY:y, margin:{left:margin,right:margin}, head:[['#','Task','Assigned To','Deadline','Priority']], body:mom.actionItems.sort((a,b)=>({high:0,medium:1,low:2}[a.priority]??1)-({high:0,medium:1,low:2}[b.priority]??1)).map((a,i)=>[i+1,a.task,a.assignedTo,a.deadline||'—',(a.priority||'medium').toUpperCase()]), styles:{fontSize:9,cellPadding:7,textColor:[30,30,40]}, headStyles:{fillColor:accent,textColor:255,fontStyle:'bold',fontSize:9}, columnStyles:{0:{cellWidth:24},2:{cellWidth:90},3:{cellWidth:70},4:{cellWidth:60}}, alternateRowStyles:{fillColor:[238,239,254]}, theme:'striped', didParseCell:(d)=>{ if(d.column.index===4&&d.section==='body'){d.cell.styles.textColor=pc(String(d.cell.raw).toLowerCase());d.cell.styles.fontStyle='bold';} } });
      y = doc.lastAutoTable.finalY + 16;
    }
    if (mom.closingNote) { addSection('CLOSING NOTE'); addText(mom.closingNote, { color:[60,60,80] }); }

    const tp = doc.internal.getNumberOfPages();
    for (let p=1; p<=tp; p++) {
      doc.setPage(p); const ph = doc.internal.pageSize.getHeight();
      doc.setFillColor(238,239,254); doc.rect(0,ph-32,pageW,32,'F');
      doc.setFontSize(8); doc.setTextColor(...muted);
      doc.text('Generated by minuteFlow', margin, ph-13);
      doc.text(`Page ${p} of ${tp}`, pageW-margin, ph-13, { align:'right' });
    }
    doc.save(`MoM_${meeting.title.replace(/\s+/g,'_')}_${format(new Date(meeting.date),'yyyy-MM-dd')}.pdf`);
  };

  const getAttendeeDialogue = (text, attendeeName) => {
    if (!text || !attendeeName) return { lines: [], mode: 'none' };

    const escaped = attendeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetRe = new RegExp(`^${escaped}(?:\\s*\\([^)]*\\))?\\s*:(.*)`, 'i');
    const anySpeakerRe = /^[A-Z][A-Za-z]{1,30}(?:\s[A-Z][A-Za-z]{1,30})*(?:\s*\([^)]*\))?\s*:/;

    const rawLines = text.split('\n');
    const result = [];
    let inBlock = false;

    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line) continue;

      const targetMatch = line.match(targetRe);
      if (targetMatch) {
        inBlock = true;
        const inline = targetMatch[1].trim();
        if (inline) result.push({ speaker: attendeeName, text: inline, isSpeaker: true });
        continue;
      }

      if (anySpeakerRe.test(line)) {
        inBlock = false;
        continue;
      }

      if (inBlock) {
        result.push({ speaker: attendeeName, text: line, isSpeaker: true });
      }
    }

    if (result.length > 0) return { lines: result, mode: 'speaker' };

    const mentionLines = rawLines
      .map(l => l.trim())
      .filter(l => l && l.toLowerCase().includes(attendeeName.toLowerCase()))
      .map(l => ({ speaker: null, text: l, isSpeaker: false }));
    return mentionLines.length > 0
      ? { lines: mentionLines, mode: 'mention' }
      : { lines: [], mode: 'none' };
  };

  const { lines: filteredLines, mode: dialogueMode } = selectedAttendee
    ? getAttendeeDialogue(transcript, selectedAttendee)
    : { lines: [], mode: 'none' };

  const filteredActionItems = selectedAttendee
    ? (mom?.actionItems || []).filter(a =>
        a.assignedTo?.toLowerCase().includes(selectedAttendee.toLowerCase()))
    : (mom?.actionItems || []);

  if (loading) return <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading…</div>;
  if (!meeting || !meeting.mom?.content || !mom) return (
    <div style={{ textAlign:'center', padding:'80px 0' }}>
      <p style={{ color:'var(--text-muted)', marginBottom:16 }}>No MoM generated yet.</p>
      <button onClick={() => navigate(`/meeting/${id}`)} className="btn-primary">Go back to meeting</button>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <button onClick={() => navigate(`/meeting/${id}`)}
        style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:'0.82rem', marginBottom:24, padding:0, transition:'color 0.15s', fontFamily:'inherit', fontWeight:600 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={14} /> Back to Meeting
      </button>

      {/* Header */}
      <div className="anim-fade-up" style={{ paddingBottom:28, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Minutes of Meeting</p>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)', lineHeight:1.15 }}>
              {mom.meetingDetails?.title}
            </h1>
            <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:4 }}>{mom.meetingDetails?.date} · {mom.meetingDetails?.venue}</p>
            {meeting.mom.generatedAt && <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>Generated {format(new Date(meeting.mom.generatedAt), 'MMM d, yyyy · h:mm a')}</p>}
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary" style={{ fontSize:'0.82rem' }}>
              <RefreshCw size={13} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button onClick={handleDownload} className="btn-accent" style={{ fontSize:'0.82rem' }}>
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Attendee filter chips */}
      {mom.attendees?.length > 0 && (
        <div className="anim-fade-up" style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginBottom:18 }}>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', flexShrink:0 }}>Filter by:</span>
          <button
            onClick={() => setSelectedAttendee(null)}
            style={{ padding:'4px 12px', borderRadius:4, fontSize:'0.75rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit', background: !selectedAttendee ? 'var(--accent)' : 'var(--surface-inset)', color: !selectedAttendee ? 'white' : 'var(--text-muted)' }}>
            All
          </button>
          {mom.attendees.map(name => (
            <button key={name}
              onClick={() => setSelectedAttendee(selectedAttendee === name ? null : name)}
              style={{ padding:'4px 12px', borderRadius:4, fontSize:'0.75rem', fontWeight:600, border: selectedAttendee === name ? 'none' : '1px solid var(--border)', cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit', background: selectedAttendee === name ? 'var(--accent)' : 'transparent', color: selectedAttendee === name ? 'white' : 'var(--text-muted)' }}>
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      {mom.summary && (
        <div className="anim-fade-up delay-1" style={{ background:'var(--accent-subtle)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius)', padding:20, marginBottom:18 }}>
          <h2 style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--accent)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            <FileText size={13} /> Executive Summary
          </h2>
          <p style={{ color:'var(--text-primary)', fontSize:'0.875rem', lineHeight:1.75 }}>{mom.summary}</p>
        </div>
      )}

      {/* Attendees */}
      {mom.attendees?.length > 0 && (
        <div className="anim-fade-up delay-2 card" style={{ marginBottom:18 }}>
          <h2 style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
            <Users size={13} style={{ color:'var(--accent)' }} /> Attendees
          </h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {mom.attendees.map((name,i) => (
              <span key={i} className="pill-tag">{name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Filtered dialogue */}
      {selectedAttendee && (
        <div className="anim-fade-up card" style={{ marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: filteredLines.length ? 14 : 6 }}>
            <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color:'white', flexShrink:0 }}>
              {selectedAttendee.charAt(0).toUpperCase()}
            </span>
            <h2 style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)' }}>
              {dialogueMode === 'mention' ? `Mentions of ${selectedAttendee}` : `${selectedAttendee}'s Dialogue`}
            </h2>
            <span style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:4, background:'var(--accent-subtle)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
              {filteredLines.length} {dialogueMode === 'mention' ? 'mentions' : 'lines'}
            </span>
          </div>
          {dialogueMode === 'mention' && (
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:10 }}>
              No speaker-labelled lines found — showing lines that mention {selectedAttendee}.
            </p>
          )}
          {filteredLines.length === 0 ? (
            <p style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
              {transcript ? `No lines found for ${selectedAttendee}. Make sure the transcript uses "Name: dialogue" format.` : 'No transcript saved for this meeting.'}
            </p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
              {filteredLines.map((l, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'9px 12px', borderRadius:'var(--radius-sm)', background:'var(--surface-inset)', border:'1px solid var(--border)' }}>
                  {l.isSpeaker && (
                    <span style={{ flexShrink:0, fontSize:'0.72rem', fontWeight:700, color:'var(--accent)', minWidth:76, paddingTop:2 }}>{l.speaker}</span>
                  )}
                  <p style={{ fontSize:'0.82rem', color:'var(--text-primary)', lineHeight:1.6 }}>{l.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agenda */}
      {mom.agendaItems?.length > 0 && (
        <div className="anim-fade-up card" style={{ marginBottom:18, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', display:'flex', alignItems:'center', gap:7, borderBottom:'1px solid var(--border)' }}>
            <FileText size={13} style={{ color:'var(--accent)' }} />
            <h2 style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Agenda Items</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={{ ...TH, width:36 }}>#</th>
                <th style={{ ...TH, width:'32%' }}>Item</th>
                <th style={TH}>Discussion</th>
              </tr></thead>
              <tbody>{mom.agendaItems.map((item,i) => (
                <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...TD, color:'var(--text-muted)' }}>{i+1}</td>
                  <td style={{ ...TD, color:'var(--text-primary)', fontWeight:600 }}>{item.item}</td>
                  <td style={TD}>{item.discussion}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decisions */}
      {mom.decisions?.length > 0 && (
        <div className="anim-fade-up card" style={{ marginBottom:18, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', display:'flex', alignItems:'center', gap:7, borderBottom:'1px solid var(--border)' }}>
            <CheckSquare size={13} style={{ color:'var(--green)' }} />
            <h2 style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Decisions</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={{ ...TH, width:36 }}>#</th>
                <th style={TH}>Decision</th>
                <th style={{ ...TH, width:130 }}>Decided By</th>
                <th style={{ ...TH, width:120, whiteSpace:'nowrap' }}>Impact</th>
              </tr></thead>
              <tbody>{mom.decisions.map((d,i) => {
                const imp = IMPACT[d.impact] || IMPACT.medium;
                return (
                  <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ ...TD, color:'var(--text-muted)' }}>{i+1}</td>
                    <td style={{ ...TD, color:'var(--text-primary)', fontWeight:600 }}>{d.decision}</td>
                    <td style={TD}>{d.decidedBy||'—'}</td>
                    <td style={{ ...TD, whiteSpace:'nowrap' }}><span style={{ fontSize:'0.65rem', fontWeight:700, padding:'2px 9px', borderRadius:4, background:imp.bg, color:imp.color, border:`1px solid ${imp.border}`, whiteSpace:'nowrap', display:'inline-block' }}>{imp.label}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Priority chart */}
      {filteredActionItems.length > 0 && <PriorityChart actionItems={filteredActionItems} />}

      {/* No tasks message when filtered */}
      {selectedAttendee && mom.actionItems?.length > 0 && filteredActionItems.length === 0 && (
        <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>
          No action items assigned to {selectedAttendee}.
        </div>
      )}

      {/* Action items */}
      {filteredActionItems.length > 0 && (
        <div className="anim-fade-up card" style={{ marginBottom:18, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px 12px', display:'flex', alignItems:'center', gap:7, borderBottom:'1px solid var(--border)' }}>
            <AlertTriangle size={13} style={{ color:'var(--red)' }} />
            <h2 style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Action Items</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={{ ...TH, width:36 }}>#</th>
                <th style={TH}>Task</th>
                <th style={{ ...TH, width:130 }}>Assigned To</th>
                <th style={{ ...TH, width:110 }}>Deadline</th>
                <th style={{ ...TH, width:90 }}>Priority</th>
              </tr></thead>
              <tbody>{filteredActionItems
                .sort((a,b)=>({high:0,medium:1,low:2}[a.priority]??1)-({high:0,medium:1,low:2}[b.priority]??1))
                .map((item,i) => {
                  const p = PRIORITY[item.priority] || PRIORITY.medium;
                  return (
                    <tr key={i} style={{ borderLeft:`3px solid ${p.bar}` }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ ...TD, color:'var(--text-muted)' }}>{i+1}</td>
                      <td style={{ ...TD, color:'var(--text-primary)', fontWeight:600 }}>{item.task}</td>
                      <td style={TD}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--accent-subtle)', color:'var(--accent)', fontSize:'0.76rem', padding:'3px 9px', borderRadius:4, border:'1px solid var(--accent-border)', fontWeight:600 }}>
                          <span style={{ width:17, height:17, borderRadius:'50%', background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.58rem', fontWeight:700 }}>
                            {item.assignedTo?.charAt(0)?.toUpperCase()||'?'}
                          </span>
                          {item.assignedTo}
                        </span>
                      </td>
                      <td style={{ ...TD, fontFamily:'monospace', fontSize:'0.78rem', color:'var(--text-muted)' }}>{item.deadline||'—'}</td>
                      <td style={TD}><PriorityBadge level={item.priority} /></td>
                    </tr>
                  );
                })
              }</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closing note */}
      {mom.closingNote && (
        <div className="card-light" style={{ marginBottom:18 }}>
          <h2 style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.07em' }}>Closing Note</h2>
          <p style={{ color:'var(--text-primary)', fontSize:'0.875rem', lineHeight:1.75 }}>{mom.closingNote}</p>
        </div>
      )}
    </div>
  );
}
