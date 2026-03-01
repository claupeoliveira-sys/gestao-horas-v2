import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function POST(req) {
  const session = await getSession();
  if (!session?.personId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Nova senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }
    await connectDB();
    const person = await Person.findById(session.personId).select('passwordHash mustChangePassword');
    if (!person || !person.passwordHash) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const valid = await compare(currentPassword, person.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }
    const passwordHash = await hash(newPassword, 10);
    await Person.findByIdAndUpdate(session.personId, { passwordHash, mustChangePassword: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Change password error', e);
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}
