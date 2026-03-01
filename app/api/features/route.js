import connectDB from '@/lib/mongodb';
import Feature from '@/lib/models/Feature';
import Project from '@/lib/models/Project';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  await connectDB();
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const epicId = searchParams.get('epicId');
  const projectId = searchParams.get('projectId');
  const filter = {};
  if (epicId) filter.epicId = epicId;
  if (projectId) filter.projectId = projectId;
  if (session?.profileRole === 'user' && session?.personId) {
    const projectIds = await Project.find({ memberIds: session.personId }).distinct('_id');
    if (projectId) {
      if (!projectIds.some((id) => id.toString() === projectId)) filter.projectId = 'none';
    } else {
      filter.projectId = { $in: projectIds };
    }
  }
  const features = await Feature.find(filter)
    .populate('analystIds', 'name email')
    .sort({ createdAt: -1 });
  return NextResponse.json(features);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  if (!body.code && body.projectId) {
    const count = await Feature.countDocuments({ projectId: body.projectId });
    body.code = `FEAT-${String(count + 1).padStart(3, '0')}`;
  }
  const feature = await Feature.create(body);
  return NextResponse.json(feature, { status: 201 });
}
