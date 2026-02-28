import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const projects = await Project.find()
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
