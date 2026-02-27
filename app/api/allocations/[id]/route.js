import connectDB from '@/lib/mongodb';
import Allocation from '@/lib/models/Allocation';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const allocation = await Allocation.findByIdAndUpdate(
    params.id,
    body,
    { new: true }
  )
    .populate('personId', 'name email role')
    .populate('projectId', 'name client');
  if (!allocation) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(allocation);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const allocation = await Allocation.findByIdAndDelete(params.id);
  if (!allocation) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
