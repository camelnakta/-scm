import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.equipment.findIndex(e => e.id === id);
    if (idx === -1) return NextResponse.json({ error: '설비를 찾을 수 없습니다.' }, { status: 404 });
    const body = await request.json();
    db.equipment[idx] = { ...db.equipment[idx], ...body };
    return NextResponse.json(db.equipment[idx]);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.equipment.findIndex(e => e.id === id);
    if (idx === -1) return NextResponse.json({ error: '설비를 찾을 수 없습니다.' }, { status: 404 });
    db.equipment.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
