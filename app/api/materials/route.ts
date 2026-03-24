import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { generateId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    return NextResponse.json(db.materials);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAuth(request);
    const body = await request.json();
    const { name, category, unit, stockQty, minQty, unitCost, supplierId, supplierName, location } = body;
    if (!name || !category) return NextResponse.json({ error: '자재명과 분류는 필수입니다.' }, { status: 400 });

    const count = db.materials.length + 1;
    const qty = Number(stockQty) || 0;
    const min = Number(minQty) || 0;
    const newMat = {
      id: generateId(),
      materialCode: `MAT-${String(count).padStart(3, '0')}`,
      name, category,
      unit: unit || 'EA',
      stockQty: qty,
      minQty: min,
      unitCost: Number(unitCost) || 0,
      supplierId: supplierId || '',
      supplierName: supplierName || '',
      location: location || '',
      status: (qty === 0 ? 'out' : qty < min ? 'low' : 'normal') as 'normal' | 'low' | 'out',
      lastUpdated: new Date().toISOString(),
    };
    db.materials.push(newMat);
    return NextResponse.json(newMat, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
