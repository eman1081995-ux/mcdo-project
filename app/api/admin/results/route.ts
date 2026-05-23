import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, getStats, deleteStudent, deleteAllStudents, getStudentById } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  if (type === 'stats') {
    return NextResponse.json(getStats());
  }
  
  if (type === 'student') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'معرف مطلوب' }, { status: 400 });
    const student = getStudentById(id);
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
    return NextResponse.json(student);
  }
  
  const students = getAllStudents();
  return NextResponse.json(students);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all');
  
  if (all === 'true') {
    deleteAllStudents();
    return NextResponse.json({ success: true });
  }
  
  if (id) {
    deleteStudent(id);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'معرف مطلوب' }, { status: 400 });
}
