'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ExamQuestion { id: string; question: string; choices: string[]; correctAnswer: number; unit: string; unitAr: string; }
interface Student {
  id: string; name: string; restaurant: string; startedAt: string; submittedAt?: string;
  score?: number; totalQuestions?: number; percentage?: number; passed?: boolean;
  timeSpent?: number; tabSwitches?: number; status: string;
  answers?: Record<string, number>;
  examModel?: { questions: ExamQuestion[] };
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ passingPercentage: number } | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'questions'>('overview');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/admin/login'); return; }
    try {
      const [studentRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/results?type=student&id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (studentRes.status === 401) { router.push('/admin/login'); return; }
      const [s, setts] = await Promise.all([studentRes.json(), settingsRes.json()]);
      setStudent(s);
      setSettings(setts);
    } catch { router.push('/admin/dashboard'); }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #DA291C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p>جاري التحميل...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!student) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Tajawal' }}>الطالب غير موجود</div>;

  const questions = student.examModel?.questions || [];
  const answers = student.answers || {};
  const passingPct = settings?.passingPercentage || 80;

  // Weakness analysis per unit
  const unitStats: Record<string, { correct: number; total: number; unitAr: string }> = {};
  for (const q of questions) {
    if (!unitStats[q.unit]) unitStats[q.unit] = { correct: 0, total: 0, unitAr: q.unitAr };
    unitStats[q.unit].total++;
    if (answers[q.id] === q.correctAnswer) unitStats[q.unit].correct++;
  }
  const weaknessData = Object.values(unitStats).map(u => ({ ...u, percentage: Math.round(u.correct / u.total * 100) })).sort((a, b) => a.percentage - b.percentage);

  const formatTime = (secs?: number) => {
    if (!secs) return '-';
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m} دقيقة و ${s} ثانية`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Tajawal', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#DA291C,#B71C1C)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Tajawal', fontSize: '14px' }}>
          → العودة
        </button>
        <div style={{ color: 'white' }}>
          <div style={{ fontWeight: '900', fontSize: '18px' }}>{student.name}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{student.restaurant}</div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Summary card */}
        <div style={{ background: student.passed ? '#E8F5E9' : student.passed === false ? '#FFEBEE' : '#F3F4F6', borderRadius: '20px', padding: '24px', marginBottom: '24px', border: `2px solid ${student.passed ? '#4CAF50' : student.passed === false ? '#EF4444' : '#9CA3AF'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: student.passed ? '#2E7D32' : student.passed === false ? '#C62828' : '#374151' }}>
                {student.percentage !== undefined ? `${student.percentage}%` : '-'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: student.passed ? '#2E7D32' : student.passed === false ? '#C62828' : '#374151' }}>
                {student.passed === true ? '✅ ناجح' : student.passed === false ? '❌ راسب' : '⏳ في التقدم'}
              </div>
              {student.score !== undefined && (
                <div style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
                  {student.score} من {student.totalQuestions} سؤال صحيح
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'وقت الامتحان', value: formatTime(student.timeSpent) },
                { label: 'تبديل التبويب', value: String(student.tabSwitches || 0) },
                { label: 'حد النجاح', value: `${passingPct}%` },
                { label: 'تاريخ التسليم', value: student.submittedAt ? new Date(student.submittedAt).toLocaleDateString('ar-EG') : '-' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{item.label}</div>
                  <div style={{ fontWeight: '700', color: '#1a1a1a', fontSize: '15px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weakness analysis */}
        {weaknessData.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a' }}>📊 تحليل الوحدات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {weaknessData.map((unit, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>{unit.unitAr}</span>
                    <span style={{ fontWeight: '700', color: unit.percentage >= 80 ? '#2E7D32' : unit.percentage >= 60 ? '#E65100' : '#C62828' }}>
                      {unit.correct}/{unit.total} ({unit.percentage}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${unit.percentage}%`, background: unit.percentage >= 80 ? '#4CAF50' : unit.percentage >= 60 ? '#FF9800' : '#EF4444', borderRadius: '100px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {questions.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setActiveSection('overview')} style={{ padding: '10px 20px', background: activeSection === 'overview' ? '#DA291C' : 'white', color: activeSection === 'overview' ? 'white' : '#374151', border: `2px solid ${activeSection === 'overview' ? '#DA291C' : '#E5E7EB'}`, borderRadius: '10px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer' }}>
                ملخص
              </button>
              <button onClick={() => setActiveSection('questions')} style={{ padding: '10px 20px', background: activeSection === 'questions' ? '#DA291C' : 'white', color: activeSection === 'questions' ? 'white' : '#374151', border: `2px solid ${activeSection === 'questions' ? '#DA291C' : '#E5E7EB'}`, borderRadius: '10px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer' }}>
                جميع الأسئلة ({questions.length})
              </button>
            </div>

            {/* Questions detail */}
            {activeSection === 'questions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, idx) => {
                  const studentAnswer = answers[q.id];
                  const isCorrect = studentAnswer === q.correctAnswer;
                  const notAnswered = studentAnswer === undefined;
                  return (
                    <div key={q.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${isCorrect ? '#A5D6A7' : notAnswered ? '#E5E7EB' : '#FFCDD2'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>{q.unitAr} · سؤال {idx + 1}</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', lineHeight: '1.6' }}>{q.question}</div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', background: isCorrect ? '#E8F5E9' : notAnswered ? '#F3F4F6' : '#FFEBEE', color: isCorrect ? '#2E7D32' : notAnswered ? '#9CA3AF' : '#C62828', whiteSpace: 'nowrap' }}>
                          {isCorrect ? '✓ صحيح' : notAnswered ? 'لم يجب' : '✗ خطأ'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.choices.map((choice, ci) => {
                          const isCorrectChoice = ci === q.correctAnswer;
                          const isStudentChoice = ci === studentAnswer;
                          let bg = '#F9FAFB', border = '#E5E7EB', color = '#374151';
                          if (isCorrectChoice) { bg = '#E8F5E9'; border = '#4CAF50'; color = '#2E7D32'; }
                          else if (isStudentChoice && !isCorrect) { bg = '#FFEBEE'; border = '#EF4444'; color = '#C62828'; }
                          const letters = ['أ', 'ب', 'ج', 'د'];
                          return (
                            <div key={ci} style={{ padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color }}>
                              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: border, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{letters[ci]}</span>
                              {choice}
                              {isCorrectChoice && <span style={{ marginRight: 'auto', fontSize: '12px' }}>✓ الإجابة الصحيحة</span>}
                              {isStudentChoice && !isCorrect && <span style={{ marginRight: 'auto', fontSize: '12px' }}>← إجابة الطالب</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
