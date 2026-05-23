'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string; name: string; restaurant: string; startedAt: string; submittedAt?: string;
  score?: number; totalQuestions?: number; percentage?: number; passed?: boolean;
  timeSpent?: number; tabSwitches?: number; status: string; suspiciousEvents?: { type: string }[];
}
interface Stats { total: number; completed: number; passed: number; failed: number; highest: number; lowest: number; }
interface Settings { username: string; passingPercentage: number; examDurationMinutes: number; questionsCount: number; logoUrl?: string; signatureUrl?: string; }

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'settings'>('results');
  const [search, setSearch] = useState('');
  const [settingsForm, setSettingsForm] = useState({ username: '', password: '', passingPercentage: 80, examDurationMinutes: 60, questionsCount: 55, logoUrl: '', signatureUrl: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'started'>('all');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/admin/login'); return; }
    try {
      const [studentsRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/results', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/results?type=stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (studentsRes.status === 401) { router.push('/admin/login'); return; }
      const [studs, sts, setts] = await Promise.all([studentsRes.json(), statsRes.json(), settingsRes.json()]);
      setStudents(studs);
      setStats(sts);
      setSettings(setts);
      setSettingsForm(prev => ({ ...prev, username: setts.username, passingPercentage: setts.passingPercentage, examDurationMinutes: setts.examDurationMinutes, questionsCount: setts.questionsCount, logoUrl: setts.logoUrl || '', signatureUrl: setts.signatureUrl || '' }));
    } catch { router.push('/admin/login'); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا الطالب؟')) return;
    const token = getToken();
    await fetch(`/api/admin/results?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  }

  async function handleDeleteAll() {
    const token = getToken();
    await fetch('/api/admin/results?all=true', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setConfirmDeleteAll(false);
    fetchData();
  }

  async function handleSaveSettings() {
    const token = getToken();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) { setSaveMsg('✅ تم الحفظ بنجاح'); fetchData(); setTimeout(() => setSaveMsg(''), 3000); }
    else setSaveMsg('❌ خطأ في الحفظ');
  }

  function exportCSV() {
    const headers = ['الاسم', 'المطعم', 'الحالة', 'النتيجة', 'النسبة', 'ناجح/راسب', 'وقت الامتحان', 'تبديل التبويب', 'تاريخ التسليم'];
    const rows = filteredStudents.map(s => [
      s.name, s.restaurant,
      s.status === 'completed' ? 'مكتمل' : s.status === 'timeout' ? 'انتهى الوقت' : 'في التقدم',
      s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-',
      s.percentage !== undefined ? `${s.percentage}%` : '-',
      s.passed === true ? 'ناجح' : s.passed === false ? 'راسب' : '-',
      s.timeSpent ? `${Math.floor(s.timeSpent / 60)}:${String(s.timeSpent % 60).padStart(2, '0')}` : '-',
      s.tabSwitches || 0,
      s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('ar-EG') : '-',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mcdo_results.csv'; a.click();
  }

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.includes(search) || s.restaurant.includes(search);
    if (filterStatus === 'passed') return matchSearch && s.passed === true;
    if (filterStatus === 'failed') return matchSearch && s.passed === false;
    if (filterStatus === 'started') return matchSearch && s.status === 'started';
    return matchSearch;
  }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const formatTime = (secs?: number) => {
    if (!secs) return '-';
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #DA291C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280' }}>جاري التحميل...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Tajawal', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#DA291C,#B71C1C)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#FFC72C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#DA291C', fontSize: '20px' }}>M</div>
          <div>
            <div style={{ color: '#FFC72C', fontWeight: '900', fontSize: '18px' }}>لوحة الإدارة</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>ماكدونالدز مصر</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '10px', fontFamily: 'Tajawal', cursor: 'pointer', fontSize: '14px' }}>
          تسجيل الخروج
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'إجمالي الطلاب', value: stats.total, color: '#1a1a1a', bg: 'white', icon: '👥' },
              { label: 'أكملوا الامتحان', value: stats.completed, color: '#1565C0', bg: '#E3F2FD', icon: '📝' },
              { label: 'الناجحون', value: stats.passed, color: '#2E7D32', bg: '#E8F5E9', icon: '✅' },
              { label: 'الراسبون', value: stats.failed, color: '#C62828', bg: '#FFEBEE', icon: '❌' },
              { label: 'أعلى درجة', value: `${stats.highest}%`, color: '#E65100', bg: '#FFF3E0', icon: '🏆' },
              { label: 'أدنى درجة', value: `${stats.lowest}%`, color: '#4A148C', bg: '#F3E5F5', icon: '📊' },
            ].map((card, i) => (
              <div key={i} style={{ background: card.bg, borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[{ id: 'results', label: '📊 النتائج' }, { id: 'settings', label: '⚙️ الإعدادات' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'results' | 'settings')} style={{ padding: '10px 20px', background: activeTab === tab.id ? '#DA291C' : 'white', color: activeTab === tab.id ? 'white' : '#374151', border: `2px solid ${activeTab === tab.id ? '#DA291C' : '#E5E7EB'}`, borderRadius: '10px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو المطعم..." style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '10px', fontFamily: 'Tajawal', fontSize: '14px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ id: 'all', label: 'الكل' }, { id: 'passed', label: '✅ ناجح' }, { id: 'failed', label: '❌ راسب' }, { id: 'started', label: '⏳ جاري' }].map(f => (
                  <button key={f.id} onClick={() => setFilterStatus(f.id as 'all' | 'passed' | 'failed' | 'started')} style={{ padding: '8px 14px', background: filterStatus === f.id ? '#DA291C' : '#F3F4F6', color: filterStatus === f.id ? 'white' : '#374151', border: 'none', borderRadius: '8px', fontFamily: 'Tajawal', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={exportCSV} style={{ padding: '8px 16px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                  📥 تصدير CSV
                </button>
                <button onClick={() => setConfirmDeleteAll(true)} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                  🗑️ حذف الكل
                </button>
              </div>
            </div>

            {/* Delete All Confirm */}
            {confirmDeleteAll && (
              <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ color: '#B71C1C', fontWeight: '700', fontSize: '14px' }}>⚠️ هل أنت متأكد من حذف جميع النتائج؟ لا يمكن التراجع!</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmDeleteAll(false)} style={{ padding: '8px 16px', background: '#F3F4F6', border: 'none', borderRadius: '8px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer' }}>إلغاء</button>
                  <button onClick={handleDeleteAll} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'Tajawal', fontWeight: '700', cursor: 'pointer' }}>نعم، احذف الكل</button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '16px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  لا توجد نتائج
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                        {['#', 'الاسم', 'المطعم', 'الدرجة', 'النسبة', 'النتيجة', 'الوقت', 'التبويب', 'الحالة', 'إجراء'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = '#FFF8F8')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#9CA3AF' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1a1a1a' }}>
                            {s.name}
                            {s.tabSwitches && s.tabSwitches > 3 && <span style={{ marginRight: '4px', fontSize: '12px', color: '#EF4444' }}>⚠️</span>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6B7280' }}>{s.restaurant}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700' }}>
                            {s.score !== undefined ? `${s.score}/${s.totalQuestions}` : '-'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {s.percentage !== undefined ? (
                              <span style={{ background: s.percentage >= (settings?.passingPercentage || 80) ? '#E8F5E9' : '#FFEBEE', color: s.percentage >= (settings?.passingPercentage || 80) ? '#2E7D32' : '#C62828', padding: '4px 10px', borderRadius: '100px', fontWeight: '700', fontSize: '13px' }}>
                                {s.percentage}%
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {s.passed === true ? '✅ ناجح' : s.passed === false ? '❌ راسب' : '⏳'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>{formatTime(s.timeSpent)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ color: s.tabSwitches && s.tabSwitches > 0 ? '#EF4444' : '#9CA3AF' }}>{s.tabSwitches || 0}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '100px', background: s.status === 'completed' ? '#E8F5E9' : s.status === 'timeout' ? '#FFF3E0' : '#EDE9FE', color: s.status === 'completed' ? '#2E7D32' : s.status === 'timeout' ? '#E65100' : '#5B21B6' }}>
                              {s.status === 'completed' ? 'مكتمل' : s.status === 'timeout' ? 'انتهى الوقت' : 'جاري'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button onClick={() => router.push(`/admin/student/${s.id}`)} style={{ padding: '6px 12px', background: '#EDE9FE', color: '#5B21B6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'Tajawal' }}>
                                عرض
                              </button>
                              <button onClick={() => handleDelete(s.id)} style={{ padding: '6px 10px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && settings && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: '#1a1a1a' }}>إعدادات النظام</h2>
            {saveMsg && <div style={{ padding: '12px 16px', background: saveMsg.includes('✅') ? '#E8F5E9' : '#FFEBEE', borderRadius: '10px', marginBottom: '16px', fontWeight: '700', color: saveMsg.includes('✅') ? '#2E7D32' : '#C62828' }}>{saveMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { label: 'اسم المستخدم', key: 'username', type: 'text' },
                { label: 'كلمة المرور الجديدة (اتركها فارغة إذا لم تريد التغيير)', key: 'password', type: 'password' },
                { label: 'نسبة النجاح (%)', key: 'passingPercentage', type: 'number' },
                { label: 'مدة الامتحان (دقيقة)', key: 'examDurationMinutes', type: 'number' },
                { label: 'عدد الأسئلة', key: 'questionsCount', type: 'number' },
                { label: 'رابط اللوجو', key: 'logoUrl', type: 'url' },
                { label: 'رابط التوقيع', key: 'signatureUrl', type: 'url' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={(settingsForm as Record<string, unknown>)[field.key] as string}
                    onChange={e => setSettingsForm(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '10px', fontFamily: 'Tajawal', fontSize: '15px', outline: 'none', boxSizing: 'border-box', direction: field.type === 'text' || field.type === 'password' ? 'ltr' : 'rtl' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSaveSettings} style={{ marginTop: '24px', padding: '14px 32px', background: 'linear-gradient(135deg,#DA291C,#B71C1C)', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Tajawal', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
              💾 حفظ الإعدادات
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
