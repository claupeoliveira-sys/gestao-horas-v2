import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function POST() {
  await connectDB();
  const existing = await Person.findOne({ username: 'admin', hasLogin: true });
  if (existing) {
    return NextResponse.json({ message: 'Usuário admin já existe', ok: true });
  }
  const passwordHash = await hash('admin', 10);
  await Person.create({
    name: 'Admin',
    username: 'admin',
    passwordHash,
    hasLogin: true,
    profileRole: 'admin',
    mustChangePassword: true,
    active: true,
  });
  return NextResponse.json({ message: 'Usuário admin criado (login: admin, senha: admin). Troque a senha no primeiro acesso.', ok: true });
}
