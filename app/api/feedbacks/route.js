import connectDB from '@/lib/mongodb';
import Feedback from '@/lib/models/Feedback';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get('personId');
  const projectId = searchParams.get('projectId');
  const type = searchParams.get('type');
  const followUpStatus = searchParams.get('followUpStatus');
  const filter = {};
  if (personId) filter.personId = personId;
  if (projectId) filter.projectId = projectId;
  if (type) filter.type = type;
  if (followUpStatus) filter.followUpStatus = followUpStatus;
  const feedbacks = await Feedback.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .populate('personId', 'name')
    .populate('projectId', 'name');
  return NextResponse.json(feedbacks);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const payload = {
    ...body,
    projectId: body.projectId || undefined,
    rating: body.rating ? Number(body.rating) : undefined,
    followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
    tags: typeof body.tags === 'string' ? body.tags.trim() : (Array.isArray(body.tags) ? body.tags.join(', ') : ''),
  };
  const feedback = await Feedback.create(payload);
  return NextResponse.json(feedback, { status: 201 });
}
