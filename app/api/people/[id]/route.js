import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const { passwordPlain, ...rest } = body;
  const update = { ...rest };
  if (update.username) update.username = update.username.trim().toLowerCase();
  if (update.hasLogin && update.username && passwordPlain) {
    update.passwordHash = await hash(passwordPlain, 10);
    update.mustChangePassword = true;
  }
  delete update.passwordHash; // never send raw
  const person = await Person.findByIdAndUpdate(params.id, update, { new: true })
    .select('-passwordHash')
    .populate('teamId', 'name');
  if (!person) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(person);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const person = await Person.findByIdAndDelete(params.id);
  if (!person) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
