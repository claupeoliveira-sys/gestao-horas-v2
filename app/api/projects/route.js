import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  await connectDB();
  const session = await getSession();
  const filter = {};
  if (session?.profileRole === 'user' && session?.personId) {
    filter.memberIds = session.personId;
  }
  const projects = await Project.find(filter)
    .populate('memberIds', 'name email role')
    .populate('clientId', 'name')
    .sort({ createdAt: -1 });
  return NextResponse.json(projects);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const project = await Project.create(body);
  const populated = await Project.findById(project._id)
    .populate('memberIds', 'name email role')
    .populate('clientId', 'name');
  return NextResponse.json(populated || project, { status: 201 });
}
