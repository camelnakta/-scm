import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { generateId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    return NextResponse.json(db.equipment);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request);
    const body = await request.json();
    const { name, category, location, assignedProcess } = body;
    if (!name || !category) return NextResponse.json({ error: '설비명과 분류는 필수입니다.' }, { status: 400 });

    const count = db.equipment.length + 1;
    const newEqp = {
      id: generateId(),
      equipmentCode: `EQP-${String(count).padStart(3, '0')}`,
      name, category,
      location: location || '',
      status: 'idle' as const,
      utilizationRate: 0,
      lastMaintenance: '',
      nextMaintenance: body.nextMaintenance || '',
      assignedProcess: assignedProcess || '',
    };
    db.equipment.push(newEqp);
    return NextResponse.json(newEqp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
