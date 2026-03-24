import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.materials.findIndex(m => m.id === id);
    if (idx === -1) return NextResponse.json({ error: '자재를 찾을 수 없습니다.' }, { status: 404 });
    const body = await request.json();
    const qty = body.stockQty !== undefined ? Number(body.stockQty) : db.materials[idx].stockQty;
    const min = body.minQty !== undefined ? Number(body.minQty) : db.materials[idx].minQty;
    body.status = qty === 0 ? 'out' : qty < min ? 'low' : 'normal';
    body.lastUpdated = new Date().toISOString();
    db.materials[idx] = { ...db.materials[idx], ...body };
    return NextResponse.json(db.materials[idx]);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.materials.findIndex(m => m.id === id);
    if (idx === -1) return NextResponse.json({ error: '자재를 찾을 수 없습니다.' }, { status: 404 });
    db.materials.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
