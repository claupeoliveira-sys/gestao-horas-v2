import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const person = await Person.findByIdAndUpdate(params.id, body, { new: true })
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
