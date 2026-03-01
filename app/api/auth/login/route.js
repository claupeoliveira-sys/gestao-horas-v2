import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { encodeSession, COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 });
    }
    await connectDB();
    const person = await Person.findOne({ username: (username || '').trim().toLowerCase(), hasLogin: true });
    if (!person || !person.passwordHash) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
    }
    const ok = await compare(password, person.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
    }
    if (person.active === false) {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 403 });
    }
    const token = encodeSession({
      personId: person._id.toString(),
      profileRole: person.profileRole || 'user',
      name: person.name || username,
    });
    const res = NextResponse.json({
      ok: true,
      mustChangePassword: person.mustChangePassword === true,
      name: person.name,
      profileRole: person.profileRole,
    });
    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (e) {
    console.error('Login error', e);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
