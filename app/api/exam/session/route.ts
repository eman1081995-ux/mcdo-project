import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent } from '@/lib/db';
import { getSettings } from '@/lib/db';

// Save exam progress
export async function POST(req: NextRequest) {
  try {
    const { studentId, answers, currentQuestion, tabSwitches, suspiciousEvents } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });
    }
    
    const student = getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
    }
    
    if (student.status === 'completed') {
      return NextResponse.json({ error: 'تم تسليم الامتحان مسبقاً' }, { status: 400 });
    }
    
    updateStudent(studentId, {
      answers: answers || student.answers,
      tabSwitches: tabSwitches ?? student.tabSwitches,
      suspiciousEvents: suspiciousEvents || student.suspiciousEvents,
    });
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطأ في حفظ البيانات' }, { status: 500 });
  }
}

// Get exam session (restore)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  
  if (!studentId) {
    return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });
  }
  
  const student = getStudentById(studentId);
  if (!student) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
  }
  
  if (student.status === 'completed') {
    return NextResponse.json({ completed: true });
  }
  
  const settings = getSettings();
  const startTime = new Date(student.startedAt).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const totalSeconds = settings.examDurationMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  
  if (remainingSeconds === 0) {
    return NextResponse.json({ expired: true, studentId });
  }
  
  return NextResponse.json({
    studentId: student.id,
    name: student.name,
    restaurant: student.restaurant,
    questions: student.examModel?.questions.map(q => ({
      id: q.id,
      question: q.question,
      choices: q.choices,
      unit: q.unit,
      unitAr: q.unitAr,
    })) || [],
    answers: student.answers || {},
    remainingSeconds,
    startedAt: student.startedAt,
    examDurationMinutes: settings.examDurationMinutes,
  });
}
