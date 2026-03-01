import connectDB from '@/lib/mongodb';
import Epic from '@/lib/models/Epic';
import Project from '@/lib/models/Project';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  await connectDB();
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  let filter = projectId ? { projectId } : {};
  if (session?.profileRole === 'user' && session?.personId) {
    const projectIds = await Project.find({ memberIds: session.personId }).distinct('_id');
    if (projectId) {
      if (!projectIds.some((id) => id.toString() === projectId)) filter.projectId = 'none';
    } else {
      filter.projectId = { $in: projectIds };
    }
  }
  const epics = await Epic.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(epics);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const epic = await Epic.create(body);
  return NextResponse.json(epic, { status: 201 });
}
