'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('mcdo_session');
      if (s) {
        const parsed = JSON.parse(s);
        setName(parsed.name || '');
        setRestaurant(parsed.restaurant || '');
      }
    } catch { /* ignore */ }
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1B5E20 0%,#2E7D32 50%,#1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '100px', height: '100px', background: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(76,175,80,0.5)', fontSize: '52px' }}>
            ✅
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1B5E20', marginBottom: '12px', fontFamily: 'Tajawal', lineHeight: '1.5' }}>
            تم استلام الامتحان بنجاح
          </h1>

          {name && (
            <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #A5D6A7' }}>
              <p style={{ color: '#2E7D32', fontSize: '16px', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Tajawal' }}>{name}</p>
              {restaurant && <p style={{ color: '#388E3C', fontSize: '14px', margin: 0, fontFamily: 'Tajawal' }}>🏪 {restaurant}</p>}
            </div>
          )}

          <p style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '800', margin: '0 0 8px', fontFamily: 'Tajawal' }}>
            شكراً لك على أداء الامتحان
          </p>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', fontFamily: 'Tajawal', lineHeight: '1.7' }}>
            تم استلام إجاباتك بنجاح وسيتم مراجعتها من قبل المدرب المسؤول.
          </p>

          <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#374151', fontSize: '13px', margin: 0, fontFamily: 'Tajawal', lineHeight: '1.8' }}>
              📋 <strong>ما يحدث بعد ذلك:</strong><br />
              سيقوم مدربك بمراجعة نتيجتك وإخبارك بها في أقرب وقت.
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            style={{ width: '100%', padding: '14px', background: '#E8F5E9', border: '2px solid #4CAF50', borderRadius: '12px', fontSize: '16px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer', color: '#2E7D32' }}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>

        {/* McDonald's branding */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px' }}>
            <span style={{ color: '#FFC72C', fontWeight: '900', fontSize: '18px' }}>M</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontFamily: 'Tajawal' }}>ماكدونالدز مصر</span>
          </div>
        </div>
      </div>
    </div>
  );
}
