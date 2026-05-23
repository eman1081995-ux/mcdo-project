import { NextRequest, NextResponse } from 'next/server';
import { isDeviceBlocked, isStudentBlocked, createStudent } from '@/lib/db';
import { generateExamModel } from '@/lib/exam-engine';
import { getSettings } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, restaurant, deviceFingerprint } = await req.json();
    
    if (!name?.trim() || !restaurant?.trim()) {
      return NextResponse.json({ error: 'الاسم واسم المطعم مطلوبان' }, { status: 400 });
    }
    
    if (!deviceFingerprint) {
      return NextResponse.json({ error: 'لا يمكن التحقق من الجهاز' }, { status: 400 });
    }
    
    // Check if device or student is blocked
    if (isDeviceBlocked(deviceFingerprint)) {
      return NextResponse.json({ 
        error: 'لقد أكملت الامتحان مسبقاً من هذا الجهاز. لا يمكن إعادة الامتحان.',
        blocked: true 
      }, { status: 403 });
    }
    
    if (isStudentBlocked(name.trim(), restaurant.trim())) {
      return NextResponse.json({ 
        error: 'لقد أكمل هذا الطالب الامتحان مسبقاً. لا يمكن إعادة الامتحان.',
        blocked: true 
      }, { status: 403 });
    }
    
    const settings = getSettings();
    const examModel = generateExamModel(settings.questionsCount || 55);
    
    const student = createStudent({
      name: name.trim(),
      restaurant: restaurant.trim(),
      deviceFingerprint,
      startedAt: new Date().toISOString(),
      examModel,
      answers: {},
      tabSwitches: 0,
      suspiciousEvents: [],
      status: 'started',
    });
    
    return NextResponse.json({
      studentId: student.id,
      questions: examModel.questions.map(q => ({
        id: q.id,
        question: q.question,
        choices: q.choices,
        unit: q.unit,
        unitAr: q.unitAr,
        // DO NOT send correctAnswer to client
      })),
      examDurationMinutes: settings.examDurationMinutes,
      startedAt: student.startedAt,
    });
    
  } catch (error) {
    console.error('Exam start error:', error);
    return NextResponse.json({ error: 'خطأ في بدء الامتحان' }, { status: 500 });
  }
}
