import connectDB from '@/lib/mongodb';
import Epic from '@/lib/models/Epic';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const filter = projectId ? { projectId } : {};
  const epics = await Epic.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(epics);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const epic = await Epic.create(body);
  return NextResponse.json(epic, { status: 201 });
}
