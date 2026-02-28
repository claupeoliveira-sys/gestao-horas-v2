import connectDB from '@/lib/mongodb';
import Epic from '@/lib/models/Epic';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const epic = await Epic.findByIdAndUpdate(params.id, body, { new: true });
  if (!epic) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(epic);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const epic = await Epic.findByIdAndDelete(params.id);
  if (!epic) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
