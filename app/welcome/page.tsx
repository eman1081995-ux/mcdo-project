'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [session, setSession] = useState<{ name: string; restaurant: string; examDurationMinutes: number } | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('mcdo_session');
      if (!s) { router.push('/'); return; }
      const parsed = JSON.parse(s);
      if (!parsed.studentId) { router.push('/'); return; }
      setSession(parsed);
    } catch { router.push('/'); }
  }, [router]);

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#DA291C 0%,#8B0000 60%,#1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', background: '#FFC72C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '40px', fontWeight: '900', color: '#DA291C', boxShadow: '0 8px 32px rgba(255,199,44,0.4)' }}>M</div>
          <h1 style={{ color: '#FFC72C', fontSize: '26px', fontWeight: '900', margin: 0 }}>ماكدونالدز مصر</h1>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{ color: '#6B7280', margin: '0 0 8px', fontSize: '14px' }}>مرحباً بك</p>
            <h2 style={{ color: '#DA291C', fontSize: '28px', fontWeight: '900', margin: '0 0 4px' }}>{session.name}</h2>
            <p style={{ color: '#374151', fontSize: '16px', margin: 0 }}>🏪 {session.restaurant}</p>
          </div>

          <div style={{ background: '#FFF8E1', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '2px solid #FFC72C' }}>
            <h3 style={{ color: '#92400E', fontSize: '18px', fontWeight: '800', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 تعليمات الامتحان
            </h3>
            <ul style={{ margin: 0, padding: '0 20px', color: '#374151', fontSize: '15px', lineHeight: '2' }}>
              <li>مدة الامتحان: <strong>{session.examDurationMinutes} دقيقة</strong></li>
              <li>يتكون الامتحان من <strong>55 سؤال</strong> اختيار من متعدد</li>
              <li>لكل سؤال <strong>4 اختيارات</strong>، اختر الإجابة الصحيحة فقط</li>
              <li>يمكنك التنقل بين الأسئلة بحرية</li>
              <li><strong>لا يمكن تسليم الامتحان</strong> إلا بعد الإجابة على جميع الأسئلة</li>
              <li>ستنتهي صلاحية الامتحان تلقائياً عند انتهاء الوقت</li>
              <li>في حال إغلاق المتصفح، يمكنك الرجوع والاستمرار من نفس السؤال</li>
            </ul>
          </div>

          <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '16px', marginBottom: '28px', border: '1px solid #FFCDD2' }}>
            <p style={{ color: '#B71C1C', fontSize: '14px', margin: 0, lineHeight: '1.7' }}>
              ⚠️ <strong>تحذير:</strong> لا يُسمح بالنسخ أو تغيير التبويب أثناء الامتحان. يتم تسجيل جميع الأنشطة المشبوهة.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#DA291C' }}>{session.examDurationMinutes}</div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>دقيقة</div>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#DA291C' }}>55</div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>سؤال</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/exam')}
            style={{ marginTop: '24px', width: '100%', padding: '18px', background: 'linear-gradient(135deg,#DA291C,#B71C1C)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '20px', fontWeight: '900', fontFamily: 'Tajawal,sans-serif', cursor: 'pointer', boxShadow: '0 4px 20px rgba(218,41,28,0.5)' }}
          >
            🎯 ابدأ الامتحان الآن
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
