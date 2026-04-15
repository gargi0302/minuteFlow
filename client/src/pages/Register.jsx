import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, ArrowRight } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-secondary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>

      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:36 }}>
        <div style={{ width:30, height:30, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FileText size={14} color="white" />
        </div>
        <span style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>minuteFlow</span>
      </Link>

      {/* Card */}
      <div className="anim-fade-up" style={{ width:'100%', maxWidth:400, background:'var(--bg-primary)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:32 }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:6 }}>
          Create your account
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:28, fontWeight:400 }}>
          AI-powered meeting minutes in seconds
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Full name</label>
            <input className="input" type="text" placeholder="Jane Smith"
              value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
          </div>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width:'100%', justifyContent:'center', marginTop:4, padding:'10px 16px' }}>
            {loading ? 'Creating account…' : <><span>Create Account</span> <ArrowRight size={15}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, color:'var(--text-muted)', fontSize:'0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
