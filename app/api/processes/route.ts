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
    const { name, category, description, steps } = body;
    if (!name || !category) return NextResponse.json({ error: '공정명과 분류는 필수입니다.' }, { status: 400 });

    const count = db.processes.length + 1;
    const newProcess = {
      id: generateId(),
      processCode: `PROC-${String(count).padStart(3, '0')}`,
      name, category,
      description: description || '',
      steps: steps || [],
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
