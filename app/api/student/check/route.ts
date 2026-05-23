import { NextRequest, NextResponse } from 'next/server';
import { isDeviceBlocked, isStudentBlocked } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, restaurant, deviceFingerprint } = await req.json();
    
    if (deviceFingerprint && isDeviceBlocked(deviceFingerprint)) {
      return NextResponse.json({ blocked: true, reason: 'device' });
    }
    
    if (name && restaurant && isStudentBlocked(name.trim(), restaurant.trim())) {
      return NextResponse.json({ blocked: true, reason: 'student' });
    }
    
    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
