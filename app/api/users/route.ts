import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/middleware';
import { generateId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAdmin(request);
    void authUser;

    const users = db.users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      status: u.status,
      createdAt: u.createdAt,
      createdBy: u.createdBy,
    }));

    return NextResponse.json(users);
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

export async function POST(request: NextRequest) {
  try {
    const authUser = requireAdmin(request);

    const { username, password, name, email, role, department } = await request.json();

    if (!username || !password || !name || !email || !role || !department) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 });
    }

    const existingEmail = db.users.find(u => u.email === email);
    if (existingEmail) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: generateId(),
      username,
      password: hashedPassword,
      name,
      email,
      role: role as 'admin' | 'user',
      department,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      createdBy: authUser.username,
    };

    db.users.push(newUser);

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      status: newUser.status,
      createdAt: newUser.createdAt,
      createdBy: newUser.createdBy,
    }, { status: 201 });
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
