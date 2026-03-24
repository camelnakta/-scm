import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const user = db.users[userIndex];

    if (body.username && body.username !== user.username) {
      const existing = db.users.find(u => u.username === body.username && u.id !== id);
      if (existing) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 });
      }
    }

    if (body.email && body.email !== user.email) {
      const existing = db.users.find(u => u.email === body.email && u.id !== id);
      if (existing) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
      }
    }

    const updatedUser = {
      ...user,
      username: body.username || user.username,
      name: body.name || user.name,
      email: body.email || user.email,
      role: body.role || user.role,
      department: body.department || user.department,
      status: body.status !== undefined ? body.status : user.status,
    };

    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
      }
      updatedUser.password = await bcrypt.hash(body.password, 10);
    }

    db.users[userIndex] = updatedUser;

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      createdBy: updatedUser.createdBy,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = requireAdmin(request);
    const { id } = await params;

    if (authUser.userId === id) {
      return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });
    }

    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    db.users.splice(userIndex, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
