import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Camera, User, Phone, FileText, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';

const SECTION = { marginBottom: 28 };
const CARD_HEAD = {
  display: 'flex', alignItems: 'center', gap: 8,
  paddingBottom: 14, marginBottom: 20,
  borderBottom: '1px solid var(--border)',
};

/* Resize image to max 200×200 and return compressed base64 */
const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 200;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:   user?.name   || '',
    phone:  user?.phone  || '',
    bio:    user?.bio    || '',
    avatar: user?.avatar || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch fresh profile data from DB on mount
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      updateUser(data.user);
      setForm({
        name:   data.user.name   || '',
        phone:  data.user.phone  || '',
        bio:    data.user.bio    || '',
        avatar: data.user.avatar || '',
      });
    }).catch(() => {});
  }, []);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw,    setSavingPw]    = useState(false);

  /* ── Avatar ────────────────────────────────────────────────── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    const b64 = await resizeImage(file);
    setForm(f => ({ ...f, avatar: b64 }));
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  /* ── Save profile ───────────────────────────────────────────── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Change password ────────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast.error('New passwords do not match');
    setSavingPw(true);
    try {
      const { data } = await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success(data.message);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Password strength ─────────────────────────────────────── */
  const pwStrength = (() => {
    const p = pwForm.newPassword;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const pwLabel  = [null, 'Weak', 'Fair', 'Good', 'Strong'][pwStrength ?? 0];
  const pwColor  = [null, 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--green)'][pwStrength ?? 0];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Page header */}
      <div className="anim-fade-up" style={{ paddingBottom: 32, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Account</p>
        <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
          Your Profile
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 5 }}>
          Manage your personal information and account security
        </p>
      </div>

      {/* ── Profile info form ─────────────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <div className="anim-fade-up delay-1 card" style={SECTION}>
          <div style={CARD_HEAD}>
            <User size={14} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Personal Information</h2>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {form.avatar ? (
                <img src={form.avatar} alt="avatar"
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'white', border: '2px solid var(--border)' }}>
                  {initials}
                </div>
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Camera size={11} color="white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Profile Photo</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Click the camera icon to upload.<br />JPG, PNG or GIF — max ~1MB
              </p>
              {form.avatar && (
                <button type="button" onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                  style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 600 }}>
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label className="label">Display name</label>
            <input className="input" placeholder="Your full name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Email (read-only) */}
          <div style={{ marginBottom: 14 }}>
            <label className="label">Email address</label>
            <input className="input" value={user?.email || ''} readOnly
              style={{ opacity: 0.55, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Email cannot be changed
            </p>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Phone size={11} /> Phone number
            </label>
            <input className="input" placeholder="+91 98765 43210" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={11} /> Bio
            </label>
            <textarea className="input" rows={3} placeholder="A short bio about yourself…"
              style={{ resize: 'none', lineHeight: 1.6 }}
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              <Save size={13} /> {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Change password ───────────────────────────────────── */}
      <form onSubmit={handleChangePassword}>
        <div className="anim-fade-up delay-2 card" style={SECTION}>
          <div style={CARD_HEAD}>
            <Shield size={14} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</h2>
          </div>

          {/* Current password */}
          <div style={{ marginBottom: 14 }}>
            <label className="label">Current password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div style={{ marginBottom: 8 }}>
            <label className="label">New password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showNew ? 'text' : 'password'}
                placeholder="Min. 6 characters" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Strength bar */}
          {pwForm.newPassword && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength ? pwColor : 'var(--border)', transition: 'background 0.3s' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.7rem', color: pwColor, fontWeight: 600 }}>{pwLabel}</span>
            </div>
          )}

          {/* Confirm password */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Confirm new password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password" value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                style={{ paddingRight: 40, borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'var(--red-border)' : undefined }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
              <p style={{ fontSize: '0.7rem', color: 'var(--red)', marginTop: 4, fontWeight: 600 }}>Passwords do not match</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={savingPw}>
              <Lock size={13} /> {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
