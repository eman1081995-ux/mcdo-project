'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function getFingerprint(): string {
    try {
      const stored = localStorage.getItem('mcdo_device_fp');
      if (stored) return stored;
      const fp = `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}-${Math.random().toString(36).slice(2)}`;
      const hash = btoa(fp).slice(0, 32);
      localStorage.setItem('mcdo_device_fp', hash);
      return hash;
    } catch { return Math.random().toString(36).slice(2); }
  }

  async function handleStartExam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !restaurant.trim()) { setError('يرجى إدخال الاسم واسم المطعم'); return; }
    setLoading(true); setError('');
    try {
      const fp = getFingerprint();
      const checkRes = await fetch('/api/student/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:name.trim(),restaurant:restaurant.trim(),deviceFingerprint:fp}) });
      const checkData = await checkRes.json();
      if (checkData.blocked) { setError('لقد أكملت هذا الامتحان مسبقاً. لا يمكن إعادته.'); setLoading(false); return; }
      const res = await fetch('/api/exam/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:name.trim(),restaurant:restaurant.trim(),deviceFingerprint:fp}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'حدث خطأ'); setLoading(false); return; }
      localStorage.setItem('mcdo_session', JSON.stringify({ studentId:data.studentId, name:name.trim(), restaurant:restaurant.trim(), questions:data.questions, examDurationMinutes:data.examDurationMinutes, startedAt:data.startedAt }));
      router.push('/welcome');
    } catch { setError('حدث خطأ في الاتصال.'); setLoading(false); }
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#DA291C 0%,#8B0000 60%,#1a1a1a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-100px',right:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(255,199,44,0.1)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-150px',left:'-150px',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none'}}/>
      <div style={{width:'100%',maxWidth:'480px',animation:'fadeIn 0.6s ease'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'90px',height:'90px',background:'#FFC72C',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 32px rgba(255,199,44,0.4)',fontSize:'48px',fontWeight:'900',color:'#DA291C'}}>M</div>
          <h1 style={{color:'#FFC72C',fontSize:'28px',fontWeight:'900',margin:'0 0 4px'}}>بوابة الامتحانات</h1>
          <p style={{color:'rgba(255,255,255,0.8)',fontSize:'16px',margin:0}}>ماكدونالدز مصر – نظام تدريب الكرو</p>
        </div>
        <div style={{background:'white',borderRadius:'24px',padding:'36px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          <h2 style={{fontSize:'22px',fontWeight:'800',color:'#1a1a1a',marginBottom:'8px',textAlign:'center'}}>تسجيل الدخول للامتحان</h2>
          <p style={{color:'#6B7280',fontSize:'14px',textAlign:'center',marginBottom:'28px'}}>أدخل بياناتك للبدء في الامتحان</p>
          {error && <div style={{background:'#FFEBEE',border:'1px solid #FFCDD2',borderRadius:'12px',padding:'12px 16px',marginBottom:'20px',color:'#B71C1C',fontSize:'14px'}}>⚠️ {error}</div>}
          <form onSubmit={handleStartExam}>
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'14px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>الاسم الكامل</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك الكامل" style={{width:'100%',padding:'14px 16px',border:'2px solid #E5E7EB',borderRadius:'12px',fontSize:'16px',fontFamily:'Tajawal,sans-serif',outline:'none',direction:'rtl',boxSizing:'border-box'}} required/>
            </div>
            <div style={{marginBottom:'28px'}}>
              <label style={{display:'block',fontSize:'14px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>اسم المطعم</label>
              <input type="text" value={restaurant} onChange={e=>setRestaurant(e.target.value)} placeholder="أدخل اسم المطعم أو رقمه" style={{width:'100%',padding:'14px 16px',border:'2px solid #E5E7EB',borderRadius:'12px',fontSize:'16px',fontFamily:'Tajawal,sans-serif',outline:'none',direction:'rtl',boxSizing:'border-box'}} required/>
            </div>
            <button type="submit" disabled={loading} style={{width:'100%',padding:'16px',background:loading?'#9CA3AF':'linear-gradient(135deg,#DA291C,#B71C1C)',color:'white',border:'none',borderRadius:'14px',fontSize:'18px',fontWeight:'800',fontFamily:'Tajawal,sans-serif',cursor:loading?'not-allowed':'pointer',boxShadow:loading?'none':'0 4px 20px rgba(218,41,28,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              {loading ? '⏳ جاري التحضير...' : '🚀 ابدأ الامتحان'}
            </button>
          </form>
          <div style={{marginTop:'20px',padding:'16px',background:'#FFF8E1',borderRadius:'12px',border:'1px solid #FFC72C'}}>
            <p style={{fontSize:'13px',color:'#92400E',margin:0,lineHeight:'1.6'}}>⚠️ <strong>تنبيه:</strong> يُسمح بأداء الامتحان مرة واحدة فقط. مدة الامتحان 60 دقيقة.</p>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:'20px'}}>
          <a href="/admin/login" style={{color:'rgba(255,255,255,0.5)',fontSize:'12px',textDecoration:'none'}}>دخول الإدارة</a>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
