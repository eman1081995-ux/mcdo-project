'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'خطأ في تسجيل الدخول'); setLoading(false); return; }
      localStorage.setItem('admin_token', data.token);
      router.push('/admin/dashboard');
    } catch { setError('حدث خطأ في الاتصال'); setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1a1a1a 0%,#2d2d2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '70px', height: '70px', background: '#FFC72C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '36px', fontWeight: '900', color: '#DA291C' }}>M</div>
          <h1 style={{ color: '#FFC72C', fontSize: '22px', fontWeight: '900', margin: 0, fontFamily: 'Tajawal' }}>لوحة الإدارة</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: 'Tajawal' }}>ماكدونالدز مصر</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '24px', textAlign: 'center', fontFamily: 'Tajawal' }}>تسجيل دخول المدير</h2>
          {error && <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#B71C1C', fontSize: '14px', fontFamily: 'Tajawal' }}>⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', fontFamily: 'Tajawal' }}>اسم المستخدم</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '10px', fontSize: '15px', fontFamily: 'Tajawal', outline: 'none', direction: 'ltr', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', fontFamily: 'Tajawal' }}>كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '10px', fontSize: '15px', fontFamily: 'Tajawal', outline: 'none', direction: 'ltr', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#DA291C,#B71C1C)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '800', fontFamily: 'Tajawal', cursor: 'pointer' }}>
              {loading ? '⏳ جاري الدخول...' : '🔐 دخول'}
            </button>
          </form>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href="/" style={{ color: '#6B7280', fontSize: '13px', fontFamily: 'Tajawal', textDecoration: 'none' }}>← العودة لصفحة الطلاب</a>
          </div>
        </div>
      </div>
    </div>
  );
}
