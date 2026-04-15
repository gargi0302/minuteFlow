import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, ArrowRight } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
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
          Welcome back
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:28, fontWeight:400 }}>
          Sign in to access your meeting minutes
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width:'100%', justifyContent:'center', marginTop:4, padding:'10px 16px' }}>
            {loading ? 'Signing in…' : <><span>Sign In</span> <ArrowRight size={15}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, color:'var(--text-muted)', fontSize:'0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Sign up free</Link>
        </p>
      </div>

      <p style={{ marginTop:20, color:'var(--text-muted)', fontSize:'0.8rem' }}>
        Already have an account?{' '}
        <Link to="/register" style={{ color:'var(--accent)', fontWeight:500, textDecoration:'none' }}>Create one instead</Link>
      </p>
    </div>
  );
}
