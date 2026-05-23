'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Question { id: string; question: string; choices: string[]; unit: string; unitAr: string; }
interface Session { studentId: string; name: string; restaurant: string; questions: Question[]; examDurationMinutes: number; startedAt: string; }

export default function ExamPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Anti-cheat: disable right click, copy, context menu
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('selectstart', prevent);

    // Tab switch detection
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Keyboard shortcuts disable
    const preventKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && ['c','v','a','s','p','u','f'].includes(e.key)) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    document.addEventListener('keydown', preventKeys);

    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('keydown', preventKeys);
    };
  }, []);

  // Load session
  useEffect(() => {
    try {
      const s = localStorage.getItem('mcdo_session');
      if (!s) { router.push('/'); return; }
      const parsed = JSON.parse(s) as Session;
      if (!parsed.studentId || !parsed.questions?.length) { router.push('/'); return; }
      setSession(parsed);

      // Restore answers
      const savedAnswers = localStorage.getItem(`mcdo_answers_${parsed.studentId}`);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

      // Restore position
      const savedPos = localStorage.getItem(`mcdo_pos_${parsed.studentId}`);
      if (savedPos) setCurrent(parseInt(savedPos));

      // Calculate remaining time
      const startTime = new Date(parsed.startedAt).getTime();
      const totalMs = parsed.examDurationMinutes * 60 * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((totalMs - elapsed) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) handleAutoSubmit(parsed.studentId, {});
    } catch { router.push('/'); }
  }, [router]);

  // Timer
  useEffect(() => {
    if (!session || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(session.studentId, answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, submitted, answers]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!session || submitted) return;
    saveInterval.current = setInterval(() => {
      saveProgress(session.studentId, answers, tabSwitches);
    }, 10000);
    return () => { if (saveInterval.current) clearInterval(saveInterval.current); };
  }, [session, answers, tabSwitches, submitted]);

  async function saveProgress(studentId: string, ans: Record<string, number>, tabs: number) {
    try {
      localStorage.setItem(`mcdo_answers_${studentId}`, JSON.stringify(ans));
      await fetch('/api/exam/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, answers: ans, tabSwitches: tabs }),
      });
    } catch { /* ignore */ }
  }

  async function handleAutoSubmit(studentId: string, ans: Record<string, number>) {
    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, answers: ans, autoSubmit: true }),
      });
      setSubmitted(true);
      router.push('/result');
    } catch { /* ignore */ }
  }

  async function handleSubmit() {
    if (!session) return;
    const unanswered = session.questions.filter(q => answers[q.id] === undefined).length;
    if (unanswered > 0) {
      alert(`لا يزال هناك ${unanswered} سؤال لم تجب عليه. يرجى الإجابة على جميع الأسئلة قبل التسليم.`);
      return;
    }
    setShowSubmitConfirm(true);
  }

  async function confirmSubmit() {
    if (!session) return;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: session.studentId, answers, tabSwitches, autoSubmit: false }),
      });
      localStorage.removeItem(`mcdo_answers_${session.studentId}`);
      router.push('/result');
    } catch {
      setSubmitting(false);
      alert('حدث خطأ في التسليم. يرجى المحاولة مرة أخرى.');
    }
  }

  function selectAnswer(questionId: string, choiceIdx: number) {
    const newAnswers = { ...answers, [questionId]: choiceIdx };
    setAnswers(newAnswers);
    if (session) localStorage.setItem(`mcdo_answers_${session.studentId}`, JSON.stringify(newAnswers));
    if (session) localStorage.setItem(`mcdo_pos_${session.studentId}`, String(current));
  }

  function navigate(idx: number) {
    setCurrent(idx);
    if (session) localStorage.setItem(`mcdo_pos_${session.studentId}`, String(idx));
  }

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #DA291C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontFamily: 'Tajawal' }}>جاري تحميل الامتحان...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const q = session.questions[current];
  const answered = Object.keys(answers).length;
  const total = session.questions.length;
  const progress = (answered / total) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft < 300;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
      {/* Watermark */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: `${(i % 4) * 30}%`, left: `${Math.floor(i / 4) * 40}%`, transform: 'rotate(-30deg)', opacity: 0.04, fontSize: '18px', fontWeight: '900', color: '#DA291C', whiteSpace: 'nowrap' }}>
            {session.name} | {session.restaurant}
          </div>
        ))}
      </div>

      {/* Tab switch warning */}
      {showTabWarning && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#B71C1C', color: 'white', padding: '12px 24px', borderRadius: '12px', zIndex: 1000, fontFamily: 'Tajawal', fontWeight: '700', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          ⚠️ تم تسجيل تغيير التبويب! (المرة {tabSwitches})
        </div>
      )}

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '12px', fontFamily: 'Tajawal' }}>تأكيد تسليم الامتحان</h3>
            <p style={{ color: '#6B7280', marginBottom: '24px', fontFamily: 'Tajawal', lineHeight: '1.6' }}>
              هل أنت متأكد من تسليم الامتحان؟<br/>أجبت على <strong>{answered}</strong> من <strong>{total}</strong> سؤال
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setShowSubmitConfirm(false)} style={{ padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '12px', fontFamily: 'Tajawal', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>
                العودة
              </button>
              <button onClick={confirmSubmit} style={{ padding: '12px', background: 'linear-gradient(135deg,#DA291C,#B71C1C)', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Tajawal', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>
                تسليم نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '3px solid #DA291C', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: '#FFC72C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#DA291C', fontSize: '18px' }}>M</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a1a', fontFamily: 'Tajawal' }}>{session.name}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'Tajawal' }}>{session.restaurant}</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', fontFamily: 'Tajawal' }}>السؤال {current + 1} / {total}</div>
          <div style={{ fontSize: '13px', color: '#27AE60', fontFamily: 'Tajawal' }}>أُجيب عليه: {answered}</div>
        </div>

        <div style={{ textAlign: 'center', background: isWarning ? '#FFEBEE' : '#F3F4F6', padding: '8px 16px', borderRadius: '12px', border: isWarning ? '2px solid #EF4444' : '2px solid #E5E7EB' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: isWarning ? '#DA291C' : '#1a1a1a', fontFamily: 'Cairo', letterSpacing: '2px' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'Tajawal' }}>الوقت المتبقي</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: '#E5E7EB' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#DA291C,#FFC72C)', transition: 'width 0.3s' }} />
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Unit badge */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ background: '#FFF8E1', color: '#92400E', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: '1px solid #FFC72C', fontFamily: 'Tajawal' }}>
            📚 {q.unitAr}
          </span>
        </div>

        {/* Question */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #F3F4F6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 24px', lineHeight: '1.7', fontFamily: 'Tajawal', direction: 'rtl' }}>
            <span style={{ color: '#DA291C', marginLeft: '8px' }}>س{current + 1}.</span>
            {q.question}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {q.choices.map((choice, idx) => {
              const isSelected = answers[q.id] === idx;
              const letters = ['أ', 'ب', 'ج', 'د'];
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(q.id, idx)}
                  style={{
                    width: '100%', padding: '14px 18px', border: `2px solid ${isSelected ? '#DA291C' : '#E5E7EB'}`,
                    borderRadius: '14px', background: isSelected ? '#FFF3F2' : 'white', cursor: 'pointer',
                    textAlign: 'right', fontSize: '16px', fontFamily: 'Tajawal', color: isSelected ? '#B71C1C' : '#374151',
                    display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                    fontWeight: isSelected ? '700' : '400',
                  }}
                  onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#FFC72C'; (e.currentTarget as HTMLButtonElement).style.background = '#FFF8E1'; } }}
                  onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.background = 'white'; } }}
                >
                  <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#DA291C' : '#F3F4F6', color: isSelected ? 'white' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                    {letters[idx]}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => navigate(Math.max(0, current - 1))} disabled={current === 0} style={{ flex: 1, padding: '14px', background: current === 0 ? '#F3F4F6' : 'white', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '16px', fontFamily: 'Tajawal', fontWeight: '700', cursor: current === 0 ? 'not-allowed' : 'pointer', color: current === 0 ? '#9CA3AF' : '#374151' }}>
            ← السابق
          </button>
          {current < total - 1 ? (
            <button onClick={() => navigate(Math.min(total - 1, current + 1))} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#DA291C,#B71C1C)', border: 'none', borderRadius: '12px', fontSize: '16px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer', color: 'white' }}>
              التالي →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#27AE60,#1B5E20)', border: 'none', borderRadius: '12px', fontSize: '16px', fontFamily: 'Tajawal', fontWeight: '800', cursor: 'pointer', color: 'white' }}>
              ✅ تسليم الامتحان
            </button>
          )}
        </div>

        {/* Question navigator */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '16px', fontFamily: 'Tajawal' }}>
            🗺️ خريطة الأسئلة
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {session.questions.map((sq, idx) => (
              <button
                key={sq.id}
                onClick={() => navigate(idx)}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: idx === current ? '#DA291C' : answers[sq.id] !== undefined ? '#27AE60' : '#E5E7EB',
                  color: idx === current || answers[sq.id] !== undefined ? 'white' : '#6B7280',
                  fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo',
                  transition: 'all 0.15s',
                }}
              >{idx + 1}</button>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'Tajawal' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#27AE60', display: 'inline-block' }} /> تمت الإجابة ({answered})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E5E7EB', display: 'inline-block' }} /> لم تتم الإجابة ({total - answered})
            </span>
          </div>
        </div>

        {/* Submit button (visible always) */}
        {answered === total && (
          <button onClick={handleSubmit} disabled={submitting} style={{ marginTop: '16px', width: '100%', padding: '18px', background: 'linear-gradient(135deg,#27AE60,#1B5E20)', border: 'none', borderRadius: '14px', fontSize: '20px', fontFamily: 'Tajawal', fontWeight: '900', cursor: 'pointer', color: 'white', boxShadow: '0 4px 20px rgba(39,174,96,0.5)' }}>
            ✅ تسليم الامتحان النهائي
          </button>
        )}
      </div>
    </div>
  );
}
