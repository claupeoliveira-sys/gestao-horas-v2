import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const team = await Team.findByIdAndUpdate(params.id, body, { new: true });
  if (!team) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(team);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const team = await Team.findByIdAndDelete(params.id);
  if (!team) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
