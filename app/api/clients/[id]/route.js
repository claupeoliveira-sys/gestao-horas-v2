import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const client = await Client.findByIdAndUpdate(params.id, body, { new: true });
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const client = await Client.findByIdAndDelete(params.id);
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
