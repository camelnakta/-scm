import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const item = db.workOrders.find(w => w.id === id);
    if (!item) return NextResponse.json({ error: '작업지시를 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.workOrders.findIndex(w => w.id === id);
    if (idx === -1) return NextResponse.json({ error: '작업지시를 찾을 수 없습니다.' }, { status: 404 });
    const body = await request.json();

    const wo = db.workOrders[idx];

    // 단계별 진행도 업데이트 시 전체 진행률 재계산
    if (body.steps) {
      const steps = body.steps;
      const totalSteps = steps.length;
      const totalRate = steps.reduce((sum: number, s: { progressRate: number }) => sum + s.progressRate, 0);
      body.progressRate = totalSteps > 0 ? Math.round(totalRate / totalSteps) : 0;

      // 현재 진행 단계 계산
      const inProgressStep = steps.find((s: { status: string }) => s.status === 'in_progress');
      const lastCompleted = [...steps].reverse().find((s: { status: string }) => s.status === 'completed');
      body.currentStep = inProgressStep?.stepNo ?? (lastCompleted?.stepNo ?? 0);

      // 전체 상태 자동 갱신
      const allDone = steps.every((s: { status: string }) => s.status === 'completed' || s.status === 'skipped');
      const anyInProgress = steps.some((s: { status: string }) => s.status === 'in_progress');
      if (allDone && wo.status !== 'cancelled') {
        body.status = 'completed';
        body.actualEnd = new Date().toISOString();
      } else if (anyInProgress && wo.status === 'pending') {
        body.status = 'in_progress';
        if (!wo.actualStart) body.actualStart = new Date().toISOString();
      }
    }

    db.workOrders[idx] = { ...wo, ...body };
    return NextResponse.json(db.workOrders[idx]);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const idx = db.workOrders.findIndex(w => w.id === id);
    if (idx === -1) return NextResponse.json({ error: '작업지시를 찾을 수 없습니다.' }, { status: 404 });
    db.workOrders.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
