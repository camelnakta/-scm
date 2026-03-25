import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { generateId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    return NextResponse.json(db.processes);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request);
    const body = await request.json();
    const { pn, matCode, name, category, customer, project, description, steps } = body;

    if (!name) return NextResponse.json({ error: '품명은 필수입니다.' }, { status: 400 });

    const count = db.processes.length + 1;
    const newProcess = {
      id: generateId(),
      processCode: `PROC-${String(count).padStart(4, '0')}`,
      pn: pn || '',
      matCode: matCode || '',
      name,
      category: category || '기타',
      customer: customer || '',
      project: project || '',
      description: description || '',
      // steps: stepNo 순 정렬, company 필드 보장
      steps: (steps || [])
        .map((s: { stepNo?: number; name?: string; company?: string; description?: string; stdTime?: number; equipmentId?: string; equipmentName?: string }) => ({
          stepNo: Number(s.stepNo) || 10,
          name: s.name || '',
          company: s.company || '',
          description: s.description || '',
          stdTime: Number(s.stdTime) || 0,
          equipmentId: s.equipmentId || '',
          equipmentName: s.equipmentName || '',
        }))
        .sort((a: { stepNo: number }, b: { stepNo: number }) => a.stepNo - b.stepNo),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      createdBy: authUser.username,
    };
    db.processes.push(newProcess);
    return NextResponse.json(newProcess, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
