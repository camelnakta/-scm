import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { generateId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    return NextResponse.json(db.workOrders);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request);
    const body = await request.json();
    const { processId, productName, targetQty, priority, plannedStart, plannedEnd, assignedTo, notes } = body;

    if (!processId || !productName || !targetQty) {
      return NextResponse.json({ error: '공정, 제품명, 수량은 필수입니다.' }, { status: 400 });
    }

    const proc = db.processes.find(p => p.id === processId);
    if (!proc) return NextResponse.json({ error: '공정을 찾을 수 없습니다.' }, { status: 404 });

    const count = db.workOrders.length + 1;
    const workOrderNo = `WO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const steps = proc.steps.map(s => ({
      stepNo: s.stepNo,
      stepName: s.name,
      status: 'pending' as const,
      startedAt: '',
      completedAt: '',
      progressRate: 0,
      workerName: '',
      note: '',
      defectCount: 0,
    }));

    const newWO = {
      id: generateId(),
      workOrderNo,
      processId,
      processName: proc.name,
      productName,
      targetQty: Number(targetQty),
      completedQty: 0,
      defectQty: 0,
      priority: priority || 'normal',
      status: 'pending' as const,
      progressRate: 0,
      currentStep: 0,
      steps,
      plannedStart: plannedStart || '',
      plannedEnd: plannedEnd || '',
      actualStart: '',
      actualEnd: '',
      assignedTo: assignedTo || '',
      createdBy: authUser.username,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    db.workOrders.push(newWO);
    return NextResponse.json(newWO, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
