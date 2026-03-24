import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const item = db.processes.find(p => p.id === id);
    if (!item) return NextResponse.json({ error: '공정을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.processes.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: '공정을 찾을 수 없습니다.' }, { status: 404 });
    const body = await request.json();
    db.processes[idx] = { ...db.processes[idx], ...body };
    return NextResponse.json(db.processes[idx]);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.processes.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: '공정을 찾을 수 없습니다.' }, { status: 404 });
    db.processes.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
