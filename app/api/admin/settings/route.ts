import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, hashPassword } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const settings = getSettings();
  const { passwordHash: _, ...safe } = settings;
  return NextResponse.json(safe);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    
    if (body.username) updates.username = body.username;
    if (body.password) updates.passwordHash = hashPassword(body.password);
    if (body.passingPercentage !== undefined) updates.passingPercentage = Number(body.passingPercentage);
    if (body.examDurationMinutes !== undefined) updates.examDurationMinutes = Number(body.examDurationMinutes);
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
    if (body.signatureUrl !== undefined) updates.signatureUrl = body.signatureUrl;
    if (body.homepageBannerUrl !== undefined) updates.homepageBannerUrl = body.homepageBannerUrl;
    if (body.dashboardHeaderUrl !== undefined) updates.dashboardHeaderUrl = body.dashboardHeaderUrl;
    if (body.questionsCount !== undefined) updates.questionsCount = Number(body.questionsCount);
    
    updateSettings(updates as Parameters<typeof updateSettings>[0]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
