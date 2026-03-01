import connectDB from '@/lib/mongodb';
import ProjectLog from '@/lib/models/ProjectLog';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const filter = projectId ? { projectId } : {};
  const logs = await ProjectLog.find(filter).sort({ date: -1, createdAt: -1 });
  return NextResponse.json(logs);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const payload = {
    projectId: body.projectId,
    date: body.date,
    source: body.source,
    content: body.content,
    nextSteps: body.nextSteps || undefined,
    decisions: body.decisions || undefined,
  };
  const log = await ProjectLog.create(payload);
  return NextResponse.json(log, { status: 201 });
}
