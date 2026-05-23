import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent, getSettings } from '@/lib/db';
import { scoreExam, getWeaknessAnalysis } from '@/lib/exam-engine';

export async function POST(req: NextRequest) {
  try {
    const { studentId, answers, tabSwitches, suspiciousEvents, autoSubmit } = await req.json();
    
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
    
    if (!student.examModel) {
      return NextResponse.json({ error: 'لم يتم بدء الامتحان بشكل صحيح' }, { status: 400 });
    }
    
    const settings = getSettings();
    const finalAnswers = answers || student.answers || {};
    
    const { score, total, percentage } = scoreExam(student.examModel.questions, finalAnswers);
    const passed = percentage >= settings.passingPercentage;
    
    const startTime = new Date(student.startedAt).getTime();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    const updatedStudent = updateStudent(studentId, {
      answers: finalAnswers,
      score,
      totalQuestions: total,
      percentage,
      passed,
      timeSpent,
      submittedAt: new Date().toISOString(),
      status: autoSubmit ? 'timeout' : 'completed',
      tabSwitches: tabSwitches ?? student.tabSwitches ?? 0,
      suspiciousEvents: suspiciousEvents || student.suspiciousEvents || [],
      certificateGenerated: passed,
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم استلام الامتحان بنجاح',
    });
    
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'خطأ في تسليم الامتحان' }, { status: 500 });
  }
}
