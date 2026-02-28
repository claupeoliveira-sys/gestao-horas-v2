import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const project = await Project.findByIdAndUpdate(params.id, body, { new: true })
    .populate('memberIds', 'name email role')
    .populate('clientId', 'name');
  if (!project) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(project);
}
